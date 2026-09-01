import { describe, expect, it } from 'vitest';
import { groupByCategory } from '../src/domain/categoryStats';
import { sortForList, type ListSort } from '../src/domain/listSort';
import type { MoneyFields } from '../src/domain/money';
import { distributeShades } from '../src/theme/rowShades';

const RATE = 1400;

type Item = MoneyFields & { category: string; name: string; nextBillingAt: string };

function sub(partial: Partial<Item>): Item {
  return {
    category: 'OTT',
    name: '넷플릭스',
    nextBillingAt: '2026-09-10',
    amount: 10000,
    currency: 'KRW',
    cycle: 'MONTHLY',
    cycleCount: 1,
    ...partial,
  };
}

describe('groupByCategory', () => {
  it('소계 큰 순으로 그룹을 정렬하고, 그룹 내 입력 순서를 유지한다', () => {
    const groups = groupByCategory(
      [
        sub({ name: '멜론', category: 'MUSIC', amount: 10900 }),
        sub({ name: '넷플릭스', category: 'OTT', amount: 13500 }),
        sub({ name: '티빙', category: 'OTT', amount: 17000 }),
      ],
      RATE,
    );
    expect(groups.map((g) => g.category)).toEqual(['OTT', 'MUSIC']);
    expect(groups[0].monthlyAmount).toBe(30500);
    expect(groups[0].items.map((s) => s.name)).toEqual(['넷플릭스', '티빙']);
  });

  it('커스텀 카테고리는 ETC 그룹으로 합쳐진다', () => {
    const groups = groupByCategory([sub({ category: '헬스' }), sub({ category: 'ETC' })], RATE);
    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe('ETC');
    expect(groups[0].items).toHaveLength(2);
  });

  it('빈 입력은 빈 배열', () => {
    expect(groupByCategory([], RATE)).toEqual([]);
  });
});

describe('sortForList', () => {
  const items = [
    sub({ name: '티빙', nextBillingAt: '2026-09-20', amount: 17000 }),
    sub({ name: '넷플릭스', nextBillingAt: '2026-09-05', amount: 13500 }),
    sub({ name: 'ChatGPT Plus', nextBillingAt: '2026-09-11', amount: 2000, currency: 'USD' }),
  ];

  function names(sort: ListSort): string[] {
    return sortForList(items, sort, RATE).map((s) => s.name);
  }

  it('D-순: next_billing_at 오름차순', () => {
    expect(names('dday')).toEqual(['넷플릭스', 'ChatGPT Plus', '티빙']);
  });

  it('금액 높은순: 월 환산 KRW 기준 내림차순 ($20=28,000이 최고액)', () => {
    expect(names('amountDesc')).toEqual(['ChatGPT Plus', '티빙', '넷플릭스']);
  });

  it('금액 낮은순: 월 환산 KRW 기준 오름차순', () => {
    expect(names('amountAsc')).toEqual(['넷플릭스', '티빙', 'ChatGPT Plus']);
  });

  it('이름순: 가나다순 (라틴 문자가 한글보다 앞)', () => {
    expect(names('name')).toEqual(['ChatGPT Plus', '넷플릭스', '티빙']);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const before = items.map((s) => s.name);
    sortForList(items, 'name', RATE);
    expect(items.map((s) => s.name)).toEqual(before);
  });
});

describe('distributeShades — 셰이드 1→3 선형 분배', () => {
  it('1개면 [1], 2개면 [1,3], 3개면 [1,2,3]', () => {
    expect(distributeShades(1)).toEqual([1]);
    expect(distributeShades(2)).toEqual([1, 3]);
    expect(distributeShades(3)).toEqual([1, 2, 3]);
  });

  it('5개는 양 끝 고정 + 중간 반올림 분배', () => {
    expect(distributeShades(5)).toEqual([1, 2, 2, 3, 3]);
  });

  it('0개는 빈 배열', () => {
    expect(distributeShades(0)).toEqual([]);
  });
});
