import type { Subscription } from '../domain/types';
import { CATALOG, type CatalogItem } from './catalog';

/** 한글 음절의 초성 19자 (유니코드 분해 순서) */
const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const;

const HANGUL_BASE = 0xac00; // '가'
const HANGUL_END = 0xd7a3; // '힣'
const JUNGSEONG_COUNT = 21;
const JONGSEONG_COUNT = 28;

/** 대소문자·공백 무시 정규화 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

/**
 * 문자열을 초성 형태로 변환한다.
 * 한글 음절 → 초성, 그 외 문자(자모·영문·숫자)는 그대로 통과.
 * ("넷플릭스" → "ㄴㅍㄹㅅ", "ㄴㅍ" → "ㄴㅍ", "notion" → "notion")
 */
export function toChoseong(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code >= HANGUL_BASE && code <= HANGUL_END) {
      out += CHOSEONG[Math.floor((code - HANGUL_BASE) / (JUNGSEONG_COUNT * JONGSEONG_COUNT))];
    } else {
      out += ch;
    }
  }
  return out;
}

/** 낮을수록 좋은 순위: 정확일치 0 > 접두일치 1 > 부분일치 2 > 초성일치 3 */
const RANK_EXACT = 0;
const RANK_PREFIX = 1;
const RANK_SUBSTRING = 2;
const RANK_CHOSEONG = 3;

function rankItem(item: CatalogItem, query: string, choseongQuery: string): number | null {
  let best: number | null = null;
  for (const raw of [item.name, ...item.aliases]) {
    const target = normalize(raw);
    let rank: number | null = null;
    if (target === query) rank = RANK_EXACT;
    else if (target.startsWith(query)) rank = RANK_PREFIX;
    else if (target.includes(query)) rank = RANK_SUBSTRING;
    else if (toChoseong(target).includes(choseongQuery)) rank = RANK_CHOSEONG;

    if (rank !== null && (best === null || rank < best)) best = rank;
    if (best === RANK_EXACT) break;
  }
  return best;
}

/**
 * 카탈로그 검색.
 * - 대소문자·공백 무시 name/aliases 부분일치
 * - 한글 초성 검색 ("ㄴㅍㄹㅅ" → 넷플릭스). 완성형 아닌 자모가 섞여도 안전
 * - 정렬: 정확일치 > 접두일치 > 부분일치 > 초성일치, 동순위는 카탈로그 순서 유지
 * - 빈 쿼리면 전체 반환 (카탈로그가 카테고리 순으로 정렬돼 있음)
 */
export function searchCatalog(query: string): CatalogItem[] {
  const normalized = normalize(query);
  if (normalized === '') return [...CATALOG];

  const choseongQuery = toChoseong(normalized);
  return CATALOG.map((item, index) => ({ item, index, rank: rankItem(item, normalized, choseongQuery) }))
    .filter((r): r is { item: CatalogItem; index: number; rank: number } => r.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((r) => r.item);
}

/**
 * 카탈로그 항목 + 선택 플랜 → 등록 폼 초기값.
 * anchor_date는 사용자가 지정하므로 비워둔다.
 */
export function catalogToDraft(item: CatalogItem, planIndex = 0): Partial<Subscription> {
  const plan = item.plans[planIndex];
  if (!plan) {
    throw new Error(`Catalog item ${item.id} has no plan at index ${planIndex}`);
  }
  return {
    name: item.plans.length > 1 ? `${item.name} ${plan.label}` : item.name,
    category: item.category,
    amount: plan.amount,
    currency: plan.currency,
    cycle: plan.cycle,
    cycleCount: plan.cycleCount ?? 1,
    memo: null,
    notifyOffsets: null,
  };
}
