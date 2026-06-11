'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { syncDailySteps } from '@/lib/native/healthkit';
import { scheduleWeighInReminder } from '@/lib/native/notifications';

export default function AppInit() {
  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    (async () => {
      await scheduleWeighInReminder();
      await syncDailySteps();

      if (Capacitor.isNativePlatform()) {
        const handle = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) syncDailySteps();
        });
        listenerHandle = handle;
      } else {
        const onVisible = () => {
          if (document.visibilityState === 'visible') syncDailySteps();
        };
        document.addEventListener('visibilitychange', onVisible);
        listenerHandle = {
          remove: () => document.removeEventListener('visibilitychange', onVisible)
        };

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
      }
    })();

    return () => listenerHandle?.remove();
  }, []);

  return null;
}
