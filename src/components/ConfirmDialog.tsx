import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

/** 중앙 확인 다이얼로그 (10_해지확인 목업 규격: 313w · radius 20 · 버튼 2개 가로) */
export function ConfirmDialog({
  visible,
  title,
  message,
  cancelLabel = '취소',
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel?: string;
  /** 확인 버튼 (status.danger 배경) */
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.root, { backgroundColor: theme.colors.bg.overlay }]}>
        <View
          style={{
            width: 313,
            borderRadius: 20,
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.bg.surface,
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}
        >
          <AppText variant="heading" style={{ fontWeight: '700', textAlign: 'center' }}>
            {title}
          </AppText>
          <AppText variant="caption" color="secondary" style={{ textAlign: 'center' }}>
            {message}
          </AppText>
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.sm,
              paddingTop: theme.spacing.md,
              alignSelf: 'stretch',
            }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.bg.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <AppText variant="body" color="secondary" style={{ fontWeight: '600' }}>
                {cancelLabel}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.status.danger,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <AppText variant="body" color="inverse" style={{ fontWeight: '700' }}>
                {confirmLabel}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
