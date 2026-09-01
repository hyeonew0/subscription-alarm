import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { elevationStyle } from '../theme/elevation';
import { useTheme } from '../theme/ThemeProvider';

export interface CardProps {
  /** 'tight'는 총액·광고 카드처럼 얕은 카드용 (paddingTight 16) */
  variant?: 'default' | 'tight';
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/** card 토큰 규격 카드. 카드 간 간격은 부모 컨테이너의 gap으로 처리한다. */
export function Card({ variant = 'default', style, children }: CardProps) {
  const { theme } = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.bg.surface,
    borderRadius: theme.card.radius,
    padding: variant === 'tight' ? theme.card.paddingTight : theme.card.padding,
    ...elevationStyle(theme.card.shadow),
  };
  return <View style={[base, style]}>{children}</View>;
}
