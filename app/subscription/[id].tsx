import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../src/components/AppText';
import { Card } from '../../src/components/Card';
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
import { getHideAmounts, getUsdRate } from '../../src/repos/settingsRepo';
import { getSubscription } from '../../src/repos/subscriptionRepo';
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

  const [sub, setSub] = useState<Subscription | null>(() => (id ? getSubscription(db, id) : null));
  // 수정 화면에서 돌아왔을 때 반영
  useFocusEffect(
    useCallback(() => {
      setSub(id ? getSubscription(db, id) : null);
    }, [db, id]),
  );

  const usdRate = useMemo(() => getUsdRate(db), [db]);
  const hidden = useMemo(() => getHideAmounts(db), [db]);

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
        <Pressable
          onPress={() => router.push(`/subscription/${sub.id}/edit`)}
          accessibilityLabel="수정"
          hitSlop={8}
        >
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

      {sub.status !== 'CANCELLED' && (
        <View style={{ paddingTop: theme.spacing.sm }}>
          <Pressable
            accessibilityRole="button"
            // TODO: 10_해지확인 다이얼로그 연결 (다음 스텝)
            onPress={() => showToast('해지 확인은 곧 추가돼요')}
            style={({ pressed }) => ({
              height: 52,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.status.danger,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppText variant="body" color="danger" style={{ fontWeight: '600' }}>
              구독 해지
            </AppText>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
