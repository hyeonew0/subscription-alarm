import type { SqlDb } from './adapter';
import { addDaysYMD, formatYMD, fromLocalDate } from '../domain/date';
import { createSubscription } from '../repos/subscriptionRepo';

/** 개발용 시드 5건. 테이블이 비어 있을 때만 삽입한다. */
export function seedSubscriptions(db: SqlDb, now: Date = new Date()): void {
  const row = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM subscriptions');
  if ((row?.c ?? 0) > 0) return;

  const today = fromLocalDate(now);

  createSubscription(
    db,
    {
      name: '넷플릭스 스탠다드',
      category: 'OTT',
      amount: 13500,
      currency: 'KRW',
      cycle: 'MONTHLY',
      anchorDate: '2025-03-05',
    },
    now,
  );
  createSubscription(
    db,
    {
      name: 'ChatGPT Plus',
      category: 'AI',
      amount: 2000, // $20.00
      currency: 'USD',
      cycle: 'MONTHLY',
      anchorDate: '2025-01-12',
    },
    now,
  );
  createSubscription(
    db,
    {
      name: '쿠팡 와우',
      category: 'SHOPPING',
      amount: 7890,
      currency: 'KRW',
      cycle: 'MONTHLY',
      anchorDate: '2024-11-01',
    },
    now,
  );
  createSubscription(
    db,
    {
      name: 'Claude Pro 연간',
      category: 'AI',
      amount: 21500, // $215.00
      currency: 'USD',
      cycle: 'YEARLY',
      anchorDate: '2025-06-20',
    },
    now,
  );
  createSubscription(
    db,
    {
      name: '왓챠',
      category: 'OTT',
      amount: 7900,
      currency: 'KRW',
      cycle: 'MONTHLY',
      anchorDate: formatYMD(addDaysYMD(today, 7)), // 무료체험 종료일 = 최초 결제일
      trialEndAt: formatYMD(addDaysYMD(today, 7)),
      memo: '무료체험 중',
    },
    now,
  );
}
