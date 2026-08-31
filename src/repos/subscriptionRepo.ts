import type { SqlDb, SqlValue } from '../db/adapter';
import {
  addDaysYMD,
  calcNextBilling,
  formatISODate,
  formatYMD,
  fromLocalDate,
} from '../domain/date';
import { toMonthly, toYearly } from '../domain/money';
import type { Currency, Cycle, Subscription, SubscriptionRow, SubscriptionStatus } from '../domain/types';
import { rowToSubscription } from '../domain/types';
import { getUsdRate } from './settingsRepo';
import { uuid } from '../lib/uuid';

export interface CreateSubscriptionInput {
  name: string;
  category: string;
  amount: number;
  currency?: Currency;
  cycle: Cycle;
  cycleCount?: number;
  /** ISO date (YYYY-MM-DD). 최초 결제일 */
  anchorDate: string;
  status?: SubscriptionStatus;
  trialEndAt?: string | null;
  memo?: string | null;
  /** 일 단위 알림 오프셋. null이면 settings 기본값 사용 */
  notifyOffsets?: number[] | null;
}

export type UpdateSubscriptionPatch = Partial<CreateSubscriptionInput>;

export interface ListFilter {
  status?: SubscriptionStatus;
  category?: string;
}

export function createSubscription(
  db: SqlDb,
  input: CreateSubscriptionInput,
  now: Date = new Date(),
): Subscription {
  const id = uuid();
  const currency = input.currency ?? 'KRW';
  const cycleCount = input.cycleCount ?? 1;
  const status = input.status ?? 'ACTIVE';
  const nextBillingAt = formatISODate(
    calcNextBilling(input.anchorDate, input.cycle, cycleCount, now),
  );
  const timestamp = now.toISOString();

  db.runSync(
    `INSERT INTO subscriptions
       (id, name, category, amount, currency, cycle, cycle_count,
        anchor_date, next_billing_at, status, trial_end_at, memo, notify_offsets, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.category,
      input.amount,
      currency,
      input.cycle,
      cycleCount,
      input.anchorDate,
      nextBillingAt,
      status,
      input.trialEndAt ?? null,
      input.memo ?? null,
      input.notifyOffsets != null ? JSON.stringify(input.notifyOffsets) : null,
      timestamp,
      timestamp,
    ],
  );
  return mustGet(db, id);
}

export function getSubscription(db: SqlDb, id: string): Subscription | null {
  const row = db.getFirstSync<SubscriptionRow>('SELECT * FROM subscriptions WHERE id = ?', [id]);
  return row ? rowToSubscription(row) : null;
}

function mustGet(db: SqlDb, id: string): Subscription {
  const sub = getSubscription(db, id);
  if (!sub) throw new Error(`Subscription not found: ${id}`);
  return sub;
}

/**
 * 부분 수정. 주기 관련 필드가 하나라도 있으면 next_billing_at을
 * 병합된 anchor 기준으로 다시 계산한다 (누적 방식 금지 규칙).
 */
export function updateSubscription(
  db: SqlDb,
  id: string,
  patch: UpdateSubscriptionPatch,
  now: Date = new Date(),
): Subscription {
  const existing = mustGet(db, id);
  const merged = {
    name: patch.name ?? existing.name,
    category: patch.category ?? existing.category,
    amount: patch.amount ?? existing.amount,
    currency: patch.currency ?? existing.currency,
    cycle: patch.cycle ?? existing.cycle,
    cycleCount: patch.cycleCount ?? existing.cycleCount,
    anchorDate: patch.anchorDate ?? existing.anchorDate,
    status: patch.status ?? existing.status,
    trialEndAt: patch.trialEndAt !== undefined ? patch.trialEndAt : existing.trialEndAt,
    memo: patch.memo !== undefined ? patch.memo : existing.memo,
    notifyOffsets:
      patch.notifyOffsets !== undefined ? patch.notifyOffsets : existing.notifyOffsets,
  };
  const nextBillingAt = formatISODate(
    calcNextBilling(merged.anchorDate, merged.cycle, merged.cycleCount, now),
  );

  db.runSync(
    `UPDATE subscriptions SET
       name = ?, category = ?, amount = ?, currency = ?, cycle = ?, cycle_count = ?,
       anchor_date = ?, next_billing_at = ?, status = ?, trial_end_at = ?, memo = ?,
       notify_offsets = ?, updated_at = ?
     WHERE id = ?`,
    [
      merged.name,
      merged.category,
      merged.amount,
      merged.currency,
      merged.cycle,
      merged.cycleCount,
      merged.anchorDate,
      nextBillingAt,
      merged.status,
      merged.trialEndAt,
      merged.memo,
      merged.notifyOffsets != null ? JSON.stringify(merged.notifyOffsets) : null,
      now.toISOString(),
      id,
    ],
  );
  return mustGet(db, id);
}

/** 소프트 삭제: status만 CANCELLED로 변경하고 행은 남긴다. */
export function softDeleteSubscription(db: SqlDb, id: string, now: Date = new Date()): Subscription {
  mustGet(db, id);
  db.runSync('UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?', [
    'CANCELLED',
    now.toISOString(),
    id,
  ]);
  return mustGet(db, id);
}

export function listSubscriptions(db: SqlDb, filter: ListFilter = {}): Subscription[] {
  const where: string[] = [];
  const params: SqlValue[] = [];
  if (filter.status) {
    where.push('status = ?');
    params.push(filter.status);
  }
  if (filter.category) {
    where.push('category = ?');
    params.push(filter.category);
  }
  const sql = `SELECT * FROM subscriptions${
    where.length > 0 ? ` WHERE ${where.join(' AND ')}` : ''
  } ORDER BY next_billing_at ASC, name ASC`;
  return db.getAllSync<SubscriptionRow>(sql, params).map(rowToSubscription);
}

/** 오늘(from)부터 days일 이내(양 끝 포함)에 결제가 도래하는 ACTIVE 구독 */
export function getUpcoming(db: SqlDb, days: number, from: Date = new Date()): Subscription[] {
  const start = fromLocalDate(from);
  const end = addDaysYMD(start, days);
  return db
    .getAllSync<SubscriptionRow>(
      `SELECT * FROM subscriptions
       WHERE status = 'ACTIVE' AND next_billing_at BETWEEN ? AND ?
       ORDER BY next_billing_at ASC, name ASC`,
      [formatYMD(start), formatYMD(end)],
    )
    .map(rowToSubscription);
}

/**
 * next_billing_at이 지난 비해지 구독을 anchor_date 기준으로 재계산한다.
 * 앱 포그라운드 진입 시(rescheduleAll)마다 호출되어 캐시를 최신으로 유지한다.
 * @returns 갱신된 행 수
 */
export function refreshNextBillingDates(db: SqlDb, now: Date = new Date()): number {
  const today = formatISODate(now);
  const stale = db.getAllSync<SubscriptionRow>(
    `SELECT * FROM subscriptions WHERE status != 'CANCELLED' AND next_billing_at < ?`,
    [today],
  );
  for (const row of stale) {
    const next = formatISODate(calcNextBilling(row.anchor_date, row.cycle, row.cycle_count, now));
    db.runSync('UPDATE subscriptions SET next_billing_at = ?, updated_at = ? WHERE id = ?', [
      next,
      now.toISOString(),
      row.id,
    ]);
  }
  return stale.length;
}

function sumActive(db: SqlDb, convert: (sub: Subscription, rate: number) => number): number {
  const rate = getUsdRate(db);
  return listSubscriptions(db, { status: 'ACTIVE' }).reduce(
    (total, sub) => total + convert(sub, rate),
    0,
  );
}

/** ACTIVE 구독의 월 환산 합계 (KRW 정수, 통화 정규화 포함) */
export function getMonthlyTotal(db: SqlDb): number {
  return sumActive(db, toMonthly);
}

/** ACTIVE 구독의 연 환산 합계 (KRW 정수, 통화 정규화 포함) */
export function getYearlyTotal(db: SqlDb): number {
  return sumActive(db, toYearly);
}
