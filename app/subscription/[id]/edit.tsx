import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { AppText } from '../../../src/components/AppText';
import { Card } from '../../../src/components/Card';
import { CycleSegment } from '../../../src/components/CycleSegment';
import { DateField } from '../../../src/components/DateField';
import { AmountRow } from '../../../src/components/form/AmountRow';
import { CheckRow } from '../../../src/components/form/CheckRow';
import { FieldLabel, FormTextInput } from '../../../src/components/form/FormField';
import { OptionSheet } from '../../../src/components/form/OptionSheet';
import { Screen } from '../../../src/components/Screen';
import { findCatalogItem } from '../../../src/data/catalog';
import { formatYMD, parseISODate, type YMD } from '../../../src/domain/date';
import { offsetLabel } from '../../../src/domain/offsets';
import { formatAmount, formatKrw, parseAmountInput } from '../../../src/domain/money';
import { MANUAL_PLAN_LABEL, type Currency, type Cycle } from '../../../src/domain/types';
import { getDb } from '../../../src/db/database';
import { showToast } from '../../../src/lib/toast';
import { createExpoNotificationDriver } from '../../../src/notifications/expoDriver';
import { scheduleForSubscription } from '../../../src/notifications/scheduler';
import { getDefaultNotifyOffsets, getUsdRate } from '../../../src/repos/settingsRepo';
import { getSubscription, updateSubscription } from '../../../src/repos/subscriptionRepo';
import { useTheme } from '../../../src/theme/ThemeProvider';

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'OTT', label: 'OTT' },
  { value: 'AI', label: 'AI' },
  { value: 'SHOPPING', label: '쇼핑' },
  { value: 'MUSIC', label: '음악' },
  { value: 'ETC', label: '기타' },
];

/** 이 구독 전용 알림 시점 선택지 (일 단위 오프셋) */
const OFFSET_OPTIONS: number[] = [7, 3, 0];

function amountToText(amount: number, currency: Currency): string {
  return currency === 'KRW' ? String(amount) : (amount / 100).toFixed(2);
}

export default function SubscriptionEditScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useMemo(() => getDb(), []);
  const driver = useMemo(() => createExpoNotificationDriver(), []);
  const usdRate = useMemo(() => getUsdRate(db), [db]);
  const defaultOffsets = useMemo(() => getDefaultNotifyOffsets(db), [db]);

  // 수정 대상 스냅샷. 폼이 열려 있는 동안 원본이 바뀔 일은 없다 (단일 사용자 로컬 DB)
  const sub = useMemo(() => (id ? getSubscription(db, id) : null), [db, id]);

  // 카탈로그 연결 구독: 서비스명 고정, 금액은 플랜 선택으로만(직접 입력 선택 시 열림)
  const catalogItem = useMemo(() => findCatalogItem(sub?.catalogId ?? null), [sub?.catalogId]);
  const linked = catalogItem !== null;

  const [name, setName] = useState(sub?.name ?? '');
  const [planLabel, setPlanLabel] = useState<string | null>(sub?.planLabel ?? null);
  const [category, setCategory] = useState(sub?.category ?? 'ETC');
  const [amountText, setAmountText] = useState(
    sub ? amountToText(sub.amount, sub.currency) : '',
  );
  const [currency, setCurrency] = useState<Currency>(sub?.currency ?? 'KRW');
  const [cycle, setCycle] = useState<Cycle>(sub?.cycle ?? 'MONTHLY');
  const [date, setDate] = useState<YMD>(() =>
    parseISODate(sub?.nextBillingAt ?? formatYMD({ year: 2026, month: 1, day: 1 })),
  );
  const [useDefaultNotify, setUseDefaultNotify] = useState(sub?.notifyOffsets == null);
  const [customOffsets, setCustomOffsets] = useState<number[]>(sub?.notifyOffsets ?? []);
  const [memo, setMemo] = useState(sub?.memo ?? '');
  const [categorySheet, setCategorySheet] = useState(false);
  const [planSheet, setPlanSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  const parsedAmount = parseAmountInput(amountText, currency);

  // 변경 여부 (X/뒤로가기 시 확인용)
  const dirty =
    sub !== null &&
    (name !== sub.name ||
      planLabel !== sub.planLabel ||
      category !== sub.category ||
      amountText !== amountToText(sub.amount, sub.currency) ||
      currency !== sub.currency ||
      cycle !== sub.cycle ||
      formatYMD(date) !== sub.nextBillingAt ||
      useDefaultNotify !== (sub.notifyOffsets == null) ||
      (!useDefaultNotify &&
        JSON.stringify([...customOffsets].sort()) !==
          JSON.stringify([...(sub.notifyOffsets ?? [])].sort())) ||
      memo !== (sub.memo ?? ''));
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const skipConfirmRef = useRef(false);

  // X 버튼·하드웨어 뒤로가기 공통: 변경사항 있으면 확인 후 나가기
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!dirtyRef.current || skipConfirmRef.current) return;
      e.preventDefault();
      Alert.alert('변경사항을 저장하지 않고 나갈까요?', undefined, [
        { text: '계속 수정', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });
  }, [navigation]);

  // 선택된 카탈로그 플랜. 없으면(직접 입력·구버전 라벨) 금액 필드를 연다
  const selectedPlan = linked ? (catalogItem.plans.find((p) => p.label === planLabel) ?? null) : null;
  const manualAmount = !linked || selectedPlan === null;

  /** 플랜 변경: 금액·통화·주기만 교체하고 anchor_date(다음 결제일)는 그대로 둔다 */
  const applyPlan = (value: string) => {
    if (value === MANUAL_PLAN_LABEL) {
      setPlanLabel(MANUAL_PLAN_LABEL);
      return;
    }
    const plan = catalogItem?.plans.find((p) => p.label === value);
    if (!plan) return;
    setPlanLabel(plan.label);
    setAmountText(amountToText(plan.amount, plan.currency));
    setCurrency(plan.currency);
    setCycle(plan.cycle);
  };

  /** 플랜이 정한 주기를 손으로 바꾸면 더 이상 그 플랜이 아니므로 직접 입력으로 전환 */
  const changeCycle = (next: Cycle) => {
    setCycle(next);
    if (selectedPlan && selectedPlan.cycle !== next) setPlanLabel(MANUAL_PLAN_LABEL);
  };

  const toggleOffset = (offset: number) => {
    setUseDefaultNotify(false);
    setCustomOffsets((prev) =>
      prev.includes(offset) ? prev.filter((o) => o !== offset) : [...prev, offset],
    );
  };

  const save = async () => {
    if (!sub || saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast('서비스명을 입력해 주세요');
      return;
    }
    if (parsedAmount === null || parsedAmount <= 0) {
      showToast('금액을 확인해 주세요');
      return;
    }
    if (!useDefaultNotify && customOffsets.length === 0) {
      showToast('알림 시점을 선택해 주세요');
      return;
    }
    setSaving(true);
    try {
      // ⚠️ anchor_date vs next_billing_at:
      // 사용자가 "다음 결제일"을 바꾸면 anchor_date 자체를 그 날짜로 갱신해야 한다.
      // next_billing_at은 anchor 기반 계산의 캐시일 뿐이라, 캐시만 바꾸면
      // 다음 주기 재계산 때 원래 anchor의 날짜(예: 매월 3일)로 되돌아가 버린다.
      // 날짜를 안 건드렸으면 anchor를 보존한다 — 표시 중인 next_billing_at(예: 9/3)을
      // anchor로 덮어쓰면 월말 클램프 복원(1/31→2/28→3/31) 정보가 사라진다.
      const dateTouched = formatYMD(date) !== sub.nextBillingAt;
      const updated = updateSubscription(db, sub.id, {
        name: trimmedName,
        category,
        amount: parsedAmount,
        currency,
        cycle,
        memo: memo.trim() === '' ? null : memo.trim(),
        notifyOffsets: useDefaultNotify ? null : [...customOffsets].sort((a, b) => b - a),
        ...(linked ? { planLabel: planLabel ?? MANUAL_PLAN_LABEL } : {}),
        ...(dateTouched ? { anchorDate: formatYMD(date) } : {}),
      });
      // 금액·주기·결제일이 바뀌면 기존 예약이 무효 — 반드시 재예약
      // (scheduleForSubscription이 내부에서 기존 예약 취소 후 다시 잡는다)
      await scheduleForSubscription(db, driver, updated);
      showToast('저장했어요');
      skipConfirmRef.current = true;
      router.back();
    } catch (e) {
      showToast(`저장에 실패했어요: ${String(e)}`);
      setSaving(false);
    }
  };

  // 환산 미리보기: KRW 입력 → 달러, USD 입력 → 원화
  const preview =
    parsedAmount === null
      ? null
      : currency === 'KRW'
        ? `≈ $${(parsedAmount / usdRate).toFixed(2)} (환율 ${formatKrw(usdRate)})`
        : `≈ ${formatKrw(Math.round((parsedAmount / 100) * usdRate))} (환율 ${formatKrw(usdRate)})`;

  if (!sub) {
    return (
      <Screen>
        <View style={{ height: 56, justifyContent: 'center' }}>
          <Pressable onPress={() => router.back()} accessibilityLabel="닫기" hitSlop={8}>
            <Feather name="x" size={24} color={theme.colors.text.primary} />
          </Pressable>
        </View>
        <Card>
          <AppText variant="body" color="secondary">
            구독을 찾을 수 없어요
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable onPress={() => router.back()} accessibilityLabel="닫기" hitSlop={8}>
          <Feather name="x" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <AppText variant="title">구독 수정</AppText>
        <Pressable onPress={save} hitSlop={8} disabled={saving}>
          <AppText variant="caption" color="brand" style={{ fontWeight: '600' }}>
            저장
          </AppText>
        </Pressable>
      </View>

      <Card>
        <View style={{ gap: theme.card.padding }}>
          <View style={{ gap: theme.spacing.sm }}>
            <FieldLabel>서비스명</FieldLabel>
            {linked ? (
              // 다른 서비스로 바꾸는 건 막는다 (잘못 등록했으면 해지 후 재등록)
              <View
                style={{
                  height: 52,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.bg.canvas,
                  paddingHorizontal: theme.spacing.lg,
                  justifyContent: 'center',
                }}
              >
                <AppText variant="body" color="secondary">
                  {name}
                </AppText>
              </View>
            ) : (
              <FormTextInput value={name} onChangeText={setName} placeholder="예: 넷플릭스" />
            )}
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <FieldLabel>카테고리</FieldLabel>
            <Pressable
              accessibilityRole="button"
              onPress={() => setCategorySheet(true)}
              style={{
                height: 52,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.bg.canvas,
                paddingHorizontal: theme.spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <AppText variant="body">
                {CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? category}
              </AppText>
              <Feather name="chevron-down" size={12} color={theme.colors.text.tertiary} />
            </Pressable>
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ gap: theme.spacing.sm }}>
          {linked && (
            <>
              <FieldLabel>플랜</FieldLabel>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="플랜 변경"
                onPress={() => setPlanSheet(true)}
                style={{
                  height: 52,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.bg.canvas,
                  paddingHorizontal: theme.spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <AppText variant="body">
                  {selectedPlan
                    ? `${selectedPlan.label} · ${formatAmount(selectedPlan, usdRate)}`
                    : MANUAL_PLAN_LABEL}
                </AppText>
                <AppText variant="caption" color="brand" style={{ fontWeight: '600' }}>
                  플랜 변경
                </AppText>
              </Pressable>
            </>
          )}
          {manualAmount && (
            <View style={{ gap: theme.spacing.sm, paddingTop: linked ? theme.spacing.md : 0 }}>
              <FieldLabel>금액</FieldLabel>
              <AmountRow
                amountText={amountText}
                onAmountText={setAmountText}
                currency={currency}
                onCurrency={setCurrency}
              />
              {preview !== null && (
                <AppText variant="micro" color="tertiary">
                  {preview}
                </AppText>
              )}
            </View>
          )}
        </View>
      </Card>

      <Card>
        <View style={{ gap: theme.spacing.sm }}>
          <FieldLabel>결제 주기</FieldLabel>
          <CycleSegment value={cycle} onChange={changeCycle} />
          <View style={{ gap: theme.spacing.sm, paddingTop: theme.spacing.md }}>
            <FieldLabel>다음 결제일</FieldLabel>
            <DateField value={date} onChange={setDate} />
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ gap: theme.spacing.sm }}>
          <FieldLabel>이 구독의 알림</FieldLabel>
          <View style={{ gap: theme.spacing.md }}>
            <CheckRow
              checked={useDefaultNotify}
              label={`기본 설정 사용 (${defaultOffsets.map(offsetLabel).join(', ')})`}
              onPress={() => {
                setUseDefaultNotify(true);
                setCustomOffsets([]);
              }}
            />
            {OFFSET_OPTIONS.map((offset) => (
              <CheckRow
                key={offset}
                checked={!useDefaultNotify && customOffsets.includes(offset)}
                label={offsetLabel(offset)}
                onPress={() => toggleOffset(offset)}
              />
            ))}
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ gap: theme.spacing.sm }}>
          <FieldLabel>메모 (선택)</FieldLabel>
          <FormTextInput
            value={memo}
            onChangeText={setMemo}
            multiline
            placeholder="예: 가족 계정으로 공유 중"
          />
        </View>
      </Card>

      <OptionSheet
        visible={categorySheet}
        title="카테고리"
        options={CATEGORY_OPTIONS}
        selected={category}
        onSelect={setCategory}
        onClose={() => setCategorySheet(false)}
      />
      <OptionSheet
        visible={planSheet}
        title="플랜"
        options={[
          ...(catalogItem?.plans ?? []).map((plan) => ({
            value: plan.label,
            label: plan.label,
            detail: formatAmount(plan, usdRate),
          })),
          { value: MANUAL_PLAN_LABEL, label: MANUAL_PLAN_LABEL },
        ]}
        selected={selectedPlan ? selectedPlan.label : MANUAL_PLAN_LABEL}
        onSelect={applyPlan}
        onClose={() => setPlanSheet(false)}
      />
    </Screen>
  );
}
