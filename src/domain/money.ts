import type { Currency, Cycle } from './types';

/** 금액 계산에 필요한 필드만 요구해 순수 함수로 유지한다. */
export interface MoneyFields {
  /** 최소 화폐단위 정수 (KRW=원, USD=센트) */
  amount: number;
  currency: Currency;
  cycle: Cycle;
  cycleCount: number;
}

/**
 * 기준 통화(KRW) 정수 금액으로 정규화한다.
 * USD는 센트 단위이므로 100으로 나눈 뒤 환율을 곱한다.
 */
export function toBaseAmount(
  sub: Pick<MoneyFields, 'amount' | 'currency'>,
  usdRate: number,
): number {
  switch (sub.currency) {
    case 'KRW':
      return sub.amount;
    case 'USD':
      return Math.round((sub.amount / 100) * usdRate);
  }
}

/** 월 환산액 (KRW 정수). WEEKLY는 × 52 / 12 규칙을 따른다. */
export function toMonthly(sub: MoneyFields, usdRate: number): number {
  const base = toBaseAmount(sub, usdRate);
  switch (sub.cycle) {
    case 'WEEKLY':
      return Math.round((base * 52) / 12 / sub.cycleCount);
    case 'MONTHLY':
      return Math.round(base / sub.cycleCount);
    case 'YEARLY':
      return Math.round(base / (12 * sub.cycleCount));
  }
}

/** 연 환산액 (KRW 정수) */
export function toYearly(sub: MoneyFields, usdRate: number): number {
  const base = toBaseAmount(sub, usdRate);
  switch (sub.cycle) {
    case 'WEEKLY':
      return Math.round((base * 52) / sub.cycleCount);
    case 'MONTHLY':
      return Math.round((base * 12) / sub.cycleCount);
    case 'YEARLY':
      return Math.round(base / sub.cycleCount);
  }
}
