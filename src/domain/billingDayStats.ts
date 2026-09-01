import { parseISODate } from './date';
import { toMonthly, type MoneyFields } from './money';

export interface DayBucket {
  /** anchor_date의 일자 (1~31). 31일이 없는 달의 clamp는 고려하지 않는다 */
  day: number;
  /** 월 환산 KRW 정수 합계 */
  amount: number;
  count: number;
  names: string[];
}

/** anchor_date의 day별 월 환산 금액 집계. 금액 0인 일자는 제외, 일자 오름차순 */
export function aggregateByBillingDay(
  subs: Array<MoneyFields & { name: string; anchorDate: string }>,
  usdRate: number,
): DayBucket[] {
  const map = new Map<number, DayBucket>();
  for (const sub of subs) {
    const day = parseISODate(sub.anchorDate).day;
    const bucket = map.get(day) ?? { day, amount: 0, count: 0, names: [] };
    bucket.amount += toMonthly(sub, usdRate);
    bucket.count += 1;
    bucket.names.push(sub.name);
    map.set(day, bucket);
  }
  return [...map.values()].filter((b) => b.amount > 0).sort((a, b) => a.day - b.day);
}

/** 최대 금액 일자 (동률이면 빠른 일자) */
export function peakBillingDay(buckets: DayBucket[]): DayBucket | null {
  let peak: DayBucket | null = null;
  for (const bucket of buckets) {
    if (peak === null || bucket.amount > peak.amount) peak = bucket;
  }
  return peak;
}

/**
 * 히트맵 셀 강도: 0=금액 없음, 1=하위 33%, 2=중간, 3=상위 33%.
 * 비어있지 않은 일자들의 금액 순위(rank) 기준 — 동률은 높은 단계로 묶인다.
 */
export function intensityLevel(amount: number, buckets: DayBucket[]): 0 | 1 | 2 | 3 {
  if (amount <= 0 || buckets.length === 0) return 0;
  const sorted = buckets.map((b) => b.amount).sort((a, b) => a - b);
  const frac = (sorted.lastIndexOf(amount) + 1) / sorted.length;
  if (frac <= 1 / 3) return 1;
  if (frac <= 2 / 3) return 2;
  return 3;
}
