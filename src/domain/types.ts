/** 기본 제공 카테고리. category 컬럼은 커스텀 문자열도 허용한다. */
export const BUILTIN_CATEGORIES = ['OTT', 'AI', 'SHOPPING', 'MUSIC', 'ETC'] as const;

export type Currency = 'KRW' | 'USD';
export type Cycle = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface Subscription {
  id: string;
  name: string;
  category: string;
  /** 최소 화폐단위 정수 (KRW=원, USD=센트) */
  amount: number;
  currency: Currency;
  cycle: Cycle;
  /** 주기 배수. 3개월 결제 = MONTHLY + cycleCount 3 */
  cycleCount: number;
  /** ISO date (YYYY-MM-DD). 최초 결제일이며 모든 결제일 계산의 원본 기준점 */
  anchorDate: string;
  /** ISO date (YYYY-MM-DD). anchor 기반 계산 결과의 캐시 */
  nextBillingAt: string;
  status: SubscriptionStatus;
  trialEndAt: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

/** DB 행 (snake_case) */
export interface SubscriptionRow {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: Currency;
  cycle: Cycle;
  cycle_count: number;
  anchor_date: string;
  next_billing_at: string;
  status: SubscriptionStatus;
  trial_end_at: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    amount: row.amount,
    currency: row.currency,
    cycle: row.cycle,
    cycleCount: row.cycle_count,
    anchorDate: row.anchor_date,
    nextBillingAt: row.next_billing_at,
    status: row.status,
    trialEndAt: row.trial_end_at,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
