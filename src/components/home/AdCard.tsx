import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';
import { Card } from '../Card';

/** 광고 카드 자리표시자. TODO: AdMob 연동 시 320×50 배너로 교체 */
export function AdCard() {
  const { theme } = useTheme();
  return (
    <Card variant="tight">
      <View style={{ height: 50, alignItems: 'center', justifyContent: 'center' }}>
        <AppText
          variant="micro"
          color="tertiary"
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          AD
        </AppText>
        <AppText variant="micro" color="tertiary">
          광고 영역 320×50
        </AppText>
      </View>
    </Card>
  );
}
