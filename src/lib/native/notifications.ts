import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const WEIGH_IN_NOTIFICATION_ID = 700;

export async function scheduleWeighInReminder(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') return;

    const pending = await LocalNotifications.getPending();
    if (pending.notifications.some((n) => n.id === WEIGH_IN_NOTIFICATION_ID)) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: WEIGH_IN_NOTIFICATION_ID,
          title: 'Pesaje en ayunas',
          body: 'Sube a la báscula antes de desayunar y registra tu peso en la app.',
          schedule: {
            on: { hour: 7, minute: 0 },
            allowWhileIdle: true
          },
          extra: { url: '/?focus=peso' }
        }
      ]
    });

    await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const url = action.notification.extra?.url ?? '/?focus=peso';
      window.location.href = url;
    });
    return;
  }

  if ('serviceWorker' in navigator && 'Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    await navigator.serviceWorker.register('/sw.js');
  }
}
