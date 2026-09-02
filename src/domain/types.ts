/** 기본 제공 카테고리. category 컬럼은 커스텀 문자열도 허용한다. */
export const BUILTIN_CATEGORIES = ['OTT', 'AI', 'SHOPPING', 'MUSIC', 'ETC'] as const;

/** 카탈로그 연결 구독인데 금액을 플랜과 무관하게 직접 넣었을 때의 plan_label 값 */
export const MANUAL_PLAN_LABEL = '직접 입력';

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
  /** 결제일 며칠 전에 알릴지 (일 단위). null이면 settings의 default_notify_offsets 사용 */
  notifyOffsets: number[] | null;
  /** 카탈로그 항목 id. 직접 입력 구독이면 null */
  catalogId: string | null;
  /** 선택한 플랜명. 카탈로그 연결이지만 금액을 직접 고쳤으면 '직접 입력', 직접 입력 구독이면 null */
  planLabel: string | null;
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
  /** JSON int 배열 문자열, 예: '[7,3]' */
  notify_offsets: string | null;
  catalog_id: string | null;
  plan_label: string | null;
  created_at: string;
  updated_at: string;
}

/** notify_offsets JSON 파싱. 깨진 값은 null(기본값 사용)로 처리한다. */
export function parseNotifyOffsets(raw: string | null): number[] | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((n) => Number.isInteger(n) && n >= 0)) {
      return parsed as number[];
    }
  } catch {
    // fall through
  }
  return null;
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
    notifyOffsets: parseNotifyOffsets(row.notify_offsets),
    catalogId: row.catalog_id,
    planLabel: row.plan_label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
