import React from 'react';
import { View } from 'react-native';
import { formatKrw } from '../../domain/money';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';
import { Card } from '../Card';

export interface TotalCardProps {
  /** 월 환산 합계 (KRW 정수) */
  monthlyTotal: number;
  /** 연 환산 합계 (KRW 정수) */
  yearlyTotal: number;
  /** ACTIVE 구독 수 */
  count: number;
  /** hide_amounts 설정 */
  hidden: boolean;
}

/** 홈 총액 카드 (Figma 01_홈 card-total) */
export function TotalCard({ monthlyTotal, yearlyTotal, count, hidden }: TotalCardProps) {
  const { theme } = useTheme();
  return (
    <Card variant="tight">
      <View style={{ gap: theme.spacing.sm }}>
        <View style={{ gap: theme.spacing.xs }}>
          <View style={{ gap: 2 }}>
            <AppText variant="caption" color="secondary">
              이번 달 구독료
            </AppText>
            <AppText variant="display">{formatKrw(monthlyTotal, hidden)}</AppText>
          </View>
          <AppText variant="caption" color="tertiary">
            연 {formatKrw(yearlyTotal, hidden)}
          </AppText>
        </View>
        <View style={{ gap: 2 }}>
          {/* TODO: 전월 대비 증감("지난달보다 X원 많아요") — 지난달에 실제 결제됐을
              구독들의 합(주기별 결제 발생 시점 열거)이 필요해 이번 스텝에서는 생략 */}
          <AppText variant="caption" color="tertiary">
            구독 {count}개
          </AppText>
        </View>
      </View>
    </Card>
  );
}
