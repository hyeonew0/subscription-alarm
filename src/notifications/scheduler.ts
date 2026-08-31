import type { SqlDb } from '../db/adapter';
import { addDaysYMD, parseISODate } from '../domain/date';
import { formatAmount } from '../domain/money';
import type { Cycle, Subscription } from '../domain/types';
import {
  getDefaultNotifyOffsets,
  getNotifyTime,
  getTrialNotifyOffsets,
  getUsdRate,
  setNotifyPermissionAsked,
  type NotifyTime,
} from '../repos/settingsRepo';
import { listSubscriptions, refreshNextBillingDates } from '../repos/subscriptionRepo';
import type { NotificationDriver, PermissionState } from './driver';

/** iOS는 앱당 예약 알림 64개 제한. 초과분은 가까운 순으로 잘라 예약한다. */
export const SCHEDULED_NOTIFICATION_LIMIT = 64;

/** UI가 선택지로 제공하는 오프셋. 주기보다 긴 오프셋은 목록에 없다. */
export function getAllowedOffsets(cycle: Cycle): number[] {
  switch (cycle) {
    case 'YEARLY':
      return [30, 7, 3, 0];
    case 'MONTHLY':
      return [7, 3, 0];
    case 'WEEKLY':
      return [3, 0];
  }
}

/**
 * 주기에 맞지 않는 오프셋을 걸러낸다. 최대 허용치는 getAllowedOffsets의 최댓값.
 * (월간 구독에 30일 전 알림을 허용하면 항상 발화하는 상시 알림이 된다)
 * 중복 제거 후 내림차순(시간순) 정렬로 반환.
 */
export function filterOffsetsForCycle(offsets: number[], cycle: Cycle): number[] {
  const max = Math.max(...getAllowedOffsets(cycle));
  return [...new Set(offsets)]
    .filter((o) => Number.isInteger(o) && o >= 0 && o <= max)
    .sort((a, b) => b - a);
}

type NotificationKind = 'BILLING' | 'TRIAL';

interface Candidate {
  subscriptionId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  fireAt: Date;
}

interface NotificationMapRow {
  notification_id: string;
  subscription_id: string;
  kind: NotificationKind;
  fire_at: string;
}

/** 결제일/체험종료일에서 offset일 전, 설정된 시각(로컬)의 Date */
function fireDateFor(isoDate: string, offsetDays: number, time: NotifyTime): Date {
  const ymd = addDaysYMD(parseISODate(isoDate), -offsetDays);
  return new Date(ymd.year, ymd.month - 1, ymd.day, time.hour, time.minute);
}

function billingBody(sub: Subscription, offset: number, usdRate: number): string {
  const amount = formatAmount(sub, usdRate);
  return offset === 0
    ? `오늘 ${amount}이(가) 결제됩니다`
    : `${offset}일 후 ${amount}이(가) 결제됩니다`;
}

function trialBody(sub: Subscription, offset: number, usdRate: number): string {
  const amount = formatAmount(sub, usdRate);
  return offset === 0
    ? `오늘 무료체험이 종료되고 ${amount} 결제가 시작됩니다`
    : `${offset}일 후 무료체험이 종료됩니다 (${amount})`;
}

/**
 * 한 구독의 미래 알림 후보 목록.
 * 권한 상태와 무관하게 만든다 — 권한이 나중에 허용되면 즉시 동작해야 한다.
 */
function buildCandidates(db: SqlDb, sub: Subscription, now: Date): Candidate[] {
  if (sub.status !== 'ACTIVE') return [];
  const time = getNotifyTime(db);
  const usdRate = getUsdRate(db);
  const candidates: Candidate[] = [];

  const offsets = filterOffsetsForCycle(sub.notifyOffsets ?? getDefaultNotifyOffsets(db), sub.cycle);
  for (const offset of offsets) {
    const fireAt = fireDateFor(sub.nextBillingAt, offset, time);
    if (fireAt.getTime() <= now.getTime()) continue;
    candidates.push({
      subscriptionId: sub.id,
      kind: 'BILLING',
      title: `${sub.name} 결제 예정`,
      body: billingBody(sub, offset, usdRate),
      fireAt,
    });
  }

  if (sub.trialEndAt) {
    // 체험 종료 알림은 날짜(trial_end_at) 기준이므로 주기 필터를 적용하지 않는다
    const trialOffsets = [...new Set(getTrialNotifyOffsets(db))]
      .filter((o) => Number.isInteger(o) && o >= 0)
      .sort((a, b) => b - a);
    for (const offset of trialOffsets) {
      const fireAt = fireDateFor(sub.trialEndAt, offset, time);
      if (fireAt.getTime() <= now.getTime()) continue;
      candidates.push({
        subscriptionId: sub.id,
        kind: 'TRIAL',
        title: `${sub.name} 무료체험 종료`,
        body: trialBody(sub, offset, usdRate),
        fireAt,
      });
    }
  }
  return candidates;
}

/** 로컬 시각을 정렬 가능한 'YYYY-MM-DDTHH:mm' 문자열로 (UTC 변환 없음) */
function formatLocalDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function scheduleCandidates(
  db: SqlDb,
  driver: NotificationDriver,
  candidates: Candidate[],
): Promise<void> {
  for (const c of candidates) {
    const notificationId = await driver.scheduleAsync({
      title: c.title,
      body: c.body,
      triggerDate: c.fireAt,
    });
    db.runSync(
      'INSERT INTO notification_map (notification_id, subscription_id, kind, fire_at) VALUES (?, ?, ?, ?)',
      [notificationId, c.subscriptionId, c.kind, formatLocalDateTime(c.fireAt)],
    );
  }
}

/** 매핑에 남은 이 구독의 예약 알림을 전부 취소한다. */
export async function cancelForSubscription(
  db: SqlDb,
  driver: NotificationDriver,
  subscriptionId: string,
): Promise<void> {
  const rows = db.getAllSync<NotificationMapRow>(
    'SELECT * FROM notification_map WHERE subscription_id = ?',
    [subscriptionId],
  );
  for (const row of rows) {
    await driver.cancelAsync(row.notification_id);
  }
  db.runSync('DELETE FROM notification_map WHERE subscription_id = ?', [subscriptionId]);
}

/**
 * 한 구독의 알림을 (재)예약한다. 기존 예약을 먼저 취소하므로
 * 구독 생성/수정 직후 호출하면 된다. ACTIVE가 아니면 취소만 수행한다.
 */
export async function scheduleForSubscription(
  db: SqlDb,
  driver: NotificationDriver,
  sub: Subscription,
  now: Date = new Date(),
): Promise<void> {
  await cancelForSubscription(db, driver, sub.id);
  await scheduleCandidates(db, driver, buildCandidates(db, sub, now));
}

/**
 * 전체 재예약. 앱 포그라운드 진입 시 호출한다.
 * 1) 지난 next_billing_at을 anchor 기준으로 재계산
 * 2) 기존 예약 전부 취소
 * 3) 전체 후보를 가까운 순으로 정렬해 iOS 제한(64개) 안에서 예약
 */
export async function rescheduleAll(
  db: SqlDb,
  driver: NotificationDriver,
  now: Date = new Date(),
): Promise<void> {
  refreshNextBillingDates(db, now);

  const existing = db.getAllSync<NotificationMapRow>('SELECT * FROM notification_map');
  for (const row of existing) {
    await driver.cancelAsync(row.notification_id);
  }
  db.runSync('DELETE FROM notification_map');

  const candidates = listSubscriptions(db, { status: 'ACTIVE' })
    .flatMap((sub) => buildCandidates(db, sub, now))
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, SCHEDULED_NOTIFICATION_LIMIT);

  await scheduleCandidates(db, driver, candidates);
}

/**
 * OS 알림 권한 요청. 자동 호출 금지 — 호출 시점은 UI가 결정한다.
 * 호출 사실을 settings(notify_permission_asked)에 기록한다.
 */
export async function requestNotificationPermission(
  db: SqlDb,
  driver: NotificationDriver,
): Promise<PermissionState> {
  const state = await driver.requestPermissionsAsync();
  setNotifyPermissionAsked(db, true);
  return state;
}

/** 현재 권한 상태. UI가 안내 배너 노출 여부를 판단할 때 사용한다. */
export async function getPermissionState(driver: NotificationDriver): Promise<PermissionState> {
  return driver.getPermissionsAsync();
}
