/**
 * notificationUtils.ts
 * Web Push and local notification helpers for GCSP.
 */

// Placeholder VAPID public key — replace with a real key generated via
// `npx web-push generate-vapid-keys` for production use.
const VAPID_PUBLIC_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjZJMeL1x-ToBisBKCOHvN7x82';

/**
 * Convert a base64url VAPID public key to a Uint8Array for pushManager.subscribe.
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

/**
 * Request notification permission from the browser.
 * Returns true if the user grants permission, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[notificationUtils] Notifications not supported in this browser.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Subscribe the user to Web Push notifications using the service worker.
 * Returns the PushSubscription if successful, or null on failure.
 *
 * NOTE: This requires a real VAPID key pair and a backend endpoint to store
 * the subscription. The VAPID_PUBLIC_KEY above is a placeholder.
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[notificationUtils] Push notifications not supported.');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (!permission) {
    console.warn('[notificationUtils] Notification permission denied.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    console.info('[notificationUtils] Push subscription created:', subscription.endpoint);
    return subscription;
  } catch (err) {
    console.error('[notificationUtils] Push subscription failed:', err);
    return null;
  }
}

/**
 * Send a local (non-push) notification immediately.
 * Uses the Service Worker registration if available for richer options,
 * falls back to `new Notification()` otherwise.
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  urgent = false,
): Promise<void> {
  if (!('Notification' in window)) {
    console.warn('[notificationUtils] Notifications not supported.');
    return;
  }

  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }

  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: urgent ? 'gcsp-urgent' : 'gcsp-alert',
    requireInteraction: urgent,
    data: { url: '/' },
  };

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    } catch {
      // Fall through to direct Notification
    }
  }

  // Direct Notification fallback
  try {
    new Notification(title, options);
  } catch (err) {
    console.error('[notificationUtils] Notification error:', err);
  }
}
