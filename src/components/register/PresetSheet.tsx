import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { CatalogItem } from '../../data/catalog';
import { catalogToDraft } from '../../data/catalogSearch';
import { addDaysYMD, daysInMonth, fromLocalDate, type YMD } from '../../domain/date';
import { formatAmount } from '../../domain/money';
import type { CreateSubscriptionInput } from '../../repos/subscriptionRepo';
import { getCategoryChipColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { BottomSheet } from '../BottomSheet';
import { DateField } from '../DateField';
import { ServiceChip } from '../ServiceChip';

const CATEGORY_LABEL: Record<string, string> = {
  OTT: 'OTT',
  AI: 'AI',
  SHOPPING: '쇼핑',
  MUSIC: '음악',
  ETC: '기타',
};

/** 프리셋 등록 시트 (03_등록_시트 목업). 결제일만 필수, 나머지는 카탈로그가 채운다. */
export function PresetSheet({
  item,
  usdRate,
  onClose,
  onSubmit,
}: {
  item: CatalogItem | null;
  usdRate: number;
  onClose: () => void;
  onSubmit: (input: CreateSubscriptionInput, displayName: string) => void;
}) {
  const { theme } = useTheme();
  const [planIndex, setPlanIndex] = useState(0);
  const [date, setDate] = useState<YMD>(() => fromLocalDate(new Date()));
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    // 시트가 새 서비스로 열릴 때 초기화
    setPlanIndex(0);
    setDate(fromLocalDate(new Date()));
  }, [item?.id]);

  if (!item) return null;
  const chip = getCategoryChipColors(theme, item.category, 1);
  const today = fromLocalDate(new Date());
  const quickDates: Array<[string, YMD]> = [
    ['오늘', today],
    ['내일', addDaysYMD(today, 1)],
    ['이번 달 말', { ...today, day: daysInMonth(today.year, today.month) }],
  ];

  const submit = () => {
    const draft = catalogToDraft(item, planIndex);
    onSubmit(
      {
        name: draft.name ?? item.name,
        category: draft.category ?? item.category,
        amount: draft.amount ?? item.plans[planIndex].amount,
        currency: draft.currency,
        cycle: draft.cycle ?? item.plans[planIndex].cycle,
        cycleCount: draft.cycleCount,
        anchorDate: `${date.year.toString().padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
      },
      item.name,
    );
  };

  const caption = theme.typography.caption;
  const body = theme.typography.body;

  return (
    <BottomSheet visible={item !== null} onClose={onClose}>
      {/* 시트 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <ServiceChip initial={item.initial} color={chip.bg} textColor={chip.text} size={48} />
        <View>
          <Text
            style={{
              fontSize: theme.typography.heading.fontSize,
              fontWeight: '700',
              color: theme.colors.text.primary,
            }}
            maxFontSizeMultiplier={1.3}
          >
            {item.name}
          </Text>
          <Text
            style={{ fontSize: caption.fontSize, color: theme.colors.text.tertiary }}
            maxFontSizeMultiplier={1.3}
          >
            {CATEGORY_LABEL[item.category]}
          </Text>
        </View>
      </View>

      {/* 플랜 선택 (플랜 1개면 생략) */}
      {item.plans.length > 1 && (
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{ fontSize: caption.fontSize, color: theme.colors.text.secondary, marginBottom: 8 }}
            maxFontSizeMultiplier={1.3}
          >
            플랜
          </Text>
          <View style={{ gap: 8 }}>
            {item.plans.map((plan, i) => {
              const selected = i === planIndex;
              return (
                <Pressable
                  key={plan.label}
                  onPress={() => setPlanIndex(i)}
                  style={{
                    height: 52,
                    borderRadius: theme.radius.md,
                    backgroundColor: selected
                      ? `${theme.colors.brand.primary}14`
                      : theme.colors.bg.canvas,
                    borderWidth: selected ? 1.5 : 0,
                    borderColor: theme.colors.brand.primary,
                    paddingHorizontal: theme.spacing.lg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{ fontSize: body.fontSize, color: theme.colors.text.primary }}
                    maxFontSizeMultiplier={1.3}
                  >
                    {plan.label}
                  </Text>
                  <Text
                    style={{ fontSize: body.fontSize, fontWeight: '700', color: theme.colors.text.primary }}
                    maxFontSizeMultiplier={1.3}
                  >
                    {formatAmount({ amount: plan.amount, currency: plan.currency }, usdRate)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* 결제일 */}
      <View style={{ marginBottom: 8 }}>
        <Text
          style={{ fontSize: caption.fontSize, color: theme.colors.text.secondary, marginBottom: 8 }}
          maxFontSizeMultiplier={1.3}
        >
          다음 결제일
        </Text>
        <DateField value={date} onChange={setDate} open={pickerOpen} onOpenChange={setPickerOpen} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {[...quickDates, ['직접 선택', null] as const].map(([label, ymd]) => (
            <Pressable
              key={label}
              onPress={() => (ymd ? setDate(ymd) : setPickerOpen(true))}
              style={{
                paddingVertical: 6,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.bg.canvas,
              }}
            >
              <Text
                style={{ fontSize: caption.fontSize, color: theme.colors.text.secondary }}
                maxFontSizeMultiplier={1.3}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 추가하기 */}
      <Pressable
        onPress={submit}
        style={{
          marginTop: 8,
          height: 52,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.brand.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{ fontSize: body.fontSize, fontWeight: '700', color: theme.colors.brand.onPrimary }}
          maxFontSizeMultiplier={1.3}
        >
          추가하기
        </Text>
      </Pressable>
    </BottomSheet>
  );
}
