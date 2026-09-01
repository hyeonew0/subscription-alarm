import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/**
 * 구독 추가 FAB. 홈·목록 화면에서만 렌더한다 (통계·설정 없음).
 * 탭바 밖 화면 영역의 우하단 16 = 탭바 위 16.
 */
export function Fab() {
  const { theme } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="구독 추가"
      onPress={() => router.push('/add')}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: theme.colors.brand.primary,
          borderRadius: theme.radius.full,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Feather name="plus" size={24} color={theme.colors.brand.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
});
