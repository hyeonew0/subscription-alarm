import type { SqlDb } from './adapter';

export const SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Record<string, string> = {
  base_currency: 'KRW',
  usd_rate: '1400',
  notify_days_before: '3',
};

const DDL = `
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

/** 스키마 생성 + 기본 설정 시드. 멱등이므로 앱 시작 시마다 호출해도 안전하다. */
export function migrate(db: SqlDb): void {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  db.execSync('BEGIN');
  try {
    db.execSync(DDL);
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      db.runSync('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
    db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    db.execSync('COMMIT');
  } catch (e) {
    db.execSync('ROLLBACK');
    throw e;
  }
}
