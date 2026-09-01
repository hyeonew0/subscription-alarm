import { describe, expect, it } from 'vitest';
import {
  aggregateByCategory,
  toBuiltinCategory,
} from '../src/domain/categoryStats';
import type { MoneyFields } from '../src/domain/money';
import { computeRowShades } from '../src/theme/rowShades';

const RATE = 1400;

function sub(
  category: string,
  partial: Partial<MoneyFields> = {},
): MoneyFields & { category: string } {
  return { category, amount: 10000, currency: 'KRW', cycle: 'MONTHLY', cycleCount: 1, ...partial };
}

describe('toBuiltinCategory', () => {
  it('기본 카테고리는 그대로', () => {
    expect(toBuiltinCategory('OTT')).toBe('OTT');
    expect(toBuiltinCategory('MUSIC')).toBe('MUSIC');
  });

  it('커스텀 카테고리는 ETC로 묶는다', () => {
    expect(toBuiltinCategory('헬스')).toBe('ETC');
    expect(toBuiltinCategory('')).toBe('ETC');
  });
});

describe('aggregateByCategory', () => {
  it('카테고리별 월 환산 합계를 금액 내림차순으로 반환한다', () => {
    const result = aggregateByCategory(
      [sub('OTT', { amount: 13500 }), sub('OTT', { amount: 14900 }), sub('MUSIC', { amount: 10900 })],
      RATE,
    );
    expect(result.map((s) => s.category)).toEqual(['OTT', 'MUSIC']);
    expect(result[0].monthlyAmount).toBe(28400);
    expect(result[1].monthlyAmount).toBe(10900);
  });

  it('비율은 반올림 정수 %', () => {
    const result = aggregateByCategory([sub('OTT', { amount: 4500 }), sub('AI', { amount: 5500 })], RATE);
    expect(result.map((s) => [s.category, s.percent])).toEqual([
      ['AI', 55],
      ['OTT', 45],
    ]);
  });

  it('USD는 환율로 정규화하고 YEARLY는 월 환산한다', () => {
    const result = aggregateByCategory(
      [sub('AI', { amount: 2000, currency: 'USD' }), sub('ETC', { amount: 120000, cycle: 'YEARLY' })],
      RATE,
    );
    expect(result[0]).toMatchObject({ category: 'AI', monthlyAmount: 28000 });
    expect(result[1]).toMatchObject({ category: 'ETC', monthlyAmount: 10000 });
  });

  it('커스텀 카테고리는 ETC로 합산된다', () => {
    const result = aggregateByCategory([sub('헬스'), sub('ETC')], RATE);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ category: 'ETC', monthlyAmount: 20000, percent: 100 });
  });

  it('0원 카테고리는 제외한다', () => {
    const result = aggregateByCategory([sub('OTT'), sub('AI', { amount: 0 })], RATE);
    expect(result.map((s) => s.category)).toEqual(['OTT']);
  });

  it('구독이 없으면 빈 배열', () => {
    expect(aggregateByCategory([], RATE)).toEqual([]);
  });
});

describe('computeRowShades — 같은 카테고리 1→2→3 반복', () => {
  it('카테고리별 등장 순서대로 셰이드를 배정한다', () => {
    expect(computeRowShades(['OTT', 'AI', 'SHOPPING', 'MUSIC', 'OTT'])).toEqual([1, 1, 1, 1, 2]);
  });

  it('4번째 등장은 다시 1로 돌아온다', () => {
    expect(computeRowShades(['OTT', 'OTT', 'OTT', 'OTT'])).toEqual([1, 2, 3, 1]);
  });

  it('빈 목록은 빈 배열', () => {
    expect(computeRowShades([])).toEqual([]);
  });
});
