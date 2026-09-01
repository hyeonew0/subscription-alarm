import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Card } from './Card';

/** 섹션 카드 공통 골격: heading + 구분선 + 내용 (상세·통계 등) */
export function SectionCard({
  title,
  contentGap,
  children,
}: {
  title: string;
  /** 내용 요소 간 간격 (기본 spacing.lg 16) */
  contentGap?: number;
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
        <View style={{ gap: contentGap ?? theme.spacing.lg }}>{children}</View>
      </View>
    </Card>
  );
}
