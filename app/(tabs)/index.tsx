import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AdBanner } from '../../src/components/AdBanner';
import { CategoryCard } from '../../src/components/home/CategoryCard';
import { EmptyHome } from '../../src/components/home/EmptyHome';
import { TotalCard } from '../../src/components/home/TotalCard';
import { UpcomingCard, type UpcomingSort } from '../../src/components/home/UpcomingCard';
import { Fab } from '../../src/components/Fab';
import { Screen } from '../../src/components/Screen';
import { aggregateByCategory, type CategorySegment } from '../../src/domain/categoryStats';
import { toBaseAmount } from '../../src/domain/money';
import type { Subscription } from '../../src/domain/types';
import { getDb } from '../../src/db/database';
import type { SqlDb } from '../../src/db/adapter';
import { getUsdRate } from '../../src/repos/settingsRepo';
import {
  getMonthlyTotal,
  getUpcoming,
  getYearlyTotal,
  listSubscriptions,
} from '../../src/repos/subscriptionRepo';

const UPCOMING_WINDOW_DAYS = 90;
const UPCOMING_LIMIT = 5;

interface HomeData {
  monthlyTotal: number;
  yearlyTotal: number;
  activeCount: number;
  /** next_billing_at 오름차순 상위 5건 */
  upcoming: Subscription[];
  segments: CategorySegment[];
  usdRate: number;
}

function loadHomeData(db: SqlDb): HomeData {
  const active = listSubscriptions(db, { status: 'ACTIVE' });
  const usdRate = getUsdRate(db);
  return {
    monthlyTotal: getMonthlyTotal(db),
    yearlyTotal: getYearlyTotal(db),
    activeCount: active.length,
    upcoming: getUpcoming(db, UPCOMING_WINDOW_DAYS).slice(0, UPCOMING_LIMIT),
    segments: aggregateByCategory(active, usdRate),
    usdRate,
  };
}

export default function HomeScreen() {
  const db = useMemo(() => getDb(), []);
  // 쿼리가 전부 동기라 최초 렌더에서 바로 채운다 (로딩 깜빡임 없음)
  const [data, setData] = useState<HomeData>(() => loadHomeData(db));
  const [sort, setSort] = useState<UpcomingSort>('dday');

  // 등록/수정/해지 후 홈으로 돌아왔을 때 반영
  useFocusEffect(
    useCallback(() => {
      setData(loadHomeData(db));
    }, [db]),
  );

  const sortedUpcoming = useMemo(() => {
    if (sort === 'dday') return data.upcoming;
    return [...data.upcoming].sort(
      (a, b) => toBaseAmount(b, data.usdRate) - toBaseAmount(a, data.usdRate),
    );
  }, [data, sort]);

  const isEmpty = data.activeCount === 0;

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        {isEmpty ? (
          <EmptyHome />
        ) : (
          <>
            <TotalCard
              monthlyTotal={data.monthlyTotal}
              yearlyTotal={data.yearlyTotal}
              count={data.activeCount}
            />
            {sortedUpcoming.length > 0 && (
              <UpcomingCard
                subs={sortedUpcoming}
                usdRate={data.usdRate}
                sort={sort}
                onSortChange={setSort}
              />
            )}
            <CategoryCard segments={data.segments} />
          </>
        )}
        <AdBanner />
      </Screen>
      <Fab />
    </View>
  );
}
