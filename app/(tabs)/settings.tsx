import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Linking, Platform, View } from 'react-native';
import { AdBanner } from '../../src/components/AdBanner';
import { AppText } from '../../src/components/AppText';
import { Card } from '../../src/components/Card';
import { OptionSheet } from '../../src/components/form/OptionSheet';
import { OffsetsSheet } from '../../src/components/settings/OffsetsSheet';
import { RateSheet } from '../../src/components/settings/RateSheet';
import { SettingRow } from '../../src/components/settings/SettingRow';
import { Screen } from '../../src/components/Screen';
import { formatKoreanTime } from '../../src/domain/date';
import { formatKrw } from '../../src/domain/money';
import { formatOffsets } from '../../src/domain/offsets';
import { getDb } from '../../src/db/database';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '../../src/lib/links';
import { showToast } from '../../src/lib/toast';
import {
  getBatteryOptimizationStatus,
  openBatteryOptimizationSettings,
  type BatteryOptimizationStatus,
} from '../../src/notifications/battery';
import type { PermissionState } from '../../src/notifications/driver';
import { createExpoNotificationDriver } from '../../src/notifications/expoDriver';
import {
  getPermissionState,
  requestNotificationPermission,
  rescheduleAll,
} from '../../src/notifications/scheduler';
import {
  getDefaultNotifyOffsets,
  getNotifyTime,
  getUsdRate,
  setSetting,
  type NotifyTime,
} from '../../src/repos/settingsRepo';
import { listSubscriptions } from '../../src/repos/subscriptionRepo';
import { useTheme } from '../../src/theme/ThemeProvider';
import type { ThemeMode } from '../../src/theme/tokens';

const THEME_LABELS: Record<ThemeMode, string> = {
  system: '시스템 설정',
  light: '라이트',
  dark: '다크',
};

/** 설정 카드: heading + 구분선 + 행 (04_설정 목업, 행 간격 20) */
function SettingsCard({ title, footer, children }: {
  title: string;
  footer?: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <Card>
      <View style={{ gap: theme.card.gap }}>
        <View style={{ gap: theme.spacing.md }}>
          <AppText variant="heading">{title}</AppText>
          <View style={{ height: 1, backgroundColor: theme.colors.border.subtle }} />
        </View>
        <View style={{ gap: 20 }}>{children}</View>
        {footer !== undefined && (
          <AppText variant="micro" color="tertiary">
            {footer}
          </AppText>
        )}
      </View>
    </Card>
  );
}

interface SettingsState {
  offsets: number[];
  time: NotifyTime;
  usdRate: number;
  cancelledCount: number;
}

export default function SettingsScreen() {
  const { mode, setMode } = useTheme();
  const router = useRouter();
  const db = useMemo(() => getDb(), []);
  const driver = useMemo(() => createExpoNotificationDriver(), []);

  const load = useCallback(
    (): SettingsState => ({
      offsets: getDefaultNotifyOffsets(db),
      time: getNotifyTime(db),
      usdRate: getUsdRate(db),
      cancelledCount: listSubscriptions(db, { status: 'CANCELLED' }).length,
    }),
    [db],
  );
  const [state, setState] = useState<SettingsState>(load);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [battery, setBattery] = useState<BatteryOptimizationStatus | null>(null);

  const [offsetsSheet, setOffsetsSheet] = useState(false);
  const [timePicker, setTimePicker] = useState(false);
  const [themeSheet, setThemeSheet] = useState(false);
  const [rateSheet, setRateSheet] = useState(false);

  const refreshStatuses = useCallback(() => {
    getPermissionState(driver).then(setPermission).catch(() => setPermission(null));
    getBatteryOptimizationStatus().then(setBattery).catch(() => setBattery(null));
  }, [driver]);

  useFocusEffect(
    useCallback(() => {
      setState(load());
      refreshStatuses();
    }, [load, refreshStatuses]),
  );

  // OS 설정(권한·배터리)에서 돌아왔을 때 상태 재확인
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refreshStatuses();
    });
    return () => sub.remove();
  }, [refreshStatuses]);

  const saveOffsets = async (offsets: number[]) => {
    setSetting(db, 'default_notify_offsets', JSON.stringify(offsets));
    setState((s) => ({ ...s, offsets }));
    await rescheduleAll(db, driver);
    showToast('알림 시점을 저장했어요');
  };

  const saveTime = async (hour: number, minute: number) => {
    setSetting(db, 'notify_time', `${hour}:${String(minute).padStart(2, '0')}`);
    setState((s) => ({ ...s, time: { hour, minute } }));
    await rescheduleAll(db, driver);
    showToast('알림 시각을 저장했어요');
  };

  const saveRate = (rate: number) => {
    setSetting(db, 'usd_rate', String(rate));
    setSetting(db, 'usd_rate_updated_at', new Date().toISOString());
    setState((s) => ({ ...s, usdRate: rate }));
    showToast('환율을 저장했어요');
  };

  const onPermissionPress = async () => {
    if (permission === 'denied') {
      await Linking.openSettings();
    } else if (permission === 'undetermined') {
      const next = await requestNotificationPermission(db, driver);
      setPermission(next);
    }
  };

  const permissionRow: { value: string; color: 'success' | 'danger' | 'warning'; pressable: boolean } =
    permission === 'granted'
      ? { value: '허용됨', color: 'success', pressable: false }
      : permission === 'denied'
        ? { value: '거부됨', color: 'danger', pressable: true }
        : { value: '설정 필요', color: 'warning', pressable: true };

  const version = Constants.expoConfig?.version ?? '?';

  return (
    <Screen>
      <AppText variant="title">설정</AppText>

      <SettingsCard title="알림">
        <SettingRow
          label="알림 시점"
          value={formatOffsets(state.offsets)}
          chevron
          onPress={() => setOffsetsSheet(true)}
        />
        <SettingRow
          label="알림 시각"
          value={formatKoreanTime(state.time.hour, state.time.minute)}
          chevron
          onPress={() => setTimePicker(true)}
        />
        <SettingRow
          label="알림 권한"
          value={permissionRow.value}
          valueColor={permissionRow.color}
          onPress={permissionRow.pressable ? onPermissionPress : undefined}
        />
        {Platform.OS === 'android' && (
          <SettingRow
            label="배터리 최적화"
            value={battery === 'unrestricted' ? '정상' : '확인 필요'}
            valueColor={battery === 'unrestricted' ? 'success' : 'warning'}
            chevron
            onPress={() => openBatteryOptimizationSettings()}
          />
        )}
      </SettingsCard>

      <SettingsCard title="표시" footer="글꼴 크기는 기기 설정을 따릅니다">
        <SettingRow
          label="테마"
          value={THEME_LABELS[mode]}
          chevron
          onPress={() => setThemeSheet(true)}
        />
        <SettingRow
          label="환율 (USD)"
          value={formatKrw(state.usdRate)}
          chevron
          onPress={() => setRateSheet(true)}
        />
      </SettingsCard>

      <SettingsCard title="데이터">
        <SettingRow
          label="해지함"
          value={`${state.cancelledCount}개`}
          chevron
          onPress={() =>
            router.navigate({ pathname: '/list', params: { expandCancelled: '1' } })
          }
        />
        <SettingRow
          label="데이터 내보내기"
          chevron
          // TODO: expo-file-system + expo-sharing으로 JSON 내보내기 (네이티브 모듈 추가라 dev client 재빌드 필요)
          onPress={() => showToast('데이터 내보내기는 준비 중이에요')}
        />
      </SettingsCard>

      <SettingsCard title="정보">
        <SettingRow label="버전" value={version} />
        <SettingRow
          label="오픈소스 라이선스"
          chevron
          // TODO: 라이선스 목록 화면
          onPress={() => showToast('라이선스 목록은 준비 중이에요')}
        />
        <SettingRow
          label="개인정보처리방침"
          chevron
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
        />
        <SettingRow
          label="문의하기"
          chevron
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
        {__DEV__ && (
          <SettingRow label="개발자 도구" chevron onPress={() => router.push('/debug')} />
        )}
      </SettingsCard>

      <AdBanner />

      <OffsetsSheet
        visible={offsetsSheet}
        initial={state.offsets}
        onSave={saveOffsets}
        onClose={() => setOffsetsSheet(false)}
      />
      {timePicker && (
        <DateTimePicker
          value={new Date(2000, 0, 1, state.time.hour, state.time.minute)}
          mode="time"
          onChange={(_event, selected) => {
            setTimePicker(false);
            if (selected) saveTime(selected.getHours(), selected.getMinutes());
          }}
        />
      )}
      <OptionSheet
        visible={themeSheet}
        title="테마"
        options={(['system', 'light', 'dark'] as const).map((m) => ({
          value: m,
          label: THEME_LABELS[m],
        }))}
        selected={mode}
        onSelect={setMode}
        onClose={() => setThemeSheet(false)}
      />
      <RateSheet
        visible={rateSheet}
        initial={state.usdRate}
        onSave={saveRate}
        onClose={() => setRateSheet(false)}
      />
    </Screen>
  );
}
