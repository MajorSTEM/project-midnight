const CACHE_NAME = 'gcsp-v2';
const STATIC_ASSETS = ['/', '/index.html'];

// Install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// Fetch — network-first for API, cache-first for static
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes(':7001') || e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.status === 200) {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, resClone));
      }
      return res;
    }))
  );
});

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {};
  const options = {
    body: data.body || 'GCSP Alert',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'gcsp-alert',
    requireInteraction: data.urgent || false,
    data: { url: data.url || '/' },
    actions: [
      { action: 'view', title: 'View Simulation' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  e.waitUntil(self.registration.showNotification(data.title || 'PROJECT MIDNIGHT', options));
});

// Notification click
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'view' || !e.action) {
    e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
  }
});
