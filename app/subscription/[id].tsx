import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { AppText } from '../../src/components/AppText';
import { Screen } from '../../src/components/Screen';

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <AppText variant="title">구독 상세</AppText>
      <AppText variant="caption" color="tertiary">
        id: {id}
      </AppText>
    </Screen>
  );
}
