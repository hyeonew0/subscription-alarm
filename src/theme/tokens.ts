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
    OTT: string;
    AI: string;
    SHOPPING: string;
    MUSIC: string;
    ETC: string;
  };
}

export const lightColors: ColorTokens = {
  bg: {
    canvas: '#F5F6F8',
    surface: '#FFFFFF',
    surfaceAlt: '#EDEFF3',
    overlay: '#000000A6',
  },
  text: {
    primary: '#1A202C',
    secondary: '#4A5462',
    tertiary: '#60697A',
    inverse: '#FFFFFF',
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
  // status.danger와의 충돌을 피해 OTT는 보라. AI/SHOPPING은 흰 칩 텍스트
  // WCAG AA(4.5:1)를 위해 지정값(#0891B2/#EA580C)보다 한 단계 어둡게 보정.
  category: {
    OTT: '#7C3AED',
    AI: '#0E7490',
    SHOPPING: '#C2410C',
    MUSIC: '#DB2777',
    ETC: '#64748B',
  },
};

export const darkColors: ColorTokens = {
  bg: {
    canvas: '#121214',
    surface: '#1C1C1F',
    surfaceAlt: '#26262B',
    overlay: '#000000B3',
  },
  text: {
    primary: '#ECEDEF',
    secondary: '#B4BCC7',
    tertiary: '#8E98A5',
    inverse: '#17181A',
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
  category: {
    OTT: '#A78BFA',
    AI: '#22D3EE',
    SHOPPING: '#FB923C',
    MUSIC: '#F472B6',
    ETC: '#94A3B8',
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
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  micro: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
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

export type ColorScheme = 'light' | 'dark';
export type ThemeMode = 'system' | ColorScheme;

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  elevation: ElevationTokens;
}

export const lightTheme: Theme = {
  scheme: 'light',
  colors: lightColors,
  spacing,
  radius,
  typography,
  elevation: lightElevation,
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: darkColors,
  spacing,
  radius,
  typography,
  elevation: darkElevation,
};
