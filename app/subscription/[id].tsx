import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../src/components/AppText';
import { Card } from '../../src/components/Card';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { OptionSheet } from '../../src/components/form/OptionSheet';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { ServiceChip } from '../../src/components/ServiceChip';
import { initialForServiceName, planLabelFor } from '../../src/data/catalog';
import { CATEGORY_LABELS_KO, toBuiltinCategory } from '../../src/domain/categoryStats';
import {
  daysUntil,
  formatCycleSchedule,
  formatCycleShort,
  formatKoreanDate,
  formatKoreanFullDate,
  parseISODate,
} from '../../src/domain/date';
import { formatKrw, formatUsd, toBaseAmount } from '../../src/domain/money';
import { formatOffsets } from '../../src/domain/offsets';
import type { Subscription } from '../../src/domain/types';
import { getDb } from '../../src/db/database';
import { showToast } from '../../src/lib/toast';
import { createExpoNotificationDriver } from '../../src/notifications/expoDriver';
import {
  cancelForSubscription,
  scheduleForSubscription,
} from '../../src/notifications/scheduler';
import { getHideAmounts, getUsdRate } from '../../src/repos/settingsRepo';
import {
  getSubscription,
  softDeleteSubscription,
  updateSubscription,
} from '../../src/repos/subscriptionRepo';
import { useTheme } from '../../src/theme/ThemeProvider';
import { getCategoryChipColors } from '../../src/theme/tokens';


/** label(caption/secondary) — value(body/600/primary) 행 */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <AppText variant="caption" color="secondary">
        {label}
      </AppText>
      {children}
    </View>
  );
}

export default function SubscriptionDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useMemo(() => getDb(), []);
  const driver = useMemo(() => createExpoNotificationDriver(), []);

  const [sub, setSub] = useState<Subscription | null>(() => (id ? getSubscription(db, id) : null));
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  // 수정 화면에서 돌아왔을 때 반영
  useFocusEffect(
    useCallback(() => {
      setSub(id ? getSubscription(db, id) : null);
    }, [db, id]),
  );

  const usdRate = useMemo(() => getUsdRate(db), [db]);
  const hidden = useMemo(() => getHideAmounts(db), [db]);

  const cancelled = sub?.status === 'CANCELLED';

  /** 해지: 해지함 이동(status만 변경) + 예약 알림 전부 취소 */
  const cancelSubscription = async () => {
    if (!sub || busy) return;
    setBusy(true);
    try {
      softDeleteSubscription(db, sub.id);
      await cancelForSubscription(db, driver, sub.id);
      setConfirmVisible(false);
      showToast(`${sub.name} 구독이 해지됐어요`);
      router.back();
    } catch (e) {
      showToast(`해지에 실패했어요: ${String(e)}`);
      setConfirmVisible(false);
    } finally {
      setBusy(false);
    }
  };

  /** 재개: ACTIVE 복귀 — updateSubscription이 anchor 기준으로 next_billing_at을 재계산한다
   *  (해지 후 시간이 지나 캐시가 과거 날짜여도 앞으로의 첫 결제일로 갱신됨) */
  const resumeSubscription = async () => {
    if (!sub || busy) return;
    setBusy(true);
    try {
      const updated = updateSubscription(db, sub.id, { status: 'ACTIVE' });
      await scheduleForSubscription(db, driver, updated);
      setSub(updated);
      showToast(`${sub.name} 구독이 다시 시작됐어요`);
    } catch (e) {
      showToast(`재개에 실패했어요: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <View
      style={{
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Pressable onPress={() => router.back()} accessibilityLabel="뒤로" hitSlop={8}>
        <Feather name="chevron-left" size={24} color={theme.colors.text.primary} />
      </Pressable>
      {sub && (
        <Pressable onPress={() => setMenuVisible(true)} accessibilityLabel="메뉴" hitSlop={8}>
          <Feather name="more-horizontal" size={24} color={theme.colors.text.primary} />
        </Pressable>
      )}
    </View>
  );

  if (!sub) {
    return (
      <Screen>
        {header}
        <Card>
          <View style={{ alignItems: 'center', gap: theme.spacing.sm, paddingVertical: 32 }}>
            <AppText variant="body" color="secondary">
              구독을 찾을 수 없어요
            </AppText>
          </View>
        </Card>
      </Screen>
    );
  }

  const category = toBuiltinCategory(sub.category);
  const chip = getCategoryChipColors(theme, category, 1);
  const plan = planLabelFor(sub);
  const dday = daysUntil(sub.nextBillingAt);
  const isUsd = sub.currency === 'USD';

  return (
    <Screen>
      {header}

      <Card>
        <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
          <ServiceChip
            initial={initialForServiceName(sub.name)}
            color={chip.bg}
            textColor={chip.text}
            size={64}
          />
          {cancelled && (
            <View
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: 2,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.bg.surfaceAlt,
              }}
            >
              <AppText variant="caption" color="tertiary">
                해지됨
              </AppText>
            </View>
          )}
          <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
            <AppText variant="title">{sub.name}</AppText>
            <AppText variant="caption" color="tertiary">
              {CATEGORY_LABELS_KO[category]}
              {plan ? ` · ${plan}` : ''}
            </AppText>
          </View>
          <View style={{ alignItems: 'center', gap: 2, paddingTop: theme.spacing.xs }}>
            <AppText variant="display">
              {isUsd ? formatUsd(sub.amount, hidden) : formatKrw(sub.amount, hidden)}
            </AppText>
            <AppText variant="caption" color="secondary">
              {formatCycleShort(sub.cycle, sub.cycleCount)}
              {isUsd && !hidden ? ` · ≈${formatKrw(toBaseAmount(sub, usdRate))}` : ''}
            </AppText>
          </View>
        </View>
      </Card>

      <SectionCard title="결제 정보">
        <InfoRow label="다음 결제일">
          <AppText variant="body" style={{ fontWeight: '600' }}>
            {formatKoreanDate(parseISODate(sub.nextBillingAt))} ·{' '}
            <AppText
              variant="body"
              color={dday <= 3 ? 'warning' : 'primary'}
              style={{ fontWeight: '600' }}
            >
              {dday <= 0 ? 'D-Day' : `D-${dday}`}
            </AppText>
          </AppText>
        </InfoRow>
        <InfoRow label="결제 주기">
          <AppText variant="body" style={{ fontWeight: '600' }}>
            {formatCycleSchedule(sub.anchorDate, sub.cycle, sub.cycleCount)}
          </AppText>
        </InfoRow>
        <InfoRow label="등록일">
          <AppText variant="body" style={{ fontWeight: '600' }}>
            {formatKoreanFullDate(parseISODate(sub.anchorDate))}
          </AppText>
        </InfoRow>
      </SectionCard>

      <SectionCard title="알림">
        <InfoRow label="알림 시점">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            <AppText variant="body" style={{ fontWeight: '600' }}>
              {sub.notifyOffsets === null
                ? '기본 설정 사용'
                : formatOffsets(sub.notifyOffsets, ' · ')}
            </AppText>
            <Feather name="chevron-right" size={12} color={theme.colors.text.tertiary} />
          </View>
        </InfoRow>
        <InfoRow label="무료체험">
          {sub.trialEndAt ? (
            <AppText variant="body" style={{ fontWeight: '600' }}>
              {formatKoreanDate(parseISODate(sub.trialEndAt))} 종료
            </AppText>
          ) : (
            <AppText variant="body" color="tertiary" style={{ fontWeight: '600' }}>
              해당 없음
            </AppText>
          )}
        </InfoRow>
      </SectionCard>

      {sub.memo != null && sub.memo.trim() !== '' && (
        <SectionCard title="메모">
          <AppText variant="body">{sub.memo}</AppText>
        </SectionCard>
      )}

      <View style={{ paddingTop: theme.spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => (cancelled ? resumeSubscription() : setConfirmVisible(true))}
          disabled={busy}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: cancelled ? theme.colors.brand.primary : theme.colors.status.danger,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <AppText
            variant="body"
            color={cancelled ? 'brand' : 'danger'}
            style={{ fontWeight: '600' }}
          >
            {cancelled ? '구독 재개' : '구독 해지'}
          </AppText>
        </Pressable>
      </View>

      <OptionSheet
        visible={menuVisible}
        title={sub.name}
        options={[
          { value: 'edit', label: '수정' },
          cancelled
            ? { value: 'resume', label: '재개' }
            : { value: 'cancel', label: '해지', destructive: true },
        ]}
        selected={null}
        onSelect={(action) => {
          if (action === 'edit') router.push(`/subscription/${sub.id}/edit`);
          else if (action === 'resume') resumeSubscription();
          // 시트 Modal이 닫힌 뒤 다이얼로그 Modal을 열어야 겹침 경합이 없다
          else setTimeout(() => setConfirmVisible(true), 350);
        }}
        onClose={() => setMenuVisible(false)}
      />
      <ConfirmDialog
        visible={confirmVisible}
        title={`${sub.name} 구독을 해지할까요?`}
        message={'해지함으로 이동하며, 알림도 중지됩니다\n기록은 남아있어 나중에 다시 볼 수 있어요'}
        confirmLabel="해지하기"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={cancelSubscription}
      />
    </Screen>
  );
}
