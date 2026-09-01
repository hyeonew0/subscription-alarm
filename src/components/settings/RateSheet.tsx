import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { showToast } from '../../lib/toast';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';
import { BottomSheet } from '../BottomSheet';
import { FieldLabel, FormTextInput } from '../form/FormField';

/** USD 환율 입력 시트 (1달러 = N원) */
export function RateSheet({
  visible,
  initial,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: number;
  onSave: (rate: number) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [text, setText] = useState(String(initial));
  useEffect(() => {
    if (visible) setText(String(initial));
  }, [visible, initial]);

  const save = () => {
    const rate = Number(text.replace(/,/g, ''));
    if (!Number.isFinite(rate) || rate <= 0) {
      showToast('환율을 확인해 주세요');
      return;
    }
    onSave(rate);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: theme.spacing.lg }}>
        <AppText variant="heading">환율 (USD)</AppText>
        <View style={{ gap: theme.spacing.sm }}>
          <FieldLabel>1달러 기준 원화</FieldLabel>
          <FormTextInput
            value={text}
            onChangeText={setText}
            keyboardType="decimal-pad"
            placeholder="1,400"
          />
          <AppText variant="micro" color="tertiary">
            USD 구독의 원화 환산에 사용돼요
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={save}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <AppText variant="body" color="onBrand" style={{ fontWeight: '700' }}>
            저장
          </AppText>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
