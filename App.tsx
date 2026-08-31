import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDb } from './src/db/database';
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
    // eslint 없음 — 최초 1회만
  }, [driver, log]);

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

  const onScheduleSeed = run('시드 5건 예약', async () => {
    await rescheduleAll(db, driver);
    const rows = db.getAllSync<{ fire_at: string; kind: string }>(
      'SELECT fire_at, kind FROM notification_map ORDER BY fire_at ASC',
    );
    const preview = rows.slice(0, 5).map((r) => `${r.fire_at}(${r.kind})`).join('\n  ');
    return `예약 ${rows.length}건:\n  ${preview}`;
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
        <Btn label="시드 5건 예약" onPress={onScheduleSeed} />
        <Btn label="예약 목록 조회" onPress={onListScheduled} />
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
