import React from 'react';
import { View } from 'react-native';
import { intensityLevel, type DayBucket } from '../../domain/billingDayStats';
import { formatKrw } from '../../domain/money';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';

/** 강도 단계별 brand.primary 오버레이 투명도 (0단계는 틴트 없음) */
const LEVEL_OPACITY: Record<1 | 2 | 3, number> = { 1: 0.15, 2: 0.4, 3: 0.8 };
/** 범례는 그라데이션 4칩 (목업: 15/40/60/80%) */
const LEGEND_OPACITIES = [0.15, 0.4, 0.6, 0.8];

const CELL_W = 40;
const CELL_H = 32;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export interface BillingHeatmapProps {
  buckets: DayBucket[];
  peak: DayBucket | null;
  /** hide_amounts 설정 (요약 금액 마스킹) */
  hidden: boolean;
}

/** 결제일 분포 달력 히트맵 (05_통계): 7열 1~31일 + 요약 + 범례 */
export function BillingHeatmap({ buckets, peak, hidden }: BillingHeatmapProps) {
  const { theme } = useTheme();
  const byDay = new Map(buckets.map((b) => [b.day, b]));
  // 마지막 행을 7칸으로 채우기 위한 빈 셀 (32~35)
  const cells = Array.from({ length: 35 }, (_, i) => i + 1);

  const summary =
    peak &&
    `${peak.names.slice(0, 2).join(', ')}${peak.count > 2 ? ' 등' : ''} ${peak.count}건 · ${formatKrw(peak.amount, hidden)}`;

  return (
    <View style={{ gap: theme.card.gap }}>
      <View style={{ gap: theme.spacing.xs }}>
        {chunk(cells, 7).map((row, rowIdx) => (
          <View key={`row-${rowIdx}`} style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
            {row.map((day) => {
              if (day > 31) {
                return (
                  <View
                    key={day}
                    style={{
                      width: CELL_W,
                      height: CELL_H,
                      borderRadius: theme.radius.sm,
                      backgroundColor: theme.colors.bg.canvas,
                    }}
                  />
                );
              }
              const level = intensityLevel(byDay.get(day)?.amount ?? 0, buckets);
              const tintOpacity = level === 0 ? 0 : LEVEL_OPACITY[level];
              return (
                <View
                  key={day}
                  style={{
                    width: CELL_W,
                    height: CELL_H,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.bg.canvas,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {level > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: theme.radius.sm,
                        backgroundColor: theme.colors.brand.primary,
                        opacity: tintOpacity,
                      }}
                    />
                  )}
                  <AppText
                    variant="micro"
                    color={level === 3 ? 'inverse' : level > 0 ? 'secondary' : 'tertiary'}
                  >
                    {day}
                  </AppText>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {peak && (
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="body" style={{ fontWeight: '600' }}>
            {peak.day}일에 가장 많이 나가요
          </AppText>
          <AppText variant="caption" color="secondary">
            {summary}
          </AppText>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <AppText variant="micro" color="tertiary">
          적음
        </AppText>
        {LEGEND_OPACITIES.map((opacity) => (
          <View
            key={opacity}
            style={{
              width: 16,
              height: 8,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.bg.canvas,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: theme.colors.brand.primary,
                opacity,
              }}
            />
          </View>
        ))}
        <AppText variant="micro" color="tertiary">
          많음
        </AppText>
      </View>
    </View>
  );
}
