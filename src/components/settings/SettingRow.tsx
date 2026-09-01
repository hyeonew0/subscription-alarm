import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText, type AppTextColor } from '../AppText';

export interface SettingRowProps {
  label: string;
  /** 우측 값 텍스트 (caption) */
  value?: string;
  valueColor?: AppTextColor;
  /** 우측 chevron 표시 여부 (탭 가능한 행) */
  chevron?: boolean;
  onPress?: () => void;
  /** value 대신 커스텀 우측 요소 (Switch 등) */
  right?: React.ReactNode;
}

/** 설정 행 (04_설정 목업): 라벨 body — 값 caption + chevron 12 */
export function SettingRow({
  label,
  value,
  valueColor = 'tertiary',
  chevron = false,
  onPress,
  right,
}: SettingRowProps) {
  const { theme } = useTheme();
  const content = (
    <>
      <AppText variant="body">{label}</AppText>
      {right ?? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          {value !== undefined && (
            <AppText variant="caption" color={valueColor}>
              {value}
            </AppText>
          )}
          {chevron && (
            <Feather name="chevron-right" size={12} color={theme.colors.text.tertiary} />
          )}
        </View>
      )}
    </>
  );
  const rowStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as const;
  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ ...rowStyle, opacity: pressed ? 0.7 : 1 })}
    >
      {content}
    </Pressable>
  );
}
