import type { Currency, Cycle } from '../domain/types';

/**
 * 구독 서비스 프리셋 카탈로그. 정적 데이터 (DB/네트워크 아님).
 * amount는 최소 화폐단위 정수 (KRW=원, USD=센트. $20 = 2000).
 * 가격은 등록 폼에서 사용자가 수정하는 초기값이므로 정확도보다 커버리지 우선 —
 * 확신이 낮은 값에는 주석을 남겼다.
 */
export interface CatalogPlan {
  label: string;
  amount: number;
  currency: Currency;
  cycle: Cycle;
  cycleCount?: number;
}

export type CatalogCategory = 'OTT' | 'AI' | 'SHOPPING' | 'MUSIC' | 'ETC';

export interface CatalogItem {
  id: string;
  name: string;
  aliases: string[];
  category: CatalogCategory;
  /** hex 브랜드 컬러 */
  color: string;
  /** 아바타용 1~2글자 */
  initial: string;
  plans: CatalogPlan[];
  hasTrial?: boolean;
}

export const CATALOG: CatalogItem[] = [
  // ── OTT ──────────────────────────────────────────────
  {
    id: 'netflix',
    name: '넷플릭스',
    aliases: ['netflix', '넷플'],
    category: 'OTT',
    color: '#E50914',
    initial: 'N',
    plans: [
      { label: '광고형 스탠다드', amount: 5500, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '스탠다드', amount: 13500, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄', amount: 17000, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'tving',
    name: '티빙',
    aliases: ['tving'],
    category: 'OTT',
    color: '#FF153C',
    initial: '티',
    plans: [
      { label: '광고형 스탠다드', amount: 5500, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '베이직', amount: 9500, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '스탠다드', amount: 13500, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄', amount: 17000, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'wavve',
    name: '웨이브',
    aliases: ['wavve', '웨이브온'],
    category: 'OTT',
    color: '#1351F9',
    initial: 'W',
    plans: [
      { label: '베이직', amount: 7900, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '스탠다드', amount: 10900, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄', amount: 13900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'coupang-play',
    name: '쿠팡플레이',
    aliases: ['coupang play', '쿠플'],
    category: 'OTT',
    color: '#0074E9',
    initial: '쿠',
    // 단독 상품 없음 — 와우 멤버십에 포함
    plans: [{ label: '와우 멤버십 포함', amount: 7890, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'disney-plus',
    name: '디즈니플러스',
    aliases: ['disney+', 'disney plus', '디즈니+'],
    category: 'OTT',
    color: '#113CCF',
    initial: 'D',
    plans: [
      { label: '스탠다드', amount: 9900, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄', amount: 13900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'watcha',
    name: '왓챠',
    aliases: ['watcha'],
    category: 'OTT',
    color: '#FF0558',
    initial: 'W',
    hasTrial: true,
    plans: [
      { label: '베이직', amount: 7900, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄', amount: 12900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'laftel',
    name: '라프텔',
    aliases: ['laftel'],
    category: 'OTT',
    color: '#816BFF',
    initial: '라',
    // 플랜 구성 확신 낮음 — 대표 플랜 1개만
    plans: [{ label: '멤버십', amount: 9900, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'apple-tv-plus',
    name: '애플TV+',
    aliases: ['apple tv+', 'apple tv plus', '애플티비'],
    category: 'OTT',
    color: '#000000',
    initial: 'tv',
    // 인상되었을 수 있음 (6,500 → 9,900 가능성)
    plans: [{ label: '월간', amount: 6500, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'youtube-premium',
    name: '유튜브 프리미엄',
    aliases: ['youtube premium', '유튜브'],
    category: 'OTT',
    color: '#FF0000',
    initial: 'Y',
    hasTrial: true,
    plans: [{ label: '개인', amount: 14900, currency: 'KRW', cycle: 'MONTHLY' }],
  },

  // ── AI ──────────────────────────────────────────────
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    aliases: ['챗지피티', '챗gpt', 'openai', 'gpt'],
    category: 'AI',
    color: '#10A37F',
    initial: 'G',
    plans: [
      { label: 'Plus', amount: 2000, currency: 'USD', cycle: 'MONTHLY' },
      { label: 'Pro', amount: 20000, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'claude-pro',
    name: 'Claude Pro',
    aliases: ['클로드', 'anthropic'],
    category: 'AI',
    color: '#D97757',
    initial: 'C',
    plans: [
      { label: 'Pro', amount: 2000, currency: 'USD', cycle: 'MONTHLY' },
      { label: 'Max', amount: 10000, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'gemini-advanced',
    name: 'Gemini Advanced',
    aliases: ['제미나이', 'google ai pro', 'gemini'],
    category: 'AI',
    color: '#4285F4',
    initial: 'G',
    hasTrial: true,
    // Google One AI Premium 통합 요금 기준
    plans: [{ label: 'AI Pro', amount: 29000, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'perplexity-pro',
    name: 'Perplexity Pro',
    aliases: ['퍼플렉시티'],
    category: 'AI',
    color: '#20808D',
    initial: 'P',
    plans: [{ label: 'Pro', amount: 2000, currency: 'USD', cycle: 'MONTHLY' }],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    aliases: ['커서'],
    category: 'AI',
    color: '#000000',
    initial: 'C',
    plans: [{ label: 'Pro', amount: 2000, currency: 'USD', cycle: 'MONTHLY' }],
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    aliases: ['깃허브 코파일럿', 'copilot', '코파일럿'],
    category: 'AI',
    color: '#24292F',
    initial: 'C',
    plans: [
      { label: 'Pro', amount: 1000, currency: 'USD', cycle: 'MONTHLY' },
      { label: 'Pro+', amount: 3900, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    aliases: ['미드저니'],
    category: 'AI',
    color: '#1C1C1E',
    initial: 'M',
    plans: [
      { label: 'Basic', amount: 1000, currency: 'USD', cycle: 'MONTHLY' },
      { label: 'Standard', amount: 3000, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    aliases: ['노션 ai'],
    category: 'AI',
    color: '#000000',
    initial: 'N',
    // 요금제 개편으로 상위 플랜에 통합되었을 수 있음
    plans: [{ label: 'AI 추가', amount: 1000, currency: 'USD', cycle: 'MONTHLY' }],
  },

  // ── SHOPPING ────────────────────────────────────────
  {
    id: 'coupang-wow',
    name: '쿠팡 와우',
    aliases: ['coupang', '쿠팡', '와우 멤버십'],
    category: 'SHOPPING',
    color: '#E52528',
    initial: '쿠',
    plans: [{ label: '와우 멤버십', amount: 7890, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'naver-plus',
    name: '네이버플러스 멤버십',
    aliases: ['naver plus', '네이버 멤버십', '네플멤'],
    category: 'SHOPPING',
    color: '#03C75A',
    initial: '네이',
    plans: [{ label: '멤버십', amount: 4900, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'shinsegae-universe',
    name: '신세계 유니버스',
    aliases: ['ssg', '신세계 유니버스 클럽'],
    category: 'SHOPPING',
    color: '#FF3E3E',
    initial: 'S',
    plans: [{ label: '유니버스 클럽 (연간)', amount: 30000, currency: 'KRW', cycle: 'YEARLY' }],
  },
  {
    id: 'kurly-members',
    name: '컬리멤버스',
    aliases: ['kurly', '마켓컬리', '컬리'],
    category: 'SHOPPING',
    color: '#5F0080',
    initial: '컬',
    plans: [{ label: '멤버스', amount: 1900, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'baemin-club',
    name: '배민클럽',
    aliases: ['배달의민족', '배민'],
    category: 'SHOPPING',
    color: '#2AC1BC',
    initial: '배',
    plans: [{ label: '배민클럽', amount: 3990, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'yogipass',
    name: '요기패스',
    aliases: ['요기요', 'yogiyo', '요기패스x'],
    category: 'SHOPPING',
    color: '#FA0050',
    initial: '요',
    // 요기패스X 기준, 가격 변동 잦음
    plans: [{ label: '요기패스X', amount: 2900, currency: 'KRW', cycle: 'MONTHLY' }],
  },

  // ── MUSIC ───────────────────────────────────────────
  {
    id: 'melon',
    name: '멜론',
    aliases: ['melon'],
    category: 'MUSIC',
    color: '#00CD3C',
    initial: 'M',
    // 이용권 구성 확신 낮음
    plans: [
      { label: '모바일 스트리밍', amount: 7600, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '스트리밍 플러스', amount: 10900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'genie',
    name: '지니뮤직',
    aliases: ['genie', '지니'],
    category: 'MUSIC',
    color: '#3498DB',
    initial: 'g',
    // 대표 플랜 1개 (확신 낮음)
    plans: [{ label: '음악감상', amount: 8400, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'flo',
    name: '플로',
    aliases: ['flo'],
    category: 'MUSIC',
    color: '#3F3FFF',
    initial: 'F',
    // 대표 플랜 1개 (확신 낮음)
    plans: [{ label: '무제한 듣기', amount: 7900, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'youtube-music',
    name: '유튜브 뮤직',
    aliases: ['youtube music'],
    category: 'MUSIC',
    color: '#FF0000',
    initial: 'Y',
    plans: [{ label: '개인', amount: 11990, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'spotify',
    name: '스포티파이',
    aliases: ['spotify'],
    category: 'MUSIC',
    color: '#1DB954',
    initial: 'S',
    hasTrial: true,
    plans: [{ label: '개인', amount: 11990, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'apple-music',
    name: '애플뮤직',
    aliases: ['apple music'],
    category: 'MUSIC',
    color: '#FA243C',
    initial: 'A',
    plans: [{ label: '개인', amount: 8900, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'bugs',
    name: '벅스',
    aliases: ['bugs', '벅스뮤직'],
    category: 'MUSIC',
    color: '#E45A00',
    initial: 'B',
    // 대표 플랜 1개 (확신 낮음)
    plans: [{ label: '듣기 무제한', amount: 8900, currency: 'KRW', cycle: 'MONTHLY' }],
  },

  // ── ETC ─────────────────────────────────────────────
  {
    id: 'millie',
    name: '밀리의서재',
    aliases: ['millie', '밀리'],
    category: 'ETC',
    color: '#FFD400',
    initial: '밀',
    hasTrial: true,
    plans: [{ label: '정기구독', amount: 9900, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'ridi-select',
    name: '리디셀렉트',
    aliases: ['ridi', '리디북스', '리디'],
    category: 'ETC',
    color: '#1E9EFF',
    initial: 'R',
    hasTrial: true,
    plans: [{ label: '셀렉트', amount: 4900, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'welaaa',
    name: '윌라',
    aliases: ['welaaa', '윌라 오디오북'],
    category: 'ETC',
    color: '#FF7940',
    initial: '윌',
    hasTrial: true,
    // 대표 플랜 1개 (확신 낮음)
    plans: [{ label: '오디오북 멤버십', amount: 9900, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'adobe-cc',
    name: '어도비 CC',
    aliases: ['adobe', 'creative cloud', '어도비 크리에이티브 클라우드', '포토샵'],
    category: 'ETC',
    color: '#FF0000',
    initial: 'A',
    // 연간 약정의 월 결제 기준 (확신 낮음)
    plans: [
      { label: '포토그래피', amount: 11000, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '모든 앱', amount: 62000, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'microsoft-365',
    name: '마이크로소프트 365',
    aliases: ['microsoft 365', 'ms365', 'office', '오피스', 'ms 오피스'],
    category: 'ETC',
    color: '#D83B01',
    initial: 'M',
    plans: [
      { label: 'Personal (월간)', amount: 8900, currency: 'KRW', cycle: 'MONTHLY' },
      { label: 'Personal (연간)', amount: 89000, currency: 'KRW', cycle: 'YEARLY' },
    ],
  },
  {
    id: 'google-one',
    name: '구글 원',
    aliases: ['google one', '구글 드라이브', 'google drive'],
    category: 'ETC',
    color: '#4285F4',
    initial: 'G',
    plans: [
      { label: '베이식 100GB', amount: 2400, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄 2TB', amount: 11900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'icloud-plus',
    name: 'iCloud+',
    aliases: ['아이클라우드', 'icloud'],
    category: 'ETC',
    color: '#3693F3',
    initial: 'i',
    plans: [
      { label: '50GB', amount: 1100, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '200GB', amount: 3300, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '2TB', amount: 11100, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'dropbox',
    name: '드롭박스',
    aliases: ['dropbox'],
    category: 'ETC',
    color: '#0061FF',
    initial: 'D',
    plans: [{ label: 'Plus', amount: 1199, currency: 'USD', cycle: 'MONTHLY' }],
  },
  {
    id: 'notion',
    name: '노션',
    aliases: ['notion'],
    category: 'ETC',
    color: '#000000',
    initial: 'N',
    // 월간 결제 기준 (연간 결제 시 $10/월)
    plans: [{ label: 'Plus', amount: 1200, currency: 'USD', cycle: 'MONTHLY' }],
  },
  {
    id: 'figma',
    name: '피그마',
    aliases: ['figma'],
    category: 'ETC',
    color: '#F24E1E',
    initial: 'F',
    // 월간 결제 기준 (연간 결제 시 $12/월)
    plans: [{ label: 'Professional', amount: 1500, currency: 'USD', cycle: 'MONTHLY' }],
  },
  {
    id: 'kakao-emoticon-plus',
    name: '카카오톡 이모티콘 플러스',
    aliases: ['이모티콘 플러스', '카톡 이모티콘'],
    category: 'ETC',
    color: '#FEE500',
    initial: '카',
    // 결제 경로에 따라 3,900원일 수 있음
    plans: [{ label: '이모티콘 플러스', amount: 4900, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'naver-webtoon-cookie',
    name: '네이버웹툰 쿠키',
    aliases: ['웹툰 쿠키', '쿠키 자동충전', '네이버웹툰'],
    category: 'ETC',
    color: '#00DC64',
    initial: '웹',
    // 정기 상품이 아니라 자동충전 기준의 예시 금액 — 사용자 수정 전제
    plans: [{ label: '쿠키 자동충전(월 10개)', amount: 1200, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'x-premium',
    name: 'X 프리미엄',
    aliases: ['x premium', '트위터 블루', 'twitter'],
    category: 'ETC',
    color: '#000000',
    initial: 'X',
    plans: [{ label: 'Premium', amount: 800, currency: 'USD', cycle: 'MONTHLY' }],
  },
  {
    id: 'ps-plus',
    name: 'PlayStation Plus',
    aliases: ['플스 플러스', '플레이스테이션 플러스', 'psn'],
    category: 'ETC',
    color: '#0070D1',
    initial: 'PS',
    // 대표 플랜 1개 (확신 낮음)
    plans: [{ label: '에센셜', amount: 7500, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'xbox-game-pass',
    name: 'Xbox Game Pass',
    aliases: ['게임패스', '엑스박스'],
    category: 'ETC',
    color: '#107C10',
    initial: 'X',
    // 대표 플랜 1개 (확신 낮음)
    plans: [{ label: 'Ultimate', amount: 13500, currency: 'KRW', cycle: 'MONTHLY' }],
  },
  {
    id: 'nintendo-online',
    name: '닌텐도 스위치 온라인',
    aliases: ['nintendo switch online', '닌텐도 온라인'],
    category: 'ETC',
    color: '#E60012',
    initial: '닌',
    plans: [{ label: '개인 (연간)', amount: 19900, currency: 'KRW', cycle: 'YEARLY' }],
  },
];

/** 등록된 구독 이름 → 칩 이니셜. 카탈로그에 없는 이름(직접 입력)은 첫 글자 */
export function initialForServiceName(name: string): string {
  const preset = CATALOG.find((i) => i.name === name);
  return preset?.initial ?? [...name.trim()][0] ?? '?';
}

/**
 * 이름·금액·주기가 카탈로그 플랜과 일치하면 플랜 라벨('스탠다드' 등)을 반환한다.
 * 사용자가 금액을 수정했거나 직접 입력한 구독이면 null.
 */
export function planLabelFor(sub: {
  name: string;
  amount: number;
  currency: Currency;
  cycle: Cycle;
  cycleCount: number;
}): string | null {
  const item = CATALOG.find((i) => i.name === sub.name);
  const plan = item?.plans.find(
    (p) =>
      p.amount === sub.amount &&
      p.currency === sub.currency &&
      p.cycle === sub.cycle &&
      (p.cycleCount ?? 1) === sub.cycleCount,
  );
  return plan?.label ?? null;
}
