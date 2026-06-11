self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Pesaje en ayunas', {
      body: payload.body ?? 'Sube a la báscula antes de desayunar y registra tu peso.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'pesaje-diario',
      data: { url: '/?focus=peso' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/?focus=peso';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
