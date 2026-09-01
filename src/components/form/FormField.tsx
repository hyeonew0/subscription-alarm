import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';

/** 폼 필드 라벨 (caption / text.secondary) */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <AppText variant="caption" color="secondary">
      {children}
    </AppText>
  );
}

/** 폼 공통 텍스트 입력 (높이 52, bg.canvas, radius.md — 08_수정폼 목업 규격) */
export function FormTextInput({ style, multiline, ...rest }: TextInputProps) {
  const { theme } = useTheme();
  return (
    <TextInput
      style={[
        {
          height: multiline ? 88 : 52,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bg.canvas,
          paddingHorizontal: multiline ? theme.spacing.md : theme.spacing.lg,
          paddingVertical: multiline ? theme.spacing.md : 0,
          fontSize: theme.typography.body.fontSize,
          color: theme.colors.text.primary,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        style,
      ]}
      multiline={multiline}
      placeholderTextColor={theme.colors.text.tertiary}
      maxFontSizeMultiplier={1.3}
      {...rest}
    />
  );
}
