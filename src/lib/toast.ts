import { Platform, ToastAndroid } from 'react-native';

/** 간단 토스트. iOS는 v1 미지원(no-op) — 필요 시 커스텀 오버레이로 대체 */
export function showToast(message: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}
