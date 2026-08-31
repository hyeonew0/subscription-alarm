/**
 * 알림 백엔드 추상화. 스케줄러 로직은 이 인터페이스에만 의존하므로
 * 앱에서는 expo-notifications로, 테스트에서는 인메모리 페이크로 구동한다.
 */
export type PermissionState = 'granted' | 'denied' | 'undetermined';

export interface NotificationRequest {
  title: string;
  body: string;
  /** 발화 시각 (로컬) */
  triggerDate: Date;
}

export interface NotificationDriver {
  /** 로컬 알림 예약. OS가 부여한 notification id를 반환한다. */
  scheduleAsync(request: NotificationRequest): Promise<string>;
  cancelAsync(notificationId: string): Promise<void>;
  getPermissionsAsync(): Promise<PermissionState>;
  requestPermissionsAsync(): Promise<PermissionState>;
}
