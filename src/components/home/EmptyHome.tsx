import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { CATALOG, type CatalogItem } from '../../data/catalog';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';
import { Card } from '../Card';
import { ServiceChip } from '../ServiceChip';

/** 빠른 시작 그리드의 인기 8종 (Figma 01_홈_빈상태 quickGrid 순서) */
const QUICK_START_IDS = [
  'netflix',
  'coupang-wow',
  'chatgpt-plus',
  'youtube-premium',
  'melon',
  'tving',
  'naver-plus',
  'baemin-club',
];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** 구독 0개 홈 빈 상태: 안내 카드 + 빠른 시작 카드 (광고 카드는 부모가 렌더) */
export function EmptyHome() {
  const { theme } = useTheme();
  const router = useRouter();
  const items = QUICK_START_IDS.map((id) => CATALOG.find((i) => i.id === id)).filter(
    (i): i is CatalogItem => i !== undefined,
  );

  return (
    <>
      <Card>
        <View style={{ alignItems: 'center', gap: theme.spacing.lg }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: theme.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* 반투명 틴트는 별도 레이어의 노드 opacity로 (자식 아이콘 불투명 유지) */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: theme.colors.brand.primary,
                opacity: 0.1,
              }}
            />
            <Feather name="plus" size={28} color={theme.colors.brand.primary} />
          </View>
          <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
            <AppText variant="heading" style={{ fontWeight: '700' }}>
              구독을 추가해보세요
            </AppText>
            <AppText variant="caption" color="secondary" style={{ textAlign: 'center' }}>
              매달 나가는 구독료를 한눈에 보고{'\n'}결제일 전에 알림을 받을 수 있어요
            </AppText>
          </View>
          <View style={{ width: '100%', paddingTop: theme.spacing.xs }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/add')}
              style={({ pressed }) => ({
                height: 48,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <AppText variant="body" color="onBrand" style={{ fontWeight: '700' }}>
                첫 구독 추가하기
              </AppText>
            </Pressable>
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ gap: theme.spacing.lg }}>
          <View style={{ gap: theme.spacing.md }}>
            <AppText variant="heading">이런 서비스 쓰고 계신가요?</AppText>
            <View style={{ height: 1, backgroundColor: theme.colors.border.subtle }} />
          </View>
          <View style={{ gap: theme.spacing.lg }}>
            {chunk(items, 4).map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                {row.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/add', params: { preset: item.id } })}
                    style={({ pressed }) => ({
                      flex: 1,
                      alignItems: 'center',
                      gap: 6,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <ServiceChip
                      initial={item.initial}
                      color={theme.colors.category[item.category].base}
                      size={48}
                    />
                    <AppText
                      variant="micro"
                      color="secondary"
                      numberOfLines={2}
                      style={{ textAlign: 'center' }}
                    >
                      {item.name}
                    </AppText>
                  </Pressable>
                ))}
                {Array.from({ length: 4 - row.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={{ flex: 1 }} />
                ))}
              </View>
            ))}
          </View>
        </View>
      </Card>
    </>
  );
}
