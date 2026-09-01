import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';
import { BottomSheet } from '../BottomSheet';

export interface SheetOption<T extends string> {
  value: T;
  label: string;
  /** 우측 보조 텍스트 (플랜 금액 등) */
  detail?: string;
  /** 해지 등 파괴적 액션 — 라벨을 status.danger로 */
  destructive?: boolean;
}

/** 단일 선택 바텀시트 (정렬·카테고리·플랜 공용): 선택 항목은 brand + 체크 */
export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: Array<SheetOption<T>>;
  selected: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="heading" style={{ marginBottom: theme.spacing.sm }}>
          {title}
        </AppText>
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
              style={({ pressed }) => ({
                height: 48,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing.md,
                backgroundColor: pressed ? theme.colors.bg.surfaceAlt : undefined,
              })}
            >
              <AppText
                variant="body"
                color={option.destructive ? 'danger' : active ? 'brand' : 'primary'}
                style={active && { fontWeight: '600' }}
              >
                {option.label}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                {option.detail !== undefined && (
                  <AppText variant="caption" color="tertiary">
                    {option.detail}
                  </AppText>
                )}
                {active && <Feather name="check" size={18} color={theme.colors.brand.primary} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
