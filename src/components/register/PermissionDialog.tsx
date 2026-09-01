import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** 첫 등록 직후 알림 권한 안내 (09_알림권한_안내 목업) */
export function PermissionDialog({
  visible,
  serviceName,
  onAccept,
  onDecline,
}: {
  visible: boolean;
  serviceName: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={[styles.root, { backgroundColor: theme.colors.bg.overlay }]}>
        <View
          style={{
            width: 313,
            borderRadius: 20,
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.bg.surface,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: theme.radius.full,
              backgroundColor: `${theme.colors.brand.primary}1A`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="bell" size={24} color={theme.colors.brand.primary} />
          </View>
          <Text
            style={{
              marginTop: 16,
              fontSize: theme.typography.heading.fontSize,
              fontWeight: '700',
              color: theme.colors.text.primary,
            }}
            maxFontSizeMultiplier={1.3}
          >
            결제일 전에 알려드릴까요?
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: theme.typography.caption.fontSize,
              lineHeight: theme.typography.caption.lineHeight,
              color: theme.colors.text.secondary,
              textAlign: 'center',
            }}
            maxFontSizeMultiplier={1.3}
          >
            {serviceName} 결제 3일 전에{'\n'}알림을 보내드려요
          </Text>
          <Pressable
            onPress={onAccept}
            style={{
              marginTop: 20,
              alignSelf: 'stretch',
              height: 48,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.brand.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.body.fontSize,
                fontWeight: '700',
                color: theme.colors.brand.onPrimary,
              }}
              maxFontSizeMultiplier={1.3}
            >
              알림 받기
            </Text>
          </Pressable>
          <Pressable onPress={onDecline} style={{ marginTop: 12 }}>
            <Text
              style={{
                fontSize: theme.typography.caption.fontSize,
                color: theme.colors.text.tertiary,
              }}
              maxFontSizeMultiplier={1.3}
            >
              괜찮아요
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
