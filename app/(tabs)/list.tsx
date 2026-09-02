import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from '../../src/components/AppText';
import { Fab } from '../../src/components/Fab';
import { AdCard } from '../../src/components/home/AdCard';
import { CancelledCard } from '../../src/components/list/CancelledCard';
import { CategoryGroupCard } from '../../src/components/list/CategoryGroupCard';
import { EmptyList } from '../../src/components/list/EmptyList';
import { SortSheet } from '../../src/components/list/SortSheet';
import { Screen } from '../../src/components/Screen';
import {
  CATEGORY_LABELS_KO,
  groupByCategory,
  type BuiltinCategory,
  type CategoryGroup,
} from '../../src/domain/categoryStats';
import { LIST_SORT_LABELS, sortForList, type ListSort } from '../../src/domain/listSort';
import type { Subscription } from '../../src/domain/types';
import { getDb } from '../../src/db/database';
import type { SqlDb } from '../../src/db/adapter';
import { getUsdRate } from '../../src/repos/settingsRepo';
import { listSubscriptions } from '../../src/repos/subscriptionRepo';
import { useTheme } from '../../src/theme/ThemeProvider';

interface ListData {
  /** 소계 큰 순 카테고리 그룹 */
  groups: Array<CategoryGroup<Subscription>>;
  cancelled: Subscription[];
  usdRate: number;
}

function loadListData(db: SqlDb): ListData {
  const usdRate = getUsdRate(db);
  return {
    groups: groupByCategory(listSubscriptions(db, { status: 'ACTIVE' }), usdRate),
    cancelled: listSubscriptions(db, { status: 'CANCELLED' }),
    usdRate,
  };
}

export default function ListScreen() {
  const { theme } = useTheme();
  const { expandCancelled } = useLocalSearchParams<{ expandCancelled?: string }>();
  const db = useMemo(() => getDb(), []);
  const [data, setData] = useState<ListData>(() => loadListData(db));
  const [sort, setSort] = useState<ListSort>('dday');
  const [sheetVisible, setSheetVisible] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  // 앵커 칩 → 카드 스크롤 이동용 y좌표 (콘텐츠 컨테이너 기준)
  const cardOffsets = useRef(new Map<BuiltinCategory, number>());

  useFocusEffect(
    useCallback(() => {
      setData(loadListData(db));
    }, [db]),
  );

  // 정렬은 카드 안 항목만 재정렬 — 카드 순서(소계 큰 순)는 유지
  const sortedGroups = useMemo(
    () =>
      data.groups.map((g) => ({ ...g, items: sortForList(g.items, sort, data.usdRate) })),
    [data, sort],
  );

  const scrollToCategory = (category: BuiltinCategory) => {
    const y = cardOffsets.current.get(category);
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - theme.spacing.sm), animated: true });
    }
  };

  const isEmpty = data.groups.length === 0 && data.cancelled.length === 0;

  const categoryCards = sortedGroups.map((group) => (
    <View
      key={group.category}
      onLayout={(e) => cardOffsets.current.set(group.category, e.nativeEvent.layout.y)}
    >
      <CategoryGroupCard group={group} usdRate={data.usdRate} />
    </View>
  ));
  // 광고 카드는 2번째 카테고리 카드 뒤, 카드가 2개 미만이면 카테고리 카드들 맨 뒤
  const adIndex = Math.min(2, categoryCards.length);
  categoryCards.splice(adIndex, 0, <AdCard key="ad" />);

  return (
    <View style={{ flex: 1 }}>
      <Screen scrollRef={scrollRef}>
        <View
          style={{
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <AppText variant="title">구독 목록</AppText>
          {!isEmpty && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSheetVisible(true)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.xs,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.bg.surface,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <AppText variant="caption" color="secondary">
                {LIST_SORT_LABELS[sort]}
              </AppText>
              <Feather name="chevron-down" size={12} color={theme.colors.text.secondary} />
            </Pressable>
          )}
        </View>

        {isEmpty ? (
          <EmptyList />
        ) : (
          <>
            {data.groups.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: theme.spacing.sm }}
              >
                {data.groups.map((group) => (
                  <Pressable
                    key={group.category}
                    accessibilityRole="button"
                    onPress={() => scrollToCategory(group.category)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 6,
                      paddingHorizontal: theme.spacing.md,
                      borderRadius: theme.radius.full,
                      backgroundColor: theme.colors.bg.surface,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: theme.radius.full,
                        backgroundColor: theme.colors.category[group.category].base,
                      }}
                    />
                    <AppText variant="caption" color="secondary">
                      {CATEGORY_LABELS_KO[group.category]}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            {categoryCards}
            <CancelledCard
              subs={data.cancelled}
              usdRate={data.usdRate}
              initialExpanded={expandCancelled === '1'}
            />
          </>
        )}
      </Screen>
      <Fab />
      <SortSheet
        visible={sheetVisible}
        sort={sort}
        onSelect={setSort}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}
