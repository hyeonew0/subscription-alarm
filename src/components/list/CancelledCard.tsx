import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { toBuiltinCategory } from '../../domain/categoryStats';
import type { Subscription } from '../../domain/types';
import { computeRowShades } from '../../theme/rowShades';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';
import { Card } from '../Card';
import { SubscriptionRow } from '../SubscriptionRow';

export interface CancelledCardProps {
  subs: Subscription[];
  usdRate: number;
  /** hide_amounts 설정 */
  hidden: boolean;
  /** true가 되면 펼친 상태로 (설정 → 해지함 진입용) */
  initialExpanded?: boolean;
}

/** 해지함 카드 (Figma 02_목록 card-해지함): 탭하면 CANCELLED 목록 확장/축소 */
export function CancelledCard({ subs, usdRate, hidden, initialExpanded }: CancelledCardProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(initialExpanded ?? false);
  useEffect(() => {
    // 목록 탭이 이미 마운트된 상태에서 파라미터로 진입해도 펼쳐지도록
    if (initialExpanded) setExpanded(true);
  }, [initialExpanded]);
  if (subs.length === 0) return null;
  const shades = computeRowShades(subs.map((s) => toBuiltinCategory(s.category)));

  return (
    <Card variant="tight">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((v) => !v)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <AppText variant="body" color="secondary" style={{ fontWeight: '600' }}>
          해지함 {subs.length}개
        </AppText>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.colors.text.secondary}
        />
      </Pressable>
      {expanded && (
        <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
          <View style={{ height: 1, backgroundColor: theme.colors.border.subtle }} />
          {subs.map((sub, i) => (
            <SubscriptionRow
              key={sub.id}
              sub={sub}
              shade={shades[i]}
              usdRate={usdRate}
              hidden={hidden}
              statusText="해지됨"
            />
          ))}
        </View>
      )}
    </Card>
  );
}
