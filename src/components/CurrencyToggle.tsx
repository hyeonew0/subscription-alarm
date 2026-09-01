import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Currency } from '../domain/types';
import { useTheme } from '../theme/ThemeProvider';

/** KRW/USD 토글 (96×52, 08_수정폼 목업 규격) */
export function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (next: Currency) => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: 96,
        height: 52,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.bg.canvas,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        gap: 4,
      }}
    >
      {(['KRW', 'USD'] as const).map((currency) => {
        const active = currency === value;
        return (
          <Pressable
            key={currency}
            onPress={() => onChange(currency)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: theme.radius.sm,
              backgroundColor: active ? theme.colors.brand.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.caption.fontSize,
                fontWeight: '600',
                color: active ? theme.colors.brand.onPrimary : theme.colors.text.secondary,
              }}
              maxFontSizeMultiplier={1.3}
            >
              {currency}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
