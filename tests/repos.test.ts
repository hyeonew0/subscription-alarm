import { describe, expect, it } from 'vitest';
import { seedSubscriptions } from '../src/db/seed';
import { getNotifyDaysBefore, getSetting, getUsdRate, setSetting } from '../src/repos/settingsRepo';
import {
  createSubscription,
  getMonthlyTotal,
  getSubscription,
  getUpcoming,
  getYearlyTotal,
  listSubscriptions,
  softDeleteSubscription,
  updateSubscription,
} from '../src/repos/subscriptionRepo';
import { createTestDb } from './testDb';

// 로컬 2026-08-31 자정 고정
const NOW = new Date(2026, 7, 31);

describe('settings', () => {
  it('마이그레이션이 기본 설정을 시드한다', () => {
    const db = createTestDb();
    expect(getSetting(db, 'base_currency')).toBe('KRW');
    expect(getUsdRate(db)).toBe(1400);
    expect(getNotifyDaysBefore(db)).toBe(3);
  });

  it('setSetting은 upsert로 동작한다', () => {
    const db = createTestDb();
    setSetting(db, 'usd_rate', '1350');
    expect(getUsdRate(db)).toBe(1350);
    setSetting(db, 'custom_key', 'hello');
    expect(getSetting(db, 'custom_key')).toBe('hello');
  });
});

describe('subscription CRUD', () => {
  it('create 시 next_billing_at을 anchor 기준으로 계산해 저장한다', () => {
    const db = createTestDb();
    const sub = createSubscription(
      db,
      { name: '넷플릭스', category: 'OTT', amount: 13500, cycle: 'MONTHLY', anchorDate: '2025-01-31' },
      NOW,
    );
    // 2026-08-31 기준, 앵커 1/31 → 8/31 당일
    expect(sub.nextBillingAt).toBe('2026-08-31');
    expect(sub.status).toBe('ACTIVE');
    expect(sub.currency).toBe('KRW');
    expect(sub.cycleCount).toBe(1);
    expect(getSubscription(db, sub.id)?.name).toBe('넷플릭스');
  });

  it('update가 주기 필드 변경 시 next_billing_at을 재계산한다', () => {
    const db = createTestDb();
    const sub = createSubscription(
      db,
      { name: 'A', category: 'ETC', amount: 1000, cycle: 'MONTHLY', anchorDate: '2026-08-15' },
      NOW,
    );
    expect(sub.nextBillingAt).toBe('2026-09-15');
    const updated = updateSubscription(db, sub.id, { anchorDate: '2026-08-31', cycle: 'MONTHLY' }, NOW);
    expect(updated.nextBillingAt).toBe('2026-08-31');
    expect(updated.updatedAt >= sub.updatedAt).toBe(true);
  });

  it('softDelete는 행을 남기고 status만 CANCELLED로 바꾼다', () => {
    const db = createTestDb();
    const sub = createSubscription(
      db,
      { name: 'B', category: 'ETC', amount: 1000, cycle: 'MONTHLY', anchorDate: '2026-01-01' },
      NOW,
    );
    const deleted = softDeleteSubscription(db, sub.id, NOW);
    expect(deleted.status).toBe('CANCELLED');
    expect(getSubscription(db, sub.id)).not.toBeNull();
    expect(listSubscriptions(db, { status: 'ACTIVE' })).toHaveLength(0);
  });

  it('list 필터: status, category', () => {
    const db = createTestDb();
    createSubscription(db, { name: 'N', category: 'OTT', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-01-01' }, NOW);
    createSubscription(db, { name: 'C', category: 'AI', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-01-02' }, NOW);
    const paused = createSubscription(
      db,
      { name: 'P', category: 'AI', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-01-03', status: 'PAUSED' },
      NOW,
    );
    expect(listSubscriptions(db)).toHaveLength(3);
    expect(listSubscriptions(db, { category: 'AI' })).toHaveLength(2);
    expect(listSubscriptions(db, { status: 'PAUSED' })[0]?.id).toBe(paused.id);
    expect(listSubscriptions(db, { status: 'ACTIVE', category: 'AI' })).toHaveLength(1);
  });
});

describe('getUpcoming', () => {
  it('오늘부터 N일 이내의 ACTIVE 구독만, 결제일 순으로 반환한다', () => {
    const db = createTestDb();
    // NOW = 2026-08-31 기준: 당일, 2일 후, 4일 후, 그리고 CANCELLED 1건
    createSubscription(db, { name: '당일', category: 'ETC', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-08-31' }, NOW);
    createSubscription(db, { name: '2일후', category: 'ETC', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-09-02' }, NOW);
    createSubscription(db, { name: '4일후', category: 'ETC', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-09-04' }, NOW);
    const cancelled = createSubscription(
      db,
      { name: '해지됨', category: 'ETC', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-09-01' },
      NOW,
    );
    softDeleteSubscription(db, cancelled.id, NOW);

    const upcoming = getUpcoming(db, 3, NOW);
    expect(upcoming.map((s) => s.name)).toEqual(['당일', '2일후']);
    expect(getUpcoming(db, 4, NOW).map((s) => s.name)).toEqual(['당일', '2일후', '4일후']);
  });
});

describe('통화 정규화 합계', () => {
  it('getMonthlyTotal / getYearlyTotal: KRW + USD 혼합, CANCELLED 제외', () => {
    const db = createTestDb();
    createSubscription(
      db,
      { name: '넷플릭스', category: 'OTT', amount: 13500, cycle: 'MONTHLY', anchorDate: '2026-01-05' },
      NOW,
    );
    createSubscription(
      db,
      { name: 'ChatGPT Plus', category: 'AI', amount: 2000, currency: 'USD', cycle: 'MONTHLY', anchorDate: '2026-01-12' },
      NOW,
    );
    const cancelled = createSubscription(
      db,
      { name: '해지', category: 'ETC', amount: 99999, cycle: 'MONTHLY', anchorDate: '2026-01-01' },
      NOW,
    );
    softDeleteSubscription(db, cancelled.id, NOW);

    // 13,500 + $20×1,400 = 13,500 + 28,000
    expect(getMonthlyTotal(db)).toBe(41500);
    expect(getYearlyTotal(db)).toBe(498000);
  });

  it('YEARLY 구독은 월 합계에 1/12로 반영된다', () => {
    const db = createTestDb();
    createSubscription(
      db,
      { name: 'Claude Pro 연간', category: 'AI', amount: 21500, currency: 'USD', cycle: 'YEARLY', anchorDate: '2026-06-20' },
      NOW,
    );
    expect(getMonthlyTotal(db)).toBe(25083); // round(301,000 / 12)
    expect(getYearlyTotal(db)).toBe(301000);
  });

  it('환율 설정을 바꾸면 합계에 반영된다', () => {
    const db = createTestDb();
    createSubscription(
      db,
      { name: 'ChatGPT Plus', category: 'AI', amount: 2000, currency: 'USD', cycle: 'MONTHLY', anchorDate: '2026-01-12' },
      NOW,
    );
    setSetting(db, 'usd_rate', '1300');
    expect(getMonthlyTotal(db)).toBe(26000);
  });
});

describe('seed', () => {
  it('빈 DB에 5건을 넣고, 재호출해도 중복되지 않는다', () => {
    const db = createTestDb();
    seedSubscriptions(db, NOW);
    const all = listSubscriptions(db);
    expect(all).toHaveLength(5);

    const trial = all.filter((s) => s.trialEndAt !== null);
    expect(trial).toHaveLength(1);
    expect(trial[0]?.name).toBe('왓챠');

    seedSubscriptions(db, NOW);
    expect(listSubscriptions(db)).toHaveLength(5);
  });

  it('시드된 구독의 next_billing_at은 모두 오늘 이후다', () => {
    const db = createTestDb();
    seedSubscriptions(db, NOW);
    for (const s of listSubscriptions(db)) {
      expect(s.nextBillingAt >= '2026-08-31').toBe(true);
    }
  });
});
