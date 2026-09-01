import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { fromLocalDate, formatYMD, type YMD } from '../../domain/date';
import { parseAmountInput } from '../../domain/money';
import type { Currency, Cycle } from '../../domain/types';
import { showToast } from '../../lib/toast';
import type { CreateSubscriptionInput } from '../../repos/subscriptionRepo';
import { useTheme } from '../../theme/ThemeProvider';
import { BottomSheet } from '../BottomSheet';
import { CycleSegment } from '../CycleSegment';
import { DateField } from '../DateField';
import { AmountRow } from '../form/AmountRow';
import { FieldLabel, FormTextInput } from '../form/FormField';

const CATEGORIES: Array<[string, string]> = [
  ['OTT', 'OTT'],
  ['AI', 'AI'],
  ['SHOPPING', '쇼핑'],
  ['MUSIC', '음악'],
  ['ETC', '기타'],
];

/** 직접 입력 시트 — 카탈로그에 없는 서비스 등록 (08_수정폼 필드 구성 재사용) */
export function ManualSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: CreateSubscriptionInput, displayName: string) => void;
}) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ETC');
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState<Currency>('KRW');
  const [cycle, setCycle] = useState<Cycle>('MONTHLY');
  const [date, setDate] = useState<YMD>(() => fromLocalDate(new Date()));

  const submit = () => {
    const trimmed = name.trim();
    const amount = parseAmountInput(amountText, currency);
    if (!trimmed) {
      showToast('서비스명을 입력해 주세요');
      return;
    }
    if (amount === null || amount <= 0) {
      showToast('금액을 확인해 주세요');
      return;
    }
    onSubmit(
      { name: trimmed, category, amount, currency, cycle, anchorDate: formatYMD(date) },
      trimmed,
    );
    setName('');
    setAmountText('');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: 20 }}>
        <View style={{ gap: theme.spacing.sm }}>
          <FieldLabel>서비스명</FieldLabel>
          <FormTextInput value={name} onChangeText={setName} placeholder="예: 넷플릭스" />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <FieldLabel>카테고리</FieldLabel>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {CATEGORIES.map(([value, text]) => {
              const active = value === category;
              return (
                <Pressable
                  key={value}
                  onPress={() => setCategory(value)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: theme.spacing.md,
                    borderRadius: theme.radius.full,
                    backgroundColor: active ? theme.colors.brand.primary : theme.colors.bg.canvas,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.caption.fontSize,
                      color: active ? theme.colors.brand.onPrimary : theme.colors.text.secondary,
                    }}
                    maxFontSizeMultiplier={1.3}
                  >
                    {text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <FieldLabel>금액</FieldLabel>
          <AmountRow
            amountText={amountText}
            onAmountText={setAmountText}
            currency={currency}
            onCurrency={setCurrency}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <FieldLabel>결제 주기</FieldLabel>
          <CycleSegment value={cycle} onChange={setCycle} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <FieldLabel>다음 결제일</FieldLabel>
          <DateField value={date} onChange={setDate} />
        </View>

        <Pressable
          onPress={submit}
          style={{
            height: 52,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.body.fontSize,
              fontWeight: '700',
              color: theme.colors.brand.onPrimary,
            }}
            maxFontSizeMultiplier={1.3}
          >
            추가하기
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
