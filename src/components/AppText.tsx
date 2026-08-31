import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorTokens, Theme } from '../theme/tokens';

export type AppTextVariant = keyof Theme['typography'];

/** semantic 텍스트 컬러 별칭 */
export type AppTextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'brand'
  | 'onBrand'
  | 'danger'
  | 'warning'
  | 'success'
  | 'info';

function resolveColor(colors: ColorTokens, color: AppTextColor): string {
  switch (color) {
    case 'brand':
      return colors.brand.primary;
    case 'onBrand':
      return colors.brand.onPrimary;
    case 'danger':
    case 'warning':
    case 'success':
    case 'info':
      return colors.status[color];
    default:
      return colors.text[color];
  }
}

export interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  color?: AppTextColor;
}

/**
 * 앱 공통 텍스트. tokens.typography variant + semantic 컬러를 적용하고,
 * 시스템 글꼴 크기 설정을 따르되 레이아웃이 깨지지 않도록
 * maxFontSizeMultiplier 1.3으로 확대 상한을 둔다 (앱 내 자체 글꼴 설정 없음).
 */
export function AppText({
  variant = 'body',
  color = 'primary',
  maxFontSizeMultiplier = 1.3,
  style,
  ...rest
}: AppTextProps) {
  const { theme } = useTheme();
  const t = theme.typography[variant];
  const base: TextStyle = {
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    fontWeight: t.fontWeight,
    color: resolveColor(theme.colors, color),
  };
  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier} style={[base, style]} {...rest} />;
}
