import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Card } from './Card';

/** 빈 상태 카드 공통 골격 (02_목록·05_통계 빈상태 규격: py40, 아이콘 48, surfaceAlt 버튼) */
export function EmptyStateCard({
  icon,
  title,
  caption,
  buttonLabel,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  /** 제목 아래 보조 설명 (여러 줄은 \n) */
  caption?: string;
  buttonLabel: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Card style={{ paddingVertical: 40 }}>
      <View style={{ alignItems: 'center', gap: theme.spacing.lg }}>
        <Feather name={icon} size={48} color={theme.colors.text.tertiary} />
        <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
          <AppText variant="body" color="secondary">
            {title}
          </AppText>
          {caption !== undefined && (
            <AppText variant="caption" color="tertiary" style={{ textAlign: 'center' }}>
              {caption}
            </AppText>
          )}
        </View>
        <View style={{ paddingTop: theme.spacing.xs }}>
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => ({
              height: 44,
              paddingHorizontal: theme.spacing.xl,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.bg.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppText variant="caption" color="brand" style={{ fontWeight: '600' }}>
              {buttonLabel}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
