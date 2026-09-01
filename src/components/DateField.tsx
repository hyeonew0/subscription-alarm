import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { formatKoreanDate, fromLocalDate, toLocalDate, type YMD } from '../domain/date';
import { useTheme } from '../theme/ThemeProvider';

/** 날짜 필드 (높이 52, bg.canvas) — 탭하면 네이티브 DateTimePicker. open/onOpenChange로 외부 제어 가능 */
export function DateField({
  value,
  onChange,
  open,
  onOpenChange,
}: {
  value: YMD;
  onChange: (next: YMD) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { theme } = useTheme();
  const [internalOpen, setInternalOpen] = useState(false);
  const showPicker = open ?? internalOpen;
  const setShowPicker = onOpenChange ?? setInternalOpen;
  return (
    <>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={{
          height: 52,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bg.canvas,
          paddingHorizontal: theme.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{ fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }}
          maxFontSizeMultiplier={1.3}
        >
          {formatKoreanDate(value)}
        </Text>
        <Feather name="calendar" size={20} color={theme.colors.text.tertiary} />
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={toLocalDate(value)}
          mode="date"
          onChange={(_event, selected) => {
            setShowPicker(false);
            if (selected) onChange(fromLocalDate(selected));
          }}
        />
      )}
    </>
  );
}
