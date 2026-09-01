import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../src/components/AppText';
import { Fab } from '../../src/components/Fab';
import { Screen } from '../../src/components/Screen';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppText variant="title">홈</AppText>
      </Screen>
      <Fab />
    </View>
  );
}
