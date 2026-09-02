import type { Currency, Cycle } from '../../domain/types';

/**
 * ⚠️ 동결된 스냅샷 — v5 마이그레이션(catalog_id·plan_label 백필) 전용.
 * 마이그레이션은 출시 후 동결이므로 살아있는 CATALOG를 참조하면 안 된다
 * (카탈로그가 바뀌면 같은 DB가 다른 결과로 마이그레이션되는 문제).
 * 카탈로그를 수정하더라도 이 파일은 절대 손대지 말 것.
 *
 * - name: v5 시점의 서비스명 (플랜명 분리 후)
 * - legacyNames: v4까지 subscriptions.name에 저장되던 형태
 *   (구 서비스명, 그리고 다중 플랜은 "서비스명 플랜명" 조합)
 */
export interface SnapshotPlan {
  label: string;
  amount: number;
  currency: Currency;
  cycle: Cycle;
  cycleCount?: number;
}

export interface SnapshotItem {
  id: string;
  name: string;
  legacyNames: string[];
  plans: SnapshotPlan[];
}

export const V5_CATALOG_SNAPSHOT: readonly SnapshotItem[] = [
  {
    id: 'netflix',
    name: '넷플릭스',
    legacyNames: ['넷플릭스 광고형 스탠다드', '넷플릭스 스탠다드', '넷플릭스 프리미엄'],
    plans: [
      { label: '광고형 스탠다드', amount: 5500, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '스탠다드', amount: 13500, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄', amount: 17000, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'tving',
    name: '티빙',
    legacyNames: ['티빙 광고형 스탠다드', '티빙 베이직', '티빙 스탠다드', '티빙 프리미엄'],
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
    legacyNames: ['웨이브 베이직', '웨이브 스탠다드', '웨이브 프리미엄'],
    plans: [
      { label: '베이직', amount: 7900, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '스탠다드', amount: 10900, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄', amount: 13900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'coupang-play',
    name: '쿠팡플레이',
    legacyNames: [],
    plans: [
      { label: '와우 멤버십 포함', amount: 7890, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'disney-plus',
    name: '디즈니플러스',
    legacyNames: ['디즈니플러스 스탠다드', '디즈니플러스 프리미엄'],
    plans: [
      { label: '스탠다드', amount: 9900, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄', amount: 13900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'watcha',
    name: '왓챠',
    legacyNames: ['왓챠 베이직', '왓챠 프리미엄'],
    plans: [
      { label: '베이직', amount: 7900, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄', amount: 12900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'laftel',
    name: '라프텔',
    legacyNames: [],
    plans: [
      { label: '멤버십', amount: 9900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'apple-tv-plus',
    name: '애플TV+',
    legacyNames: [],
    plans: [
      { label: '월간', amount: 6500, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'youtube-premium',
    name: '유튜브 프리미엄',
    legacyNames: [],
    plans: [
      { label: '개인', amount: 14900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    legacyNames: ['ChatGPT Plus', 'ChatGPT Plus Plus', 'ChatGPT Plus Pro'],
    plans: [
      { label: 'Plus', amount: 2000, currency: 'USD', cycle: 'MONTHLY' },
      { label: 'Pro', amount: 20000, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    legacyNames: ['Claude Pro', 'Claude Pro Pro', 'Claude Pro Max'],
    plans: [
      { label: 'Pro', amount: 2000, currency: 'USD', cycle: 'MONTHLY' },
      { label: 'Max', amount: 10000, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    legacyNames: ['Gemini Advanced'],
    plans: [
      { label: 'AI Pro', amount: 29000, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    legacyNames: ['Perplexity Pro'],
    plans: [
      { label: 'Pro', amount: 2000, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    legacyNames: [],
    plans: [
      { label: 'Pro', amount: 2000, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    legacyNames: ['GitHub Copilot Pro', 'GitHub Copilot Pro+'],
    plans: [
      { label: 'Pro', amount: 1000, currency: 'USD', cycle: 'MONTHLY' },
      { label: 'Pro+', amount: 3900, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    legacyNames: ['Midjourney Basic', 'Midjourney Standard'],
    plans: [
      { label: 'Basic', amount: 1000, currency: 'USD', cycle: 'MONTHLY' },
      { label: 'Standard', amount: 3000, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    legacyNames: [],
    plans: [
      { label: 'AI 추가', amount: 1000, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'coupang-wow',
    name: '쿠팡',
    legacyNames: ['쿠팡 와우'],
    plans: [
      { label: '와우 멤버십', amount: 7890, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'naver-plus',
    name: '네이버플러스',
    legacyNames: ['네이버플러스 멤버십'],
    plans: [
      { label: '멤버십', amount: 4900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'shinsegae-universe',
    name: '신세계 유니버스',
    legacyNames: [],
    plans: [
      { label: '유니버스 클럽 (연간)', amount: 30000, currency: 'KRW', cycle: 'YEARLY' },
    ],
  },
  {
    id: 'kurly-members',
    name: '컬리',
    legacyNames: ['컬리멤버스'],
    plans: [
      { label: '멤버스', amount: 1900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'baemin-club',
    name: '배달의민족',
    legacyNames: ['배민클럽'],
    plans: [
      { label: '배민클럽', amount: 3990, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'yogipass',
    name: '요기요',
    legacyNames: ['요기패스'],
    plans: [
      { label: '요기패스X', amount: 2900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'melon',
    name: '멜론',
    legacyNames: ['멜론 모바일 스트리밍', '멜론 스트리밍 플러스'],
    plans: [
      { label: '모바일 스트리밍', amount: 7600, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '스트리밍 플러스', amount: 10900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'genie',
    name: '지니뮤직',
    legacyNames: [],
    plans: [
      { label: '음악감상', amount: 8400, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'flo',
    name: '플로',
    legacyNames: [],
    plans: [
      { label: '무제한 듣기', amount: 7900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'youtube-music',
    name: '유튜브 뮤직',
    legacyNames: [],
    plans: [
      { label: '개인', amount: 11990, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'spotify',
    name: '스포티파이',
    legacyNames: [],
    plans: [
      { label: '개인', amount: 11990, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'apple-music',
    name: '애플뮤직',
    legacyNames: [],
    plans: [
      { label: '개인', amount: 8900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'bugs',
    name: '벅스',
    legacyNames: [],
    plans: [
      { label: '듣기 무제한', amount: 8900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'millie',
    name: '밀리의서재',
    legacyNames: [],
    plans: [
      { label: '정기구독', amount: 9900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'ridi-select',
    name: '리디셀렉트',
    legacyNames: [],
    plans: [
      { label: '셀렉트', amount: 4900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'welaaa',
    name: '윌라',
    legacyNames: [],
    plans: [
      { label: '오디오북 멤버십', amount: 9900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'adobe-cc',
    name: '어도비 CC',
    legacyNames: ['어도비 CC 포토그래피', '어도비 CC 모든 앱'],
    plans: [
      { label: '포토그래피', amount: 11000, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '모든 앱', amount: 62000, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'microsoft-365',
    name: '마이크로소프트 365',
    legacyNames: ['마이크로소프트 365 Personal (월간)', '마이크로소프트 365 Personal (연간)'],
    plans: [
      { label: 'Personal (월간)', amount: 8900, currency: 'KRW', cycle: 'MONTHLY' },
      { label: 'Personal (연간)', amount: 89000, currency: 'KRW', cycle: 'YEARLY' },
    ],
  },
  {
    id: 'google-one',
    name: '구글 원',
    legacyNames: ['구글 원 베이식 100GB', '구글 원 프리미엄 2TB'],
    plans: [
      { label: '베이식 100GB', amount: 2400, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '프리미엄 2TB', amount: 11900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'icloud-plus',
    name: 'iCloud+',
    legacyNames: ['iCloud+ 50GB', 'iCloud+ 200GB', 'iCloud+ 2TB'],
    plans: [
      { label: '50GB', amount: 1100, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '200GB', amount: 3300, currency: 'KRW', cycle: 'MONTHLY' },
      { label: '2TB', amount: 11100, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'dropbox',
    name: '드롭박스',
    legacyNames: [],
    plans: [
      { label: 'Plus', amount: 1199, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'notion',
    name: '노션',
    legacyNames: [],
    plans: [
      { label: 'Plus', amount: 1200, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'figma',
    name: '피그마',
    legacyNames: [],
    plans: [
      { label: 'Professional', amount: 1500, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'kakao-emoticon-plus',
    name: '카카오톡',
    legacyNames: ['카카오톡 이모티콘 플러스'],
    plans: [
      { label: '이모티콘 플러스', amount: 4900, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'naver-webtoon-cookie',
    name: '네이버웹툰',
    legacyNames: ['네이버웹툰 쿠키'],
    plans: [
      { label: '쿠키 자동충전(월 10개)', amount: 1200, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'x-premium',
    name: 'X',
    legacyNames: ['X 프리미엄'],
    plans: [
      { label: 'Premium', amount: 800, currency: 'USD', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'ps-plus',
    name: 'PlayStation Plus',
    legacyNames: [],
    plans: [
      { label: '에센셜', amount: 7500, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'xbox-game-pass',
    name: 'Xbox Game Pass',
    legacyNames: [],
    plans: [
      { label: 'Ultimate', amount: 13500, currency: 'KRW', cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'nintendo-online',
    name: '닌텐도 스위치 온라인',
    legacyNames: [],
    plans: [
      { label: '개인 (연간)', amount: 19900, currency: 'KRW', cycle: 'YEARLY' },
    ],
  },
];
