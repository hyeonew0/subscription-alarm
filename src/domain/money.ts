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

/** 1234567 → '1,234,567' (Hermes의 Intl 가용성에 기대지 않는 수동 그루핑) */
function groupDigits(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** KRW 정수 → '13,500원' */
export function formatKrw(amount: number): string {
  return `${groupDigits(amount)}원`;
}

/** USD 센트 → '$20' / '$15.99' (센트 0이면 소수부 생략) */
export function formatUsd(cents: number): string {
  const dollars = `$${groupDigits(Math.floor(cents / 100))}`;
  const rest = cents % 100;
  return rest === 0 ? dollars : `${dollars}.${String(rest).padStart(2, '0')}`;
}

/**
 * 표시용 금액 문자열.
 * KRW → '13,500원', USD → '$20.00 (≈28,000원)'
 */
export function formatAmount(sub: Pick<MoneyFields, 'amount' | 'currency'>, usdRate: number): string {
  if (sub.currency === 'KRW') return formatKrw(sub.amount);
  const dollars = Math.floor(sub.amount / 100);
  const cents = String(sub.amount % 100).padStart(2, '0');
  return `$${groupDigits(dollars)}.${cents} (≈${formatKrw(toBaseAmount(sub, usdRate))})`;
}

/**
 * 입력 폼 문자열 → 최소 화폐단위 정수.
 * KRW는 정수 원("13,500" 허용), USD는 소수 2자리까지("20.00" → 2000센트).
 * 유효하지 않으면 null.
 */
export function parseAmountInput(input: string, currency: Currency): number | null {
  const normalized = input.trim().replace(/,/g, '');
  if (normalized === '') return null;

  if (currency === 'KRW') {
    if (!/^\d+$/.test(normalized)) return null;
    return Number(normalized);
  }
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '0').padEnd(2, '0'));
}

/**
 * 입력 폼 실시간 미리보기용: 입력 문자열을 KRW 정수로 환산한다.
 * 파싱 불가면 null (미리보기 숨김).
 */
export function previewKrw(
  amountInput: string,
  currency: Currency,
  usdRate: number,
): number | null {
  const amount = parseAmountInput(amountInput, currency);
  if (amount === null) return null;
  return toBaseAmount({ amount, currency }, usdRate);
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
