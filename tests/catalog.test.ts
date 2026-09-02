import { describe, expect, it } from 'vitest';
import { CATALOG } from '../src/data/catalog';
import { catalogToDraft, searchCatalog, toChoseong } from '../src/data/catalogSearch';

describe('카탈로그 데이터 무결성', () => {
  it('최소 45개 항목', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(45);
  });

  it('id는 중복이 없다', () => {
    const ids = CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 항목이 plans를 최소 1개 갖는다', () => {
    for (const item of CATALOG) {
      expect(item.plans.length, item.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('모든 amount는 양의 정수(최소 화폐단위)다', () => {
    for (const item of CATALOG) {
      for (const plan of item.plans) {
        expect(Number.isInteger(plan.amount), `${item.id}/${plan.label}`).toBe(true);
        expect(plan.amount, `${item.id}/${plan.label}`).toBeGreaterThan(0);
      }
    }
  });

  it('USD 항목의 amount는 센트 단위다 (달러 오기 방지: $1 미만 없음)', () => {
    const usdPlans = CATALOG.flatMap((i) => i.plans.filter((p) => p.currency === 'USD').map((p) => ({ id: i.id, ...p })));
    expect(usdPlans.length).toBeGreaterThan(0);
    for (const plan of usdPlans) {
      // 센트라면 최소 100 이상이어야 정상. 20(=$0.20) 같은 달러값 오기를 잡는다
      expect(plan.amount, `${plan.id}/${plan.label}`).toBeGreaterThanOrEqual(100);
    }
    expect(usdPlans.find((p) => p.id === 'chatgpt')?.amount).toBe(2000); // $20.00
  });

  it('서비스명(name)이 자기 플랜 라벨로 끝나지 않는다 (플랜명은 plans[].label에만)', () => {
    for (const item of CATALOG) {
      for (const plan of item.plans) {
        expect(item.name.endsWith(` ${plan.label}`), `${item.id}: "${item.name}" / ${plan.label}`).toBe(false);
      }
    }
  });

  it('color는 hex, initial은 1~2글자', () => {
    for (const item of CATALOG) {
      expect(item.color, item.id).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect([...item.initial].length, item.id).toBeGreaterThanOrEqual(1);
      expect([...item.initial].length, item.id).toBeLessThanOrEqual(2);
    }
  });

  it('카테고리 값이 유효하다', () => {
    const valid = new Set(['OTT', 'AI', 'SHOPPING', 'MUSIC', 'ETC']);
    for (const item of CATALOG) {
      expect(valid.has(item.category), item.id).toBe(true);
    }
  });
});

describe('toChoseong', () => {
  it('한글 음절 → 초성', () => {
    expect(toChoseong('넷플릭스')).toBe('ㄴㅍㄹㅅ');
    expect(toChoseong('밀리의서재')).toBe('ㅁㄹㅇㅅㅈ');
  });

  it('자모·영문·숫자는 그대로 통과', () => {
    expect(toChoseong('ㄴㅍ')).toBe('ㄴㅍ');
    expect(toChoseong('notion')).toBe('notion');
    expect(toChoseong('애플tv+')).toBe('ㅇㅍtv+');
  });
});

describe('searchCatalog — 초성 검색', () => {
  it('"ㄴㅍ" → 넷플릭스 히트', () => {
    const ids = searchCatalog('ㄴㅍ').map((i) => i.id);
    expect(ids).toContain('netflix');
  });

  it('"ㄴㅍㄹㅅ" → 넷플릭스 히트', () => {
    const ids = searchCatalog('ㄴㅍㄹㅅ').map((i) => i.id);
    expect(ids).toContain('netflix');
  });

  it('"ㅋㄹㄷ" → Claude (한글 별칭의 초성)', () => {
    const ids = searchCatalog('ㅋㄹㄷ').map((i) => i.id);
    expect(ids).toContain('claude');
  });
});

describe('searchCatalog — 부분일치/대소문자/공백', () => {
  it('"netflix" / "넷플" / "NETFLIX" 모두 히트', () => {
    for (const q of ['netflix', '넷플', 'NETFLIX']) {
      expect(searchCatalog(q).map((i) => i.id), q).toContain('netflix');
    }
  });

  it('공백 무시: "apple tv" / "appletv" 동일', () => {
    const a = searchCatalog('apple tv').map((i) => i.id);
    const b = searchCatalog('appletv').map((i) => i.id);
    expect(a).toEqual(b);
    expect(a).toContain('apple-tv-plus');
  });

  it('정렬: 정확일치가 접두/부분일치보다 앞', () => {
    // '유튜브'는 유튜브 프리미엄의 별칭(정확일치), 유튜브 뮤직은 접두일치
    const ids = searchCatalog('유튜브').map((i) => i.id);
    expect(ids[0]).toBe('youtube-premium');
    expect(ids).toContain('youtube-music');
  });

  it('접두일치가 부분일치보다 앞', () => {
    // '쿠팡' → 쿠팡플레이/쿠팡 와우(접두)가 앞, 별칭 부분일치는 뒤
    const ids = searchCatalog('쿠팡').map((i) => i.id);
    expect(ids.indexOf('coupang-play')).toBeLessThan(ids.length);
    expect(ids[0] === 'coupang-play' || ids[0] === 'coupang-wow').toBe(true);
  });

  it('없는 검색어는 빈 배열', () => {
    expect(searchCatalog('zzzzz없는서비스')).toEqual([]);
  });
});

describe('searchCatalog — 경계 케이스', () => {
  it('완성형 아닌 자모 입력에도 크래시 없음', () => {
    for (const q of ['ㅏㅏㅏ', 'ㄱㅏ', 'ㅢ', 'ᄀᄀ', 'ᄀ', 'ㅎㅎㅎㅎㅎㅎ']) {
      expect(() => searchCatalog(q)).not.toThrow();
    }
  });

  it('빈 쿼리/공백만 있는 쿼리는 전체를 카탈로그 순서로 반환', () => {
    expect(searchCatalog('')).toHaveLength(CATALOG.length);
    expect(searchCatalog('   ')).toHaveLength(CATALOG.length);
    expect(searchCatalog('').map((i) => i.id)).toEqual(CATALOG.map((i) => i.id));
  });

  it('이모지/특수문자 입력에도 크래시 없음', () => {
    expect(() => searchCatalog('🎬🎵')).not.toThrow();
    expect(() => searchCatalog('+++')).not.toThrow();
  });
});

describe('catalogToDraft', () => {
  it('name은 서비스명만, 플랜은 catalogId·planLabel로 분리된다', () => {
    const netflix = CATALOG.find((i) => i.id === 'netflix')!;
    const draft = catalogToDraft(netflix, 1);
    expect(draft).toMatchObject({
      name: '넷플릭스',
      catalogId: 'netflix',
      planLabel: '스탠다드',
      category: 'OTT',
      amount: 13500,
      currency: 'KRW',
      cycle: 'MONTHLY',
      cycleCount: 1,
    });
    expect(draft.anchorDate).toBeUndefined(); // 사용자 지정
  });

  it('플랜이 1개여도 플랜명은 name에 섞이지 않는다', () => {
    const wow = CATALOG.find((i) => i.id === 'coupang-wow')!;
    expect(catalogToDraft(wow)).toMatchObject({ name: '쿠팡', planLabel: '와우 멤버십' });
  });

  it('USD 플랜 draft', () => {
    const chatgpt = CATALOG.find((i) => i.id === 'chatgpt')!;
    const draft = catalogToDraft(chatgpt, 0);
    expect(draft.amount).toBe(2000);
    expect(draft.currency).toBe('USD');
  });

  it('YEARLY 플랜 draft', () => {
    const nintendo = CATALOG.find((i) => i.id === 'nintendo-online')!;
    expect(catalogToDraft(nintendo).cycle).toBe('YEARLY');
  });

  it('없는 planIndex는 던진다', () => {
    const netflix = CATALOG.find((i) => i.id === 'netflix')!;
    expect(() => catalogToDraft(netflix, 99)).toThrow();
  });
});
