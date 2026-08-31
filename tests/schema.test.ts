import { describe, expect, it } from 'vitest';
import { migrate, SCHEMA_VERSION } from '../src/db/schema';
import { getSetting } from '../src/repos/settingsRepo';
import { getSubscription, listSubscriptions } from '../src/repos/subscriptionRepo';
import { createEmptyDb } from './testDb';

const NOW = new Date(2026, 7, 31);

describe('마이그레이션', () => {
  it('빈 DB는 최신 버전까지 올라간다', () => {
    const db = createEmptyDb();
    migrate(db, NOW);
    const v = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(SCHEMA_VERSION);
    expect(getSetting(db, 'default_notify_offsets')).toBe('[7,3]');
    expect(getSetting(db, 'trial_notify_offsets')).toBe('[3,0]');
    expect(getSetting(db, 'notify_time')).toBe('09:00');
    expect(getSetting(db, 'notify_permission_asked')).toBe('false');
    expect(getSetting(db, 'usd_rate_updated_at')).toBe('2026-08-31');
    expect(getSetting(db, 'theme_mode')).toBe('system');
  });

  it('v2 DB가 v3으로 올라가면 theme_mode가 시드된다', () => {
    const db = createEmptyDb();
    migrate(db, NOW, 2);
    expect(getSetting(db, 'theme_mode')).toBeNull();
    migrate(db, NOW);
    expect(getSetting(db, 'theme_mode')).toBe('system');
    const v = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(SCHEMA_VERSION);
  });

  it('v3 DB가 v4로 올라가면 hide_amounts가 시드된다 (기존 데이터 보존)', () => {
    const db = createEmptyDb();
    migrate(db, NOW, 3);
    expect(getSetting(db, 'hide_amounts')).toBeNull();
    db.runSync(`UPDATE settings SET value = '1500' WHERE key = 'usd_rate'`);
    migrate(db, NOW);
    expect(getSetting(db, 'hide_amounts')).toBe('false');
    expect(getSetting(db, 'usd_rate')).toBe('1500'); // 사용자 값 유지
    const v = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(SCHEMA_VERSION);
  });

  it('v1 DB(기존 데이터 포함)가 v2로 무손실 마이그레이션된다', () => {
    const db = createEmptyDb();
    migrate(db, NOW, 1); // 구버전 상태 재현

    // v1 스키마에는 notify_offsets 컬럼이 없다
    const v1Cols = db.getAllSync<{ name: string }>('PRAGMA table_info(subscriptions)').map((c) => c.name);
    expect(v1Cols).not.toContain('notify_offsets');

    // v1 시절의 데이터
    db.runSync(
      `INSERT INTO subscriptions
         (id, name, category, amount, currency, cycle, cycle_count,
          anchor_date, next_billing_at, status, trial_end_at, memo, created_at, updated_at)
       VALUES ('old-1', '넷플릭스', 'OTT', 13500, 'KRW', 'MONTHLY', 1,
               '2025-03-05', '2026-09-05', 'ACTIVE', NULL, NULL, '2025-03-05T00:00:00Z', '2025-03-05T00:00:00Z')`,
    );

    migrate(db, NOW); // v2로

    const v = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(SCHEMA_VERSION);

    // 컬럼 추가 + 기존 행 보존, notify_offsets는 null(기본값 사용)
    const sub = getSubscription(db, 'old-1');
    expect(sub?.name).toBe('넷플릭스');
    expect(sub?.notifyOffsets).toBeNull();
    expect(listSubscriptions(db)).toHaveLength(1);

    // 기존 설정은 유지, 새 설정은 시드됨
    expect(getSetting(db, 'usd_rate')).toBe('1400');
    expect(getSetting(db, 'notify_time')).toBe('09:00');

    // notification_map 테이블 생성됨
    const c = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM notification_map');
    expect(c?.c).toBe(0);
  });

  it('사용자가 바꾼 설정값은 재마이그레이션에도 덮어쓰지 않는다', () => {
    const db = createEmptyDb();
    migrate(db, NOW);
    db.runSync(`UPDATE settings SET value = '1500' WHERE key = 'usd_rate'`);
    migrate(db, NOW); // 재호출 (멱등)
    expect(getSetting(db, 'usd_rate')).toBe('1500');
  });
});
