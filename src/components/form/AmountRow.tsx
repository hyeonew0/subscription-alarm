import React from 'react';
import { View } from 'react-native';
import type { Currency } from '../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';
import { CurrencyToggle } from '../CurrencyToggle';
import { FormTextInput } from './FormField';

/** 금액 입력 + KRW/USD 토글 행 (08_수정폼 목업 규격) */
export function AmountRow({
  amountText,
  onAmountText,
  currency,
  onCurrency,
}: {
  amountText: string;
  onAmountText: (text: string) => void;
  currency: Currency;
  onCurrency: (next: Currency) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      <FormTextInput
        style={{ flex: 1 }}
        value={amountText}
        onChangeText={onAmountText}
        placeholder={currency === 'KRW' ? '13,500' : '20.00'}
        keyboardType="decimal-pad"
      />
      <CurrencyToggle value={currency} onChange={onCurrency} />
    </View>
  );
}
