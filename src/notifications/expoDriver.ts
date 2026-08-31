import * as Notifications from 'expo-notifications';
import type { NotificationDriver, PermissionState } from './driver';

function mapStatus(status: Notifications.PermissionStatus): PermissionState {
  switch (status) {
    case Notifications.PermissionStatus.GRANTED:
      return 'granted';
    case Notifications.PermissionStatus.DENIED:
      return 'denied';
    default:
      return 'undetermined';
  }
}

/** 로컬 알림 전용 expo-notifications 드라이버 (푸시 서버 없음) */
export function createExpoNotificationDriver(): NotificationDriver {
  return {
    async scheduleAsync(request) {
      return Notifications.scheduleNotificationAsync({
        content: { title: request.title, body: request.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: request.triggerDate,
        },
      });
    },
    async cancelAsync(notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    },
    async getPermissionsAsync() {
      const { status } = await Notifications.getPermissionsAsync();
      return mapStatus(status);
    },
    async requestPermissionsAsync() {
      const { status } = await Notifications.requestPermissionsAsync();
      return mapStatus(status);
    },
  };
}
