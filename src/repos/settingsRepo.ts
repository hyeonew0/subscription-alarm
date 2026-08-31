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

function getOffsetsSetting(db: SqlDb, key: string): number[] {
  const raw = getSetting(db, key) ?? DEFAULT_SETTINGS[key];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((n) => Number.isInteger(n) && n >= 0)) {
      return parsed as number[];
    }
  } catch {
    // fall through to default
  }
  return JSON.parse(DEFAULT_SETTINGS[key]) as number[];
}

/** 구독별 notify_offsets가 없을 때 쓰는 기본 알림 오프셋 (일 단위) */
export function getDefaultNotifyOffsets(db: SqlDb): number[] {
  return getOffsetsSetting(db, 'default_notify_offsets');
}

/** 무료체험 종료 알림 오프셋 (일 단위) */
export function getTrialNotifyOffsets(db: SqlDb): number[] {
  return getOffsetsSetting(db, 'trial_notify_offsets');
}

export interface NotifyTime {
  hour: number;
  minute: number;
}

/** 알림 발송 시각 ('HH:MM', 로컬). 깨진 값은 09:00으로 폴백 */
export function getNotifyTime(db: SqlDb): NotifyTime {
  const raw = getSetting(db, 'notify_time') ?? DEFAULT_SETTINGS.notify_time;
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (m) {
    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) return { hour, minute };
  }
  return { hour: 9, minute: 0 };
}

export type ThemeModeSetting = 'system' | 'light' | 'dark';

/** 테마 모드. 깨진 값은 'system'으로 폴백 */
export function getThemeMode(db: SqlDb): ThemeModeSetting {
  const raw = getSetting(db, 'theme_mode');
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

export function setThemeMode(db: SqlDb, mode: ThemeModeSetting): void {
  setSetting(db, 'theme_mode', mode);
}

/** 금액 숨기기 (지하철 등 공공장소용 프라이버시 모드) */
export function getHideAmounts(db: SqlDb): boolean {
  return getSetting(db, 'hide_amounts') === 'true';
}

export function setHideAmounts(db: SqlDb, hidden: boolean): void {
  setSetting(db, 'hide_amounts', hidden ? 'true' : 'false');
}

export function getNotifyPermissionAsked(db: SqlDb): boolean {
  return getSetting(db, 'notify_permission_asked') === 'true';
}

export function setNotifyPermissionAsked(db: SqlDb, asked: boolean): void {
  setSetting(db, 'notify_permission_asked', asked ? 'true' : 'false');
}
