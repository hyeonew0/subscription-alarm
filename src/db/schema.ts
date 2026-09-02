import type { SqlDb } from './adapter';
import { formatISODate } from '../domain/date';
import { MANUAL_PLAN_LABEL } from '../domain/types';
import { V5_CATALOG_SNAPSHOT, type SnapshotPlan } from './migrations/v5CatalogSnapshot';

/**
 * 설정 기본값. 값이 비거나 깨졌을 때의 폴백으로도 쓰인다.
 * usd_rate_updated_at은 마이그레이션 시점의 날짜라 여기 없다 (v2에서 동적 시드).
 */
export const DEFAULT_SETTINGS: Record<string, string> = {
  base_currency: 'KRW',
  usd_rate: '1400',
  notify_days_before: '3',
  default_notify_offsets: '[7,3]',
  trial_notify_offsets: '[3,0]',
  notify_time: '09:00',
  notify_permission_asked: 'false',
  theme_mode: 'system',
  hide_amounts: 'false',
};

const DDL_V1 = `
CREATE TABLE IF NOT EXISTS subscriptions (
  id              TEXT PRIMARY KEY NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  amount          INTEGER NOT NULL CHECK (amount >= 0),
  currency        TEXT NOT NULL DEFAULT 'KRW' CHECK (currency IN ('KRW', 'USD')),
  cycle           TEXT NOT NULL CHECK (cycle IN ('WEEKLY', 'MONTHLY', 'YEARLY')),
  cycle_count     INTEGER NOT NULL DEFAULT 1 CHECK (cycle_count >= 1),
  anchor_date     TEXT NOT NULL,
  next_billing_at TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED')),
  trial_end_at    TEXT NULL,
  memo            TEXT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status_next_billing
  ON subscriptions (status, next_billing_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_category
  ON subscriptions (category);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

const DDL_V2 = `
ALTER TABLE subscriptions ADD COLUMN notify_offsets TEXT NULL;

CREATE TABLE IF NOT EXISTS notification_map (
  notification_id TEXT PRIMARY KEY NOT NULL,
  subscription_id TEXT NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('BILLING', 'TRIAL')),
  fire_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_map_subscription
  ON notification_map (subscription_id);
`;

const DDL_V5 = `
ALTER TABLE subscriptions ADD COLUMN catalog_id TEXT NULL;
ALTER TABLE subscriptions ADD COLUMN plan_label TEXT NULL;
`;

function seedSettings(db: SqlDb, entries: Record<string, string>): void {
  for (const [key, value] of Object.entries(entries)) {
    db.runSync('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }
}

function planMatches(plan: SnapshotPlan, row: V5Row): boolean {
  return (
    plan.amount === row.amount &&
    plan.currency === row.currency &&
    plan.cycle === row.cycle &&
    (plan.cycleCount ?? 1) === row.cycle_count
  );
}

interface V5Row {
  id: string;
  name: string;
  amount: number;
  currency: string;
  cycle: string;
  cycle_count: number;
}

/**
 * v4까지의 name("넷플릭스 스탠다드", "Claude Pro Pro")을 동결 스냅샷으로 파싱해
 * catalog_id·plan_label을 채우고 name은 서비스명만 남긴다.
 * 이름이 스냅샷과 안 맞으면 직접 입력 취급(둘 다 NULL, name 유지).
 * 플랜명은 알지만 금액을 사용자가 고쳤으면 '직접 입력'으로 둔다 (금액이 진실).
 */
function backfillCatalogV5(db: SqlDb): void {
  // 이름 → (항목, 이름이 특정한 플랜 | null=금액으로 판별)
  const byName = new Map<string, { item: (typeof V5_CATALOG_SNAPSHOT)[number]; plan: SnapshotPlan | null }>();
  for (const item of V5_CATALOG_SNAPSHOT) {
    for (const bare of [item.name, ...item.legacyNames]) {
      if (!byName.has(bare)) byName.set(bare, { item, plan: null });
    }
    for (const plan of item.plans) {
      for (const base of [item.name, ...item.legacyNames]) {
        const full = `${base} ${plan.label}`;
        if (!byName.has(full) || byName.get(full)!.plan === null) byName.set(full, { item, plan });
      }
    }
  }

  const rows = db.getAllSync<V5Row>(
    'SELECT id, name, amount, currency, cycle, cycle_count FROM subscriptions',
  );
  for (const row of rows) {
    const hit = byName.get(row.name);
    if (!hit) continue;
    const plan = hit.plan ?? hit.item.plans.find((p) => planMatches(p, row)) ?? null;
    const label = plan && planMatches(plan, row) ? plan.label : MANUAL_PLAN_LABEL;
    db.runSync('UPDATE subscriptions SET catalog_id = ?, plan_label = ?, name = ? WHERE id = ?', [
      hit.item.id,
      label,
      hit.item.name,
      row.id,
    ]);
  }
}

/** 각 항목은 출시 후 동결. 스키마 변경은 항상 새 버전을 추가한다. */
const MIGRATIONS: ReadonlyArray<(db: SqlDb, now: Date) => void> = [
  function v1(db) {
    db.execSync(DDL_V1);
    seedSettings(db, {
      base_currency: 'KRW',
      usd_rate: '1400',
      notify_days_before: '3',
    });
  },
  function v2(db, now) {
    db.execSync(DDL_V2);
    seedSettings(db, {
      default_notify_offsets: '[7,3]',
      trial_notify_offsets: '[3,0]',
      notify_time: '09:00',
      notify_permission_asked: 'false',
      usd_rate_updated_at: formatISODate(now),
    });
  },
  function v3(db) {
    seedSettings(db, { theme_mode: 'system' });
  },
  function v4(db) {
    seedSettings(db, { hide_amounts: 'false' });
  },
  function v5(db) {
    db.execSync(DDL_V5);
    backfillCatalogV5(db);
  },
];

export const SCHEMA_VERSION = MIGRATIONS.length;

/**
 * PRAGMA user_version 기반 순차 마이그레이션. 멱등이므로 앱 시작 시마다 호출해도 안전하다.
 * @param toVersion 테스트에서 특정 버전까지만 올릴 때 사용
 */
export function migrate(db: SqlDb, now: Date = new Date(), toVersion: number = SCHEMA_VERSION): void {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  while (current < toVersion) {
    db.execSync('BEGIN');
    try {
      MIGRATIONS[current](db, now);
      current += 1;
      db.execSync(`PRAGMA user_version = ${current}`);
      db.execSync('COMMIT');
    } catch (e) {
      db.execSync('ROLLBACK');
      throw e;
    }
  }
}
