import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

/**
 * 탭 화면 공통 레이아웃: bg.canvas + 세이프에어리어 + 스크롤.
 * 콘텐츠는 좌우 16 / 상단 32 / 하단 72(FAB 여유), 카드 간 간격은 gap으로 처리.
 */
export function Screen({
  children,
  scrollRef,
}: {
  children: React.ReactNode;
  /** 앵커 스크롤 이동 등 scrollTo가 필요한 화면용 */
  scrollRef?: React.Ref<ScrollView>;
}) {
  const { theme } = useTheme();
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.bg.canvas }]}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xxl,
          paddingBottom: 72,
          gap: theme.card.gap,
        }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
