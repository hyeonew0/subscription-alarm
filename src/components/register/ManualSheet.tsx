import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { fromLocalDate, formatYMD, type YMD } from '../../domain/date';
import { parseAmountInput } from '../../domain/money';
import type { Currency, Cycle } from '../../domain/types';
import { showToast } from '../../lib/toast';
import type { CreateSubscriptionInput } from '../../repos/subscriptionRepo';
import { useTheme } from '../../theme/ThemeProvider';
import { BottomSheet } from '../BottomSheet';
import { CurrencyToggle } from '../CurrencyToggle';
import { CycleSegment } from '../CycleSegment';
import { DateField } from '../DateField';

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

  const caption = theme.typography.caption;
  const body = theme.typography.body;
  const inputStyle = {
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.canvas,
    paddingHorizontal: theme.spacing.lg,
    fontSize: body.fontSize,
    color: theme.colors.text.primary,
  } as const;
  const label = (text: string) => (
    <Text
      style={{ fontSize: caption.fontSize, color: theme.colors.text.secondary, marginBottom: 8 }}
      maxFontSizeMultiplier={1.3}
    >
      {text}
    </Text>
  );

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
        <View>
          {label('서비스명')}
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="예: 넷플릭스"
            placeholderTextColor={theme.colors.text.tertiary}
            maxFontSizeMultiplier={1.3}
          />
        </View>

        <View>
          {label('카테고리')}
          <View style={{ flexDirection: 'row', gap: 8 }}>
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
                      fontSize: caption.fontSize,
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

        <View>
          {label('금액')}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              value={amountText}
              onChangeText={setAmountText}
              placeholder={currency === 'KRW' ? '13,500' : '20.00'}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="decimal-pad"
              maxFontSizeMultiplier={1.3}
            />
            <CurrencyToggle value={currency} onChange={setCurrency} />
          </View>
        </View>

        <View>
          {label('결제 주기')}
          <CycleSegment value={cycle} onChange={setCycle} />
        </View>

        <View>
          {label('다음 결제일')}
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
            style={{ fontSize: body.fontSize, fontWeight: '700', color: theme.colors.brand.onPrimary }}
            maxFontSizeMultiplier={1.3}
          >
            추가하기
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
