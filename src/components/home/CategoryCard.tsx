import React from 'react';
import { View } from 'react-native';
import { CATEGORY_LABELS_KO, type CategorySegment } from '../../domain/categoryStats';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';
import { Card } from '../Card';

/** 너무 얇은 세그먼트가 안 보이는 것을 막는 최소 폭 */
const MIN_SEGMENT_WIDTH = 24;

export interface CategoryCardProps {
  /** 금액 내림차순 세그먼트 (0원 카테고리 제외) */
  segments: CategorySegment[];
}

/** 카테고리별 가로 스택바 + 범례 카드 (Figma 01_홈 card-category) */
export function CategoryCard({ segments }: CategoryCardProps) {
  const { theme } = useTheme();
  if (segments.length === 0) return null;
  return (
    <Card>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="heading">카테고리별</AppText>
        <View style={{ gap: theme.spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              gap: 2,
              borderRadius: theme.radius.full,
              overflow: 'hidden',
            }}
          >
            {segments.map((seg) => (
              <View
                key={seg.category}
                style={{
                  height: 12,
                  flexGrow: seg.monthlyAmount,
                  flexBasis: 0,
                  minWidth: MIN_SEGMENT_WIDTH,
                  backgroundColor: theme.colors.category[seg.category].base,
                }}
              />
            ))}
          </View>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              columnGap: theme.spacing.md,
              rowGap: theme.spacing.sm,
            }}
          >
            {segments.map((seg) => (
              <View
                key={seg.category}
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: theme.radius.full,
                    backgroundColor: theme.colors.category[seg.category].base,
                  }}
                />
                <AppText variant="micro" color="secondary">
                  {CATEGORY_LABELS_KO[seg.category]} {seg.percent}%
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
}
