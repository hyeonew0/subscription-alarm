import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { ManualSheet } from '../../src/components/register/ManualSheet';
import { PermissionDialog } from '../../src/components/register/PermissionDialog';
import { PresetSheet } from '../../src/components/register/PresetSheet';
import { ServiceChip } from '../../src/components/ServiceChip';
import { CATALOG, type CatalogCategory, type CatalogItem } from '../../src/data/catalog';
import { searchCatalog } from '../../src/data/catalogSearch';
import { showToast } from '../../src/lib/toast';
import { withSubjectParticle } from '../../src/lib/korean';
import { getDb } from '../../src/db/database';
import { createExpoNotificationDriver } from '../../src/notifications/expoDriver';
import { requestNotificationPermission, scheduleForSubscription } from '../../src/notifications/scheduler';
import {
  getNotifyPermissionAsked,
  getUsdRate,
  setNotifyPermissionAsked,
} from '../../src/repos/settingsRepo';
import { createSubscription, type CreateSubscriptionInput } from '../../src/repos/subscriptionRepo';
import { getCategoryChipColors } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/ThemeProvider';

const CATEGORY_TABS: Array<[CatalogCategory | null, string]> = [
  [null, '전체'],
  ['OTT', 'OTT'],
  ['AI', 'AI'],
  ['SHOPPING', '쇼핑'],
  ['MUSIC', '음악'],
  ['ETC', '기타'],
];

/** 카테고리별 등장 순서 기준 shade 1~3 선형 분배 (Figma 그리드 규칙) */
function computeShades(items: CatalogItem[]): Map<string, 1 | 2 | 3> {
  const byCategory = new Map<string, CatalogItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }
  const shades = new Map<string, 1 | 2 | 3>();
  for (const list of byCategory.values()) {
    list.forEach((item, i) => {
      const shade = list.length === 1 ? 1 : Math.round(1 + (2 * i) / (list.length - 1));
      shades.set(item.id, shade as 1 | 2 | 3);
    });
  }
  return shades;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function AddScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const db = useMemo(() => getDb(), []);
  const driver = useMemo(() => createExpoNotificationDriver(), []);
  const usdRate = useMemo(() => getUsdRate(db), [db]);

  const { preset } = useLocalSearchParams<{ preset?: string }>();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState<CatalogCategory | null>(null);
  // 홈 빈 상태 빠른 시작에서 preset 파라미터로 진입하면 해당 서비스 시트를 바로 연다
  const [presetItem, setPresetItem] = useState<CatalogItem | null>(
    () => CATALOG.find((i) => i.id === preset) ?? null,
  );
  const [manualVisible, setManualVisible] = useState(false);
  const [permissionFor, setPermissionFor] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    const found = searchCatalog(debounced);
    return category ? found.filter((i) => i.category === category) : found;
  }, [debounced, category]);
  const shades = useMemo(() => computeShades(results), [results]);

  const handleSubmit = async (input: CreateSubscriptionInput, displayName: string) => {
    try {
      const sub = createSubscription(db, input);
      await scheduleForSubscription(db, driver, sub);
      setPresetItem(null);
      setManualVisible(false);
      showToast(`${withSubjectParticle(displayName)} 추가됐어요`);
      if (!getNotifyPermissionAsked(db)) setPermissionFor(displayName);
    } catch (e) {
      showToast(`저장에 실패했어요: ${String(e)}`);
    }
  };

  const caption = theme.typography.caption;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.bg.canvas }}>
      {/* 헤더 */}
      <View
        style={{
          height: 56,
          paddingHorizontal: theme.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable onPress={() => router.back()} accessibilityLabel="닫기">
          <Feather name="x" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text
          style={{
            fontSize: theme.typography.title.fontSize,
            fontWeight: '700',
            color: theme.colors.text.primary,
          }}
          maxFontSizeMultiplier={1.3}
        >
          구독 추가
        </Text>
        <Pressable onPress={() => setManualVisible(true)}>
          <Text
            style={{ fontSize: caption.fontSize, color: theme.colors.brand.primary }}
            maxFontSizeMultiplier={1.3}
          >
            직접 입력
          </Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.lg }}>
        {/* 검색바 */}
        <View
          style={{
            height: 44,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.bg.surface,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 14,
            gap: 8,
          }}
        >
          <Feather name="search" size={18} color={theme.colors.text.tertiary} />
          <TextInput
            style={{ flex: 1, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }}
            value={query}
            onChangeText={setQuery}
            placeholder="서비스 검색 (초성 가능)"
            placeholderTextColor={theme.colors.text.tertiary}
            maxFontSizeMultiplier={1.3}
          />
        </View>

        {/* 카테고리 탭 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORY_TABS.map(([value, label]) => {
            const active = value === category;
            return (
              <Pressable
                key={label}
                onPress={() => setCategory(value)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: theme.radius.full,
                  backgroundColor: active ? theme.colors.brand.primary : theme.colors.bg.surface,
                }}
              >
                <Text
                  style={{
                    fontSize: caption.fontSize,
                    color: active ? theme.colors.brand.onPrimary : theme.colors.text.secondary,
                  }}
                  maxFontSizeMultiplier={1.3}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 서비스 그리드 */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: 72,
        }}
      >
        <Card>
          {results.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
              <Text
                style={{ fontSize: theme.typography.body.fontSize, color: theme.colors.text.secondary }}
                maxFontSizeMultiplier={1.3}
              >
                검색 결과가 없어요
              </Text>
              <Pressable onPress={() => setManualVisible(true)}>
                <Text
                  style={{ fontSize: caption.fontSize, fontWeight: '600', color: theme.colors.brand.primary }}
                  maxFontSizeMultiplier={1.3}
                >
                  직접 입력하기
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              {chunk(results, 4).map((row, rowIdx) => (
                <View key={`row-${rowIdx}`} style={{ flexDirection: 'row', gap: 12 }}>
                  {row.map((item) => {
                    const shade = shades.get(item.id) ?? 1;
                    const chip = getCategoryChipColors(theme, item.category, shade);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setPresetItem(item)}
                        style={{ flex: 1, alignItems: 'center', gap: 6 }}
                      >
                        <ServiceChip initial={item.initial} color={chip.bg} textColor={chip.text} size={52} />
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: theme.typography.micro.fontSize,
                            lineHeight: theme.typography.micro.lineHeight,
                            color: theme.colors.text.secondary,
                            textAlign: 'center',
                          }}
                          maxFontSizeMultiplier={1.3}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {/* 마지막 행 빈 칸 채움 */}
                  {Array.from({ length: 4 - row.length }).map((_, i) => (
                    <View key={`empty-${i}`} style={{ flex: 1 }} />
                  ))}
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>

      <PresetSheet
        item={presetItem}
        usdRate={usdRate}
        onClose={() => setPresetItem(null)}
        onSubmit={handleSubmit}
      />
      <ManualSheet
        visible={manualVisible}
        onClose={() => setManualVisible(false)}
        onSubmit={handleSubmit}
      />
      <PermissionDialog
        visible={permissionFor !== null}
        serviceName={permissionFor ?? ''}
        onAccept={() => {
          requestNotificationPermission(db, driver).finally(() => setPermissionFor(null));
        }}
        onDecline={() => {
          setNotifyPermissionAsked(db, true);
          setPermissionFor(null);
        }}
      />
    </SafeAreaView>
  );
}
