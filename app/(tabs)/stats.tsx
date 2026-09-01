import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '../../src/components/AppText';
import { Card } from '../../src/components/Card';
import { EmptyStateCard } from '../../src/components/EmptyStateCard';
import { AdCard } from '../../src/components/home/AdCard';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { BillingHeatmap } from '../../src/components/stats/BillingHeatmap';
import {
  aggregateByBillingDay,
  peakBillingDay,
  type DayBucket,
} from '../../src/domain/billingDayStats';
import {
  CATEGORY_LABELS_KO,
  groupByCategory,
  type CategoryGroup,
} from '../../src/domain/categoryStats';
import { daysUntil } from '../../src/domain/date';
import { formatKrw, toYearly } from '../../src/domain/money';
import type { Subscription } from '../../src/domain/types';
import { getDb } from '../../src/db/database';
import type { SqlDb } from '../../src/db/adapter';
import { getHideAmounts, getUsdRate } from '../../src/repos/settingsRepo';
import {
  getMonthlyTotal,
  getYearlyTotal,
  listSubscriptions,
} from '../../src/repos/subscriptionRepo';
import { useTheme } from '../../src/theme/ThemeProvider';

/** trial_end_at이 며칠 이내면 "종료 임박"으로 볼지 */
const TRIAL_SOON_DAYS = 7;

interface StatsData {
  yearlyTotal: number;
  monthlyTotal: number;
  activeCount: number;
  dayBuckets: DayBucket[];
  peak: DayBucket | null;
  groups: Array<CategoryGroup<Subscription>>;
  mostExpensive: { name: string; yearly: number } | null;
  trialEndingSoon: number;
  hidden: boolean;
}

function loadStats(db: SqlDb): StatsData {
  const active = listSubscriptions(db, { status: 'ACTIVE' });
  const usdRate = getUsdRate(db);
  const dayBuckets = aggregateByBillingDay(active, usdRate);

  let mostExpensive: StatsData['mostExpensive'] = null;
  for (const sub of active) {
    const yearly = toYearly(sub, usdRate);
    if (mostExpensive === null || yearly > mostExpensive.yearly) {
      mostExpensive = { name: sub.name, yearly };
    }
  }

  return {
    yearlyTotal: getYearlyTotal(db),
    monthlyTotal: getMonthlyTotal(db),
    activeCount: active.length,
    dayBuckets,
    peak: peakBillingDay(dayBuckets),
    groups: groupByCategory(active, usdRate),
    mostExpensive,
    trialEndingSoon: active.filter(
      (s) =>
        s.trialEndAt !== null &&
        daysUntil(s.trialEndAt) >= 0 &&
        daysUntil(s.trialEndAt) <= TRIAL_SOON_DAYS,
    ).length,
    hidden: getHideAmounts(db),
  };
}

/** 인사이트 행: label caption/secondary — value body/600 */
function InsightRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: 'warning';
}) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <AppText variant="caption" color="secondary">
        {label}
      </AppText>
      <AppText variant="body" color={valueColor ?? 'primary'} style={{ fontWeight: '600' }}>
        {value}
      </AppText>
    </View>
  );
}

export default function StatsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const db = useMemo(() => getDb(), []);
  const [data, setData] = useState<StatsData>(() => loadStats(db));

  useFocusEffect(
    useCallback(() => {
      setData(loadStats(db));
    }, [db]),
  );

  const maxCategoryAmount = data.groups[0]?.monthlyAmount ?? 0;

  if (data.activeCount === 0) {
    return (
      <Screen>
        <AppText variant="title">통계</AppText>
        <EmptyStateCard
          icon="bar-chart-2"
          title="구독을 등록하면 통계를 볼 수 있어요"
          caption={'카테고리별 지출, 결제일 분포 등을\n한눈에 확인할 수 있어요'}
          buttonLabel="구독 추가하기"
          onPress={() => router.push('/add')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">통계</AppText>

      <Card variant="tight">
        <View style={{ gap: 2 }}>
          <AppText variant="caption" color="secondary">
            연간 예상 지출
          </AppText>
          <AppText variant="display">{formatKrw(data.yearlyTotal, data.hidden)}</AppText>
          <View style={{ paddingTop: 2 }}>
            <AppText variant="caption" color="tertiary">
              월 평균 {formatKrw(data.monthlyTotal, data.hidden)}
            </AppText>
          </View>
        </View>
      </Card>

      <SectionCard title="결제일 분포">
        <BillingHeatmap buckets={data.dayBuckets} peak={data.peak} hidden={data.hidden} />
      </SectionCard>

      <SectionCard title="카테고리별">
        {data.groups.map((group) => (
          <View key={group.category} style={{ gap: 6 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: theme.radius.full,
                    backgroundColor: theme.colors.category[group.category].base,
                  }}
                />
                <AppText variant="body">{CATEGORY_LABELS_KO[group.category]}</AppText>
              </View>
              <AppText variant="caption" color="secondary">
                {formatKrw(group.monthlyAmount, data.hidden)} · {group.items.length}개
              </AppText>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.bg.canvas,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 6,
                  borderRadius: theme.radius.full,
                  width: `${Math.round((group.monthlyAmount / maxCategoryAmount) * 100)}%`,
                  backgroundColor: theme.colors.category[group.category].base,
                }}
              />
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="알아두면 좋아요">
        {data.mostExpensive && (
          <InsightRow
            label="가장 비싼 구독"
            value={`${data.mostExpensive.name} 연 ${formatKrw(data.mostExpensive.yearly, data.hidden)}`}
          />
        )}
        <InsightRow
          label="구독당 평균"
          value={`월 ${formatKrw(Math.round(data.monthlyTotal / data.activeCount), data.hidden)}`}
        />
        {data.trialEndingSoon > 0 && (
          <InsightRow
            label="무료체험 종료 임박"
            value={`${data.trialEndingSoon}건`}
            valueColor="warning"
          />
        )}
      </SectionCard>

      {/* TODO: 월별 스냅샷 테이블이 생기면 실제 그래프로 교체 — v1은 빈 상태 고정 */}
      <SectionCard title="월별 추이">
        <View style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: 32 }}>
          <Feather name="bar-chart-2" size={40} color={theme.colors.text.tertiary} />
          <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
            <AppText variant="body" color="secondary">
              다음 달부터 볼 수 있어요
            </AppText>
            <AppText variant="caption" color="tertiary">
              매달 지출 변화를 그래프로 보여드려요
            </AppText>
          </View>
        </View>
      </SectionCard>

      <AdCard />
    </Screen>
  );
}
