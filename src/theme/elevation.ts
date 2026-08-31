import { Platform, type ViewStyle } from 'react-native';
import type { ElevationToken } from './tokens';

/** Elevation 토큰을 플랫폼별 스타일로 변환한다 (iOS shadow / Android elevation). */
export function elevationStyle(token: ElevationToken): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation: token.android.elevation };
  }
  return {
    shadowColor: token.ios.shadowColor,
    shadowOpacity: token.ios.shadowOpacity,
    shadowRadius: token.ios.shadowRadius,
    shadowOffset: token.ios.shadowOffset,
  };
}
