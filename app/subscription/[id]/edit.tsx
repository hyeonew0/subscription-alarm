import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { AppText } from '../../../src/components/AppText';
import { Screen } from '../../../src/components/Screen';

export default function SubscriptionEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <AppText variant="title">구독 수정</AppText>
      <AppText variant="caption" color="tertiary">
        id: {id}
      </AppText>
    </Screen>
  );
}
