import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { toBuiltinCategory } from '../../domain/categoryStats';
import type { Subscription } from '../../domain/types';
import { computeRowShades } from '../../theme/rowShades';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';
import { Card } from '../Card';
import { SubscriptionRow } from '../SubscriptionRow';

export type UpcomingSort = 'dday' | 'amount';

export interface UpcomingCardProps {
  /** 표시 순서대로 정렬된 구독 목록 */
  subs: Subscription[];
  usdRate: number;
  /** hide_amounts 설정 */
  hidden: boolean;
  sort: UpcomingSort;
  onSortChange: (sort: UpcomingSort) => void;
}

/** 다가오는 결제 통합 카드 (Figma 구독리스트카드): 구독행 + 정렬 필터 바 */
export function UpcomingCard({ subs, usdRate, hidden, sort, onSortChange }: UpcomingCardProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const shades = computeRowShades(subs.map((s) => toBuiltinCategory(s.category)));

  const sortLabel = (mode: UpcomingSort, label: string) => {
    const active = sort === mode;
    return (
      <Pressable onPress={() => onSortChange(mode)} hitSlop={8}>
        <AppText
          variant="caption"
          color={active ? 'brand' : 'tertiary'}
          style={active && { fontWeight: '600' }}
        >
          {label}
        </AppText>
      </Pressable>
    );
  };

  return (
    <Card>
      <View style={{ gap: theme.card.padding }}>
        <View style={{ gap: theme.spacing.lg }}>
          {subs.map((sub, i) => (
            <SubscriptionRow
              key={sub.id}
              sub={sub}
              shade={shades[i]}
              usdRate={usdRate}
              hidden={hidden}
            />
          ))}
        </View>
        <View>
          <View style={{ height: 1, backgroundColor: theme.colors.border.subtle }} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: theme.spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              {sortLabel('dday', 'D-순')}
              <View style={{ width: 1, height: 12, backgroundColor: theme.colors.border.subtle }} />
              {sortLabel('amount', '금액순')}
            </View>
            <Pressable onPress={() => router.navigate('/list')} hitSlop={8}>
              <AppText variant="caption" color="secondary">
                {'모두보기 >'}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Card>
  );
}
