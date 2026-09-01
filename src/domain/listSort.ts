import { toMonthly, type MoneyFields } from './money';

export type ListSort = 'dday' | 'amountDesc' | 'amountAsc' | 'name';

export const LIST_SORT_LABELS: Record<ListSort, string> = {
  dday: 'D-순',
  amountDesc: '금액 높은순',
  amountAsc: '금액 낮은순',
  name: '이름순',
};

export const LIST_SORT_ORDER: ListSort[] = ['dday', 'amountDesc', 'amountAsc', 'name'];

type Sortable = MoneyFields & { name: string; nextBillingAt: string };

/** 이름 비교: Hermes Intl 가용성에 기대지 않는 코드포인트 비교 (한글 음절은 가나다순과 일치) */
function compareName(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 목록 화면 카드 내 항목 정렬. 원본 배열은 변경하지 않는다. */
export function sortForList<T extends Sortable>(
  subs: T[],
  sort: ListSort,
  usdRate: number,
): T[] {
  const arr = [...subs];
  switch (sort) {
    case 'dday':
      return arr.sort(
        (a, b) => a.nextBillingAt.localeCompare(b.nextBillingAt) || compareName(a.name, b.name),
      );
    case 'amountDesc':
      return arr.sort((a, b) => toMonthly(b, usdRate) - toMonthly(a, usdRate));
    case 'amountAsc':
      return arr.sort((a, b) => toMonthly(a, usdRate) - toMonthly(b, usdRate));
    case 'name':
      return arr.sort((a, b) => compareName(a.name, b.name));
  }
}
