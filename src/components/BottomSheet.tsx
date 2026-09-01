import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/**
 * RN Modal 기반 바텀시트 (03_등록_시트 목업 규격).
 * v1 시트는 드래그/스냅포인트가 필요 없어 @gorhom/bottom-sheet(reanimated +
 * gesture-handler 네이티브 의존) 대신 표준 Modal로 구현한다.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.bg.overlay }]}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: theme.colors.bg.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: theme.card.padding,
            paddingTop: 12,
            paddingBottom: 34,
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.border.default,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
});
