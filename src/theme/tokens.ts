/**
 * 디자인 토큰 (Figma Variables와 1:1 대응).
 * 이 파일은 순수 데이터 — react-native를 import하지 않아 노드 테스트에서 그대로 검증한다.
 * 색상 방향:
 * - 라이트: 흰 배경 기반 중성 회색 계열
 * - 다크: 순수 검정 대신 #121212 계열 (OLED 번인 방지 + 눈 편함)
 * - brand.primary: 딥 블루. 구독/금액 관리 앱은 "내 돈을 맡겨도 되는가"가 첫인상을
 *   결정하므로 금융권에서 신뢰·안정의 관습색으로 굳은 블루를 채택. 채도를 살짝 눌러
 *   경고색(danger/warning)과의 위계 충돌도 피한다.
 * - 모든 text/bg 조합은 WCAG AA(4.5:1) 이상 (tests/theme.test.ts에서 전수 검증)
 */

export interface ColorTokens {
  bg: {
    /** 화면 최하단 배경 */
    canvas: string;
    /** 카드/시트 배경 */
    surface: string;
    /** 눌린 상태, 구분 영역 */
    surfaceAlt: string;
    /** 모달 뒷배경 (#RRGGBBAA) */
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    /** 캡션, 비활성 */
    tertiary: string;
    /** 강조 배경 위 텍스트 */
    inverse: string;
    /** 밝은 칩/배경 위 텍스트 — 양 모드 모두 어두운 색 (예: AI shade 3) */
    onBright: string;
  };
  border: {
    default: string;
    subtle: string;
  };
  brand: {
    /** 주 액션 컬러 */
    primary: string;
    onPrimary: string;
  };
  status: {
    /** 해지/삭제 */
    danger: string;
    /** 결제 임박 (3일 이내) */
    warning: string;
    /** 무료체험 중 */
    success: string;
    info: string;
  };
  /** 카테고리 식별 컬러. 다크에서는 채도를 낮춰 눈부심 방지 */
  category: {
    OTT: CategoryColor;
    AI: CategoryColor;
    SHOPPING: CategoryColor;
    MUSIC: CategoryColor;
    ETC: CategoryColor;
  };
}

/**
 * 카테고리 컬러 + 명도 3단계 (같은 카테고리 내 항목 구분용, 카드 안에서 1→2→3 반복).
 * 모든 값은 칩 위 text.inverse와 WCAG AA(4.5:1) 이상 (테스트로 검증).
 */
export interface CategoryColor {
  base: string;
  1: string;
  2: string;
  3: string;
}

export const lightColors: ColorTokens = {
  bg: {
    canvas: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EDEFF3',
    overlay: '#00000066',
  },
  text: {
    primary: '#1A202C',
    secondary: '#4A5462',
    tertiary: '#60697A',
    inverse: '#FFFFFF',
    onBright: '#1A202C',
  },
  border: {
    default: '#D2D8E0',
    subtle: '#E7EAEF',
  },
  brand: {
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
  },
  status: {
    danger: '#B91C1C',
    warning: '#9A4207',
    success: '#166534',
    info: '#1D4ED8',
  },
  // status.danger와의 충돌을 피해 OTT는 보라. 라이트 셰이드는 흰 칩 텍스트
  // WCAG AA(4.5:1)를 통과하도록 지정 팔레트에서 한 단계씩 어둡게 보정됨.
  category: {
    OTT: { base: '#7C3AED', 1: '#6D28D9', 2: '#7C3AED', 3: '#8250F0' },
    // AI.3은 명도 간격 확대를 위해 밝은 청록 — 텍스트는 text.onBright(어두운 색) 사용.
    // .2 지정값 #0891B2는 흰 텍스트 3.7:1이라 #0E7490으로 보정.
    AI: { base: '#0E7490', 1: '#0E5A6B', 2: '#0E7490', 3: '#22D3EE' },
    SHOPPING: { base: '#C2410C', 1: '#9A3412', 2: '#C2410C', 3: '#CC450E' },
    MUSIC: { base: '#DB2777', 1: '#9D174D', 2: '#BE185D', 3: '#DB2777' },
    ETC: { base: '#64748B', 1: '#334155', 2: '#475569', 3: '#64748B' },
  },
};

export const darkColors: ColorTokens = {
  bg: {
    canvas: '#121214',
    surface: '#1C1C1F',
    surfaceAlt: '#26262B',
    overlay: '#00000094',
  },
  text: {
    primary: '#ECEDEF',
    secondary: '#B4BCC7',
    tertiary: '#8E98A5',
    inverse: '#17181A',
    onBright: '#17181A',
  },
  border: {
    default: '#3A3B41',
    subtle: '#2A2B30',
  },
  brand: {
    primary: '#6BA6FF',
    onPrimary: '#0A2540',
  },
  status: {
    danger: '#FF8080',
    warning: '#FFB74D',
    success: '#6CCF8E',
    info: '#7EB8FF',
  },
  // 셰이드 순서는 라이트와 동일: 1이 가장 강조(진함), 3으로 갈수록 연함
  category: {
    OTT: { base: '#A78BFA', 1: '#9D7AF8', 2: '#A78BFA', 3: '#C4B5FD' },
    AI: { base: '#22D3EE', 1: '#06B6D4', 2: '#22D3EE', 3: '#67E8F9' },
    SHOPPING: { base: '#FB923C', 1: '#F97316', 2: '#FB923C', 3: '#FDBA74' },
    MUSIC: { base: '#F472B6', 1: '#EC4899', 2: '#F472B6', 3: '#F9A8D4' },
    ETC: { base: '#94A3B8', 1: '#8494AB', 2: '#94A3B8', 3: '#CBD5E1' },
  },
};

/** 4px 기준 스페이싱 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export interface TypographyToken {
  fontSize: number;
  lineHeight: number;
  /** RN fontWeight 문자열 */
  fontWeight: '400' | '600' | '700';
}

export const typography = {
  display: { fontSize: 26, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 19, lineHeight: 26, fontWeight: '700' },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyBold: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  micro: { fontSize: 11, lineHeight: 15, fontWeight: '400' },
} as const satisfies Record<string, TypographyToken>;

/**
 * iOS shadow / Android elevation 원자료.
 * 다크모드는 shadow 대신 bg.surface 밝기 차이로 깊이를 표현하므로 값이 전부 0이다.
 * Platform 분기 적용은 src/theme/elevation.ts의 elevationStyle()이 담당.
 */
export interface ElevationToken {
  ios: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
  };
  android: { elevation: number };
}

export interface ElevationTokens {
  none: ElevationToken;
  card: ElevationToken;
  modal: ElevationToken;
}

const NO_ELEVATION: ElevationToken = {
  ios: { shadowColor: '#000000', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
  android: { elevation: 0 },
};

export const lightElevation: ElevationTokens = {
  none: NO_ELEVATION,
  card: {
    ios: { shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 2 },
  },
  modal: {
    ios: { shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
    android: { elevation: 8 },
  },
};

export const darkElevation: ElevationTokens = {
  none: NO_ELEVATION,
  card: NO_ELEVATION,
  modal: NO_ELEVATION,
};

/** 카드 규격. 그림자는 테마 의존이라 light/dark 분리 */
export interface CardTokens {
  radius: number;
  padding: number;
  /** 총액·광고 카드처럼 얕은 카드용 */
  paddingTight: number;
  /** 카드 간 간격 */
  gap: number;
  shadow: ElevationToken;
}

const CARD_METRICS = { radius: 20, padding: 20, paddingTight: 16, gap: 16 } as const;

export const lightCard: CardTokens = {
  ...CARD_METRICS,
  shadow: {
    ios: { shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 1 },
  },
};

export const darkCard: CardTokens = {
  ...CARD_METRICS,
  shadow: NO_ELEVATION,
};

export type ColorScheme = 'light' | 'dark';
export type ThemeMode = 'system' | ColorScheme;

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  elevation: ElevationTokens;
  card: CardTokens;
}

/**
 * 카테고리 칩 색 조합. 밝은 셰이드(라이트 AI.3)는 흰 텍스트 AA 미달이라
 * text.onBright(어두운 색)를 쓴다 — 나머지는 text.inverse.
 */
export function getCategoryChipColors(
  theme: Pick<Theme, 'scheme' | 'colors'>,
  category: keyof ColorTokens['category'],
  shade: 1 | 2 | 3,
): { bg: string; text: string } {
  const bg = theme.colors.category[category][shade];
  const text =
    theme.scheme === 'light' && category === 'AI' && shade === 3
      ? theme.colors.text.onBright
      : theme.colors.text.inverse;
  return { bg, text };
}

export const lightTheme: Theme = {
  scheme: 'light',
  colors: lightColors,
  spacing,
  radius,
  typography,
  elevation: lightElevation,
  card: lightCard,
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: darkColors,
  spacing,
  radius,
  typography,
  elevation: darkElevation,
  card: darkCard,
};
