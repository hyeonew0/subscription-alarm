import { toMonthly, type MoneyFields } from './money';
import { BUILTIN_CATEGORIES } from './types';

export type BuiltinCategory = (typeof BUILTIN_CATEGORIES)[number];

/** category 컬럼은 커스텀 문자열도 허용하므로, 표시(칩 색·집계)용으로는 ETC로 묶는다 */
export function toBuiltinCategory(category: string): BuiltinCategory {
  return (BUILTIN_CATEGORIES as readonly string[]).includes(category)
    ? (category as BuiltinCategory)
    : 'ETC';
}

export const CATEGORY_LABELS_KO: Record<BuiltinCategory, string> = {
  OTT: 'OTT',
  AI: 'AI',
  SHOPPING: '쇼핑',
  MUSIC: '음악',
  ETC: '기타',
};

export interface CategorySegment {
  category: BuiltinCategory;
  /** 월 환산 KRW 정수 합계 */
  monthlyAmount: number;
  /** 반올림 정수 % */
  percent: number;
}

/**
 * 구독을 카테고리별 월 환산(KRW) 금액으로 집계한다.
 * 0원 카테고리는 제외, 금액 내림차순.
 */
export interface CategoryGroup<T> {
  category: BuiltinCategory;
  /** 월 환산 KRW 정수 소계 */
  monthlyAmount: number;
  items: T[];
}

/**
 * 구독을 카테고리별로 그룹핑한다 (커스텀 카테고리는 ETC로).
 * 그룹 순서는 소계 큰 순, 그룹 내 항목은 입력 순서 유지.
 */
export function groupByCategory<T extends MoneyFields & { category: string }>(
  subs: T[],
  usdRate: number,
): Array<CategoryGroup<T>> {
  const groups = new Map<BuiltinCategory, CategoryGroup<T>>();
  for (const sub of subs) {
    const cat = toBuiltinCategory(sub.category);
    const group = groups.get(cat) ?? { category: cat, monthlyAmount: 0, items: [] };
    group.monthlyAmount += toMonthly(sub, usdRate);
    group.items.push(sub);
    groups.set(cat, group);
  }
  return [...groups.values()].sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}

export function aggregateByCategory(
  subs: Array<MoneyFields & { category: string }>,
  usdRate: number,
): CategorySegment[] {
  const sums = new Map<BuiltinCategory, number>();
  for (const sub of subs) {
    const cat = toBuiltinCategory(sub.category);
    sums.set(cat, (sums.get(cat) ?? 0) + toMonthly(sub, usdRate));
  }
  const total = [...sums.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return [...sums.entries()]
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, monthlyAmount]) => ({
      category,
      monthlyAmount,
      percent: Math.round((monthlyAmount / total) * 100),
    }));
}
