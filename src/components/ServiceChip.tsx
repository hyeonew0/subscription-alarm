import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface ServiceChipProps {
  /** 이니셜 1~2글자 */
  initial: string;
  /** 배경색 (카테고리 셰이드) */
  color: string;
  /** 이니셜 텍스트 색 (기본 text.inverse — 밝은 칩은 onBright) */
  textColor?: string;
  size?: 40 | 48 | 52 | 64;
}

const FONT_SIZE: Record<number, number> = { 40: 13, 48: 16, 52: 15, 64: 19 };

/** 서비스 원형 칩 + 이니셜. 홈/목록/등록/상세에서 공용 */
export function ServiceChip({ initial, color, textColor, size = 40 }: ServiceChipProps) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius.full,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: FONT_SIZE[size],
          fontWeight: '700',
          color: textColor ?? theme.colors.text.inverse,
        }}
        maxFontSizeMultiplier={1.3}
      >
        {initial}
      </Text>
    </View>
  );
}
