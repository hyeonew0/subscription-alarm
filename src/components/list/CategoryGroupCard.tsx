import React from 'react';
import { View } from 'react-native';
import { CATEGORY_LABELS_KO, type CategoryGroup } from '../../domain/categoryStats';
import { formatKrw } from '../../domain/money';
import type { Subscription } from '../../domain/types';
import { distributeShades } from '../../theme/rowShades';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';
import { Card } from '../Card';
import { SubscriptionRow } from '../SubscriptionRow';

export interface CategoryGroupCardProps {
  group: CategoryGroup<Subscription>;
  usdRate: number;
  /** hide_amounts 설정 */
  hidden: boolean;
}

/** 카테고리별 구독 카드 (Figma 02_목록 card-<카테고리>): 헤더(소계·개수) + 구분선 + 구독행 */
export function CategoryGroupCard({ group, usdRate, hidden }: CategoryGroupCardProps) {
  const { theme } = useTheme();
  const shades = distributeShades(group.items.length);
  return (
    <Card>
      <View style={{ gap: theme.card.gap }}>
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <AppText variant="heading" style={{ fontWeight: '700' }}>
              {CATEGORY_LABELS_KO[group.category]}
            </AppText>
            <AppText variant="caption" color="tertiary">
              <AppText variant="caption" color="secondary" style={{ fontWeight: '600' }}>
                {formatKrw(group.monthlyAmount, hidden)}
              </AppText>
              {` · ${group.items.length}개`}
            </AppText>
          </View>
          <View style={{ height: 1, backgroundColor: theme.colors.border.subtle }} />
        </View>
        <View style={{ gap: theme.spacing.lg }}>
          {group.items.map((sub, i) => (
            <SubscriptionRow
              key={sub.id}
              sub={sub}
              shade={shades[i]}
              usdRate={usdRate}
              hidden={hidden}
            />
          ))}
        </View>
      </View>
    </Card>
  );
}
