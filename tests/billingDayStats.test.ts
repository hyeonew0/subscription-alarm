import { describe, expect, it } from 'vitest';
import {
  aggregateByBillingDay,
  intensityLevel,
  peakBillingDay,
  type DayBucket,
} from '../src/domain/billingDayStats';
import type { MoneyFields } from '../src/domain/money';

const RATE = 1400;

type Item = MoneyFields & { name: string; anchorDate: string };

function sub(name: string, anchorDate: string, amount: number, partial: Partial<Item> = {}): Item {
  return { name, anchorDate, amount, currency: 'KRW', cycle: 'MONTHLY', cycleCount: 1, ...partial };
}

describe('aggregateByBillingDay', () => {
  it('anchor_date의 day별로 월 환산 금액·건수·이름을 모은다', () => {
    const buckets = aggregateByBillingDay(
      [
        sub('넷플릭스', '2026-06-03', 13500),
        sub('쿠팡 와우', '2026-01-03', 7890),
        sub('멜론', '2026-08-15', 10900),
      ],
      RATE,
    );
    expect(buckets).toHaveLength(2);
    expect(buckets[0]).toMatchObject({ day: 3, amount: 21390, count: 2 });
    expect(buckets[0].names).toEqual(['넷플릭스', '쿠팡 와우']);
    expect(buckets[1]).toMatchObject({ day: 15, amount: 10900, count: 1 });
  });

  it('YEARLY·USD는 월 환산 후 합산한다', () => {
    const buckets = aggregateByBillingDay(
      [sub('Claude Pro', '2026-02-10', 21500, { currency: 'USD', cycle: 'YEARLY' })],
      RATE,
    );
    // $215/년 → 월 25,083원
    expect(buckets[0]).toMatchObject({ day: 10, amount: 25083 });
  });

  it('빈 입력은 빈 배열', () => {
    expect(aggregateByBillingDay([], RATE)).toEqual([]);
  });
});

describe('peakBillingDay', () => {
  it('최대 금액 일자, 동률이면 빠른 일자', () => {
    const buckets = aggregateByBillingDay(
      [sub('A', '2026-01-05', 1000), sub('B', '2026-01-20', 3000), sub('C', '2026-01-25', 3000)],
      RATE,
    );
    expect(peakBillingDay(buckets)?.day).toBe(20);
  });

  it('빈 배열이면 null', () => {
    expect(peakBillingDay([])).toBeNull();
  });
});

describe('intensityLevel', () => {
  function buckets(amounts: number[]): DayBucket[] {
    return amounts.map((amount, i) => ({ day: i + 1, amount, count: 1, names: [] }));
  }

  it('0원이면 0단계', () => {
    expect(intensityLevel(0, buckets([1000]))).toBe(0);
  });

  it('3개 일자면 하위/중간/상위로 갈린다', () => {
    const b = buckets([1000, 2000, 3000]);
    expect(intensityLevel(1000, b)).toBe(1);
    expect(intensityLevel(2000, b)).toBe(2);
    expect(intensityLevel(3000, b)).toBe(3);
  });

  it('일자가 하나뿐이면 상위(3단계)', () => {
    expect(intensityLevel(5000, buckets([5000]))).toBe(3);
  });

  it('동률 최대값은 모두 상위로 묶인다', () => {
    const b = buckets([1000, 3000, 3000]);
    expect(intensityLevel(3000, b)).toBe(3);
  });
});
