import type { SqlDb } from '../db/adapter';
import { DEFAULT_SETTINGS } from '../db/schema';

export function getSetting(db: SqlDb, key: string): string | null {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setSetting(db: SqlDb, key: string, value: string): void {
  db.runSync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

function getNumericSetting(db: SqlDb, key: string): number {
  const raw = getSetting(db, key) ?? DEFAULT_SETTINGS[key];
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Setting ${key} is not numeric: ${raw}`);
  return n;
}

/** USD → KRW 환율 */
export function getUsdRate(db: SqlDb): number {
  return getNumericSetting(db, 'usd_rate');
}

export function getNotifyDaysBefore(db: SqlDb): number {
  return getNumericSetting(db, 'notify_days_before');
}
