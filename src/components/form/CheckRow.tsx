import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';

/** 체크박스 행 (20×20, radius 6 — 08_수정폼 목업 규격) */
export function CheckRow({
  checked,
  label,
  onPress,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? theme.colors.brand.primary : undefined,
          borderWidth: checked ? 0 : 1.5,
          borderColor: theme.colors.border.default,
        }}
      >
        {checked && <Feather name="check" size={14} color={theme.colors.brand.onPrimary} />}
      </View>
      <AppText variant="body" color={checked ? 'primary' : 'tertiary'}>
        {label}
      </AppText>
    </Pressable>
  );
}
