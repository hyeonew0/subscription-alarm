import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { offsetLabel } from '../../domain/offsets';
import { showToast } from '../../lib/toast';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';
import { BottomSheet } from '../BottomSheet';
import { CheckRow } from '../form/CheckRow';

/** 전역 기본 알림 시점 선택지 (일 단위) */
const GLOBAL_OFFSET_OPTIONS: number[] = [30, 7, 3, 0];

/** 전역 기본 알림 시점 선택 시트 (다중 선택 + 저장) */
export function OffsetsSheet({
  visible,
  initial,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: number[];
  /** 내림차순 정렬된 오프셋 배열 */
  onSave: (offsets: number[]) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<number[]>(initial);
  useEffect(() => {
    if (visible) setSelected(initial);
  }, [visible, initial]);

  const toggle = (offset: number) => {
    setSelected((prev) =>
      prev.includes(offset) ? prev.filter((o) => o !== offset) : [...prev, offset],
    );
  };

  const save = () => {
    if (selected.length === 0) {
      showToast('알림 시점을 하나 이상 선택해 주세요');
      return;
    }
    onSave([...selected].sort((a, b) => b - a));
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: theme.spacing.lg }}>
        <AppText variant="heading">알림 시점</AppText>
        <View style={{ gap: theme.spacing.md }}>
          {GLOBAL_OFFSET_OPTIONS.map((offset) => (
            <CheckRow
              key={offset}
              checked={selected.includes(offset)}
              label={offsetLabel(offset)}
              onPress={() => toggle(offset)}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={save}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <AppText variant="body" color="onBrand" style={{ fontWeight: '700' }}>
            저장
          </AppText>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
