import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Cycle } from '../domain/types';
import { useTheme } from '../theme/ThemeProvider';

const LABELS: Array<[Cycle, string]> = [
  ['WEEKLY', '매주'],
  ['MONTHLY', '매월'],
  ['YEARLY', '매년'],
];

/** 결제 주기 세그먼트 (08_수정폼 목업 규격: 3분할, 높이 44) */
export function CycleSegment({
  value,
  onChange,
}: {
  value: Cycle;
  onChange: (next: Cycle) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      {LABELS.map(([cycle, label]) => {
        const active = cycle === value;
        return (
          <Pressable
            key={cycle}
            onPress={() => onChange(cycle)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: theme.radius.md,
              backgroundColor: active ? theme.colors.brand.primary : theme.colors.bg.canvas,
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
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
