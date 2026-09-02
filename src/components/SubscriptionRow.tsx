import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { initialForSubscription } from '../data/catalog';
import { toBuiltinCategory } from '../domain/categoryStats';
import { daysUntil } from '../domain/date';
import { formatKrw, formatUsd, toBaseAmount } from '../domain/money';
import type { Subscription } from '../domain/types';
import { useTheme } from '../theme/ThemeProvider';
import { getCategoryChipColors } from '../theme/tokens';
import { AppText } from './AppText';
import { ServiceChip } from './ServiceChip';

export interface SubscriptionRowProps {
  sub: Subscription;
  /** 같은 카테고리 내 명도 단계 */
  shade: 1 | 2 | 3;
  usdRate: number;
  /** line2 우측에 D-day 대신 표시할 텍스트 (해지함의 '해지됨' 등) */
  statusText?: string;
}

function formatDday(days: number): string {
  return days <= 0 ? 'D-Day' : `D-${days}`;
}

/**
 * 구독 1행 (Figma 구독행 컴포넌트): 칩(40) + 금액 + "서비스명 · D-N".
 * KRW는 2줄, USD는 "$20" 아래 "≈28,000원" 환산 줄이 끼어 3줄. D-3 이하는 warning. 탭 → 상세.
 */
export function SubscriptionRow({ sub, shade, usdRate, statusText }: SubscriptionRowProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const chip = getCategoryChipColors(theme, toBuiltinCategory(sub.category), shade);
  const dday = daysUntil(sub.nextBillingAt);
  const urgent = statusText === undefined && dday <= 3;
  const isUsd = sub.currency === 'USD';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/subscription/${sub.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <ServiceChip
        initial={initialForSubscription(sub)}
        color={chip.bg}
        textColor={chip.text}
        size={40}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="body" style={{ fontWeight: '700' }}>
          {isUsd ? formatUsd(sub.amount) : formatKrw(sub.amount)}
        </AppText>
        {isUsd && (
          <AppText variant="micro" color="tertiary">
            ≈{formatKrw(toBaseAmount(sub, usdRate))}
          </AppText>
        )}
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <AppText variant="caption" color="secondary" numberOfLines={1} style={{ flexShrink: 1 }}>
            {sub.name} ·
          </AppText>
          <AppText variant="caption" color={urgent ? 'warning' : 'secondary'}>
            {statusText ?? formatDday(dday)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
