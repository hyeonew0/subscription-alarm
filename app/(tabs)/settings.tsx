import { Link } from 'expo-router';
import React from 'react';
import { AppText } from '../../src/components/AppText';
import { Screen } from '../../src/components/Screen';

export default function SettingsScreen() {
  return (
    <Screen>
      <AppText variant="title">설정</AppText>
      {__DEV__ && (
        <Link href="/debug">
          <AppText variant="caption" color="brand">
            알림 디버그 화면 열기 (개발용)
          </AppText>
        </Link>
      )}
    </Screen>
  );
}
