import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDb } from './src/db/database';
import { maybeRescheduleAll } from './src/notifications/autoReschedule';
import {
  getBackgroundTaskStatus,
  registerBackgroundReschedule,
  triggerBackgroundTaskForTesting,
} from './src/notifications/backgroundReschedule';
import {
  getBatteryOptimizationStatus,
  openBatteryOptimizationSettings,
} from './src/notifications/battery';
import { getBackgroundTaskLastRunAt } from './src/repos/settingsRepo';
import { createExpoNotificationDriver } from './src/notifications/expoDriver';
import {
  getPermissionState,
  requestNotificationPermission,
  rescheduleAll,
} from './src/notifications/scheduler';

// 포그라운드에서도 알림 배너가 보이게 (검증용)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * 알림 실기기 검증용 임시 화면.
 * scheduler.ts / expoDriver.ts가 실기기에서 동작하는지 확인하는 용도로,
 * 정식 UI가 생기면 삭제한다. 검증 절차는 docs/notification-testing.md 참고.
 */
export default function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const db = useMemo(() => getDb(), []);
  const driver = useMemo(() => createExpoNotificationDriver(), []);

  const log = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    setLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: '결제 알림',
        importance: Notifications.AndroidImportance.HIGH,
      }).catch((e) => log(`채널 생성 실패: ${String(e)}`));
    }
    getPermissionState(driver).then((s) => log(`현재 권한: ${s}`));

    // 포그라운드 진입 시 자동 재예약 (재부팅 복구 — 1시간 스로틀)
    const runRecovery = () => {
      maybeRescheduleAll(db, driver)
        .then((ran) => {
          if (ran) log('자동 재예약 실행됨 (재부팅 복구 경로)');
        })
        .catch((e) => log(`자동 재예약 실패: ${String(e)}`));
    };
    runRecovery();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runRecovery();
    });

    // 일 1회 백그라운드 재예약 태스크 등록
    registerBackgroundReschedule()
      .then(async () => {
        const status = await getBackgroundTaskStatus();
        const lastRun = getBackgroundTaskLastRunAt(db);
        log(`BG 태스크 등록됨 (status=${status}, 마지막 실행: ${lastRun ?? '없음'})`);
      })
      .catch((e) => log(`BG 태스크 등록 실패: ${String(e)}`));

    return () => sub.remove();
  }, [db, driver, log]);

  const run = useCallback(
    (label: string, fn: () => Promise<string>) => async () => {
      try {
        log(`${label} 실행…`);
        log(await fn());
      } catch (e) {
        log(`${label} 실패: ${String(e)}`);
      }
    },
    [log],
  );

  const onRequestPermission = run('권한 요청', async () => {
    const state = await requestNotificationPermission(db, driver);
    return `권한 결과: ${state}`;
  });

  const onTestIn10s = run('10초 뒤 알림', async () => {
    const id = await driver.scheduleAsync({
      title: '구독알리미 테스트',
      body: '10초 뒤 알림이 정상 발송되었습니다',
      triggerDate: new Date(Date.now() + 10_000),
    });
    return `예약됨 (id=${id}) — 앱을 종료하고 기다려 보세요`;
  });

  const onTestIn10m = run('10분 뒤 알림', async () => {
    const at = new Date(Date.now() + 10 * 60_000);
    const id = await driver.scheduleAsync({
      title: '구독알리미 10분 테스트',
      body: `${at.toLocaleTimeString('ko-KR', { hour12: false })} 발화 예정이던 알림입니다`,
      triggerDate: at,
    });
    return `예약됨 (id=${id}, ${at.toLocaleTimeString('ko-KR', { hour12: false })}) — 앱 종료/배터리 상태별로 수신 확인`;
  });

  const onScheduleSeed = run('시드 5건 예약', async () => {
    await rescheduleAll(db, driver);
    const rows = db.getAllSync<{ fire_at: string; kind: string }>(
      'SELECT fire_at, kind FROM notification_map ORDER BY fire_at ASC',
    );
    const preview = rows.slice(0, 5).map((r) => `${r.fire_at}(${r.kind})`).join('\n  ');
    return `예약 ${rows.length}건:\n  ${preview}`;
  });

  // 설정 화면 "배터리 최적화" 행의 탭 동작과 동일: 언제든 상태 재확인 + 설정 이동
  const onBattery = run('배터리 상태', async () => {
    const status = await getBatteryOptimizationStatus();
    const label =
      status === 'unrestricted'
        ? '제한 없음(예외 등록됨)'
        : status === 'optimized'
          ? '최적화 적용 중(제한 여부 구분 불가)'
          : '해당 없음(iOS)';
    if (status !== 'not-applicable') await openBatteryOptimizationSettings();
    return `상태: ${label}${status !== 'not-applicable' ? ' — 설정 화면을 열었습니다' : ''}`;
  });

  const onBgTask = run('BG 작업 테스트', async () => {
    const before = getBackgroundTaskLastRunAt(db);
    await triggerBackgroundTaskForTesting();
    // 워커는 비동기로 돌므로 잠시 후 이력 확인
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const after = getBackgroundTaskLastRunAt(db);
    return `강제 실행 요청됨 — 마지막 실행: ${before ?? '없음'} → ${after ?? '없음(아직 미반영, 잠시 후 재확인)'}`;
  });

  const onListScheduled = run('예약 목록 조회', async () => {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    if (all.length === 0) return 'OS에 예약된 알림 없음';
    const lines = all.map((n) => {
      const trig = n.trigger as { value?: number; date?: number | Date } | null;
      const raw = trig?.value ?? trig?.date;
      const at = raw != null ? new Date(raw).toLocaleString('ko-KR', { hour12: false }) : '시각 불명';
      return `${at} — ${n.content.title ?? '(제목 없음)'}`;
    });
    return `OS 예약 ${all.length}건:\n  ${lines.join('\n  ')}`;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>알림 검증 (임시 화면)</Text>
      <View style={styles.buttons}>
        <Btn label="권한 요청" onPress={onRequestPermission} />
        <Btn label="10초 뒤 알림" onPress={onTestIn10s} />
        <Btn label="10분 뒤 알림" onPress={onTestIn10m} />
        <Btn label="시드 5건 예약" onPress={onScheduleSeed} />
        <Btn label="예약 목록 조회" onPress={onListScheduled} />
        <Btn label="배터리 상태" onPress={onBattery} />
        <Btn label="BG 작업 테스트" onPress={onBgTask} />
      </View>
      <ScrollView style={styles.logArea}>
        {logs.map((line, i) => (
          <Text key={`${i}-${line.slice(0, 12)}`} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.btn} onPress={onPress}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 60, paddingHorizontal: 16 },
  title: { fontSize: 19, fontWeight: '700', marginBottom: 16 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  btn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnText: { color: '#FFFFFF', fontWeight: '600' },
  logArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  logLine: { fontSize: 12, color: '#4A5462', marginBottom: 6, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) },
});
