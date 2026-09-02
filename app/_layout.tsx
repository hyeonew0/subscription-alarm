import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { AppState, Platform } from 'react-native';
import { initializeAds } from '../src/ads/mobileAds';
import { getDb } from '../src/db/database';
import { maybeRescheduleAll } from '../src/notifications/autoReschedule';
import { registerBackgroundReschedule } from '../src/notifications/backgroundReschedule';
import { createExpoNotificationDriver } from '../src/notifications/expoDriver';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';

// 포그라운드에서도 알림 배너 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function routeFromNotification(
  router: ReturnType<typeof useRouter>,
  response: Notifications.NotificationResponse | null,
) {
  const id = response?.notification.request.content.data?.subscriptionId;
  if (typeof id === 'string') router.push(`/subscription/${id}`);
}

export default function RootLayout() {
  // getDb()가 마이그레이션 + 시드까지 수행
  const db = useMemo(() => getDb(), []);
  const driver = useMemo(() => createExpoNotificationDriver(), []);
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: '결제 알림',
        importance: Notifications.AndroidImportance.HIGH,
      }).catch(() => {});
    }

    // 포그라운드 진입 시 자동 재예약 (재부팅 복구, 1시간 스로틀)
    maybeRescheduleAll(db, driver).catch(() => {});
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') maybeRescheduleAll(db, driver).catch(() => {});
    });

    // AdMob SDK 초기화 (네이티브 모듈 없는 빌드면 no-op)
    initializeAds().catch(() => {});

    // 일 1회 백그라운드 재예약 태스크
    registerBackgroundReschedule().catch(() => {});

    // 알림 탭 → 해당 구독 상세로 이동 (콜드 스타트 + 실행 중 모두)
    Notifications.getLastNotificationResponseAsync()
      .then((resp) => routeFromNotification(router, resp))
      .catch(() => {});
    const notifSub = Notifications.addNotificationResponseReceivedListener((resp) =>
      routeFromNotification(router, resp),
    );

    return () => {
      appState.remove();
      notifSub.remove();
    };
  }, [db, driver, router]);

  return (
    <ThemeProvider db={db}>
      <RootStack />
    </ThemeProvider>
  );
}

function RootStack() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add/index" options={{ presentation: 'modal' }} />
      <Stack.Screen name="subscription/[id]" />
      <Stack.Screen name="subscription/[id]/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="debug" />
    </Stack>
  );
}
