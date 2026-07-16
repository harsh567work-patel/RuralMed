/**
 * PWA Registration Module
 * 
 * Handles service worker registration and updates
 * Enables offline functionality and app installation
 */

let registration = null;

/**
 * Register service worker for PWA
 * @returns {Promise<ServiceWorkerRegistration>}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker not supported in this browser');
    return null;
  }

  try {
    // Vite PWA plugin automatically registers the service worker
    // This function is here for manual registration if needed

    registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      console.log('[PWA] Service Worker already registered');
      setupUpdateListener(registration);
    } else {
      console.log('[PWA] No Service Worker registration found');
    }

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Setup listener for service worker updates
 * Prompts user when new version is available
 */
function setupUpdateListener(reg) {
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;

    newWorker.addEventListener('statechange', () => {
      if (
        newWorker.state === 'installed' &&
        navigator.serviceWorker.controller
      ) {
        console.log('[PWA] New service worker available');

        // Dispatch custom event for app to show update notification
        window.dispatchEvent(
          new CustomEvent('sw-update-available', {
            detail: { registration: reg },
          })
        );
      }
    });
  });
}

/**
 * Check for service worker updates
 * @returns {Promise<boolean>} True if update available
 */
export async function checkForUpdates() {
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.update();

    const hasUpdate = reg.installing !== null;

    if (hasUpdate) {
      console.log('[PWA] Update available');
    } else {
      console.log('[PWA] App is up to date');
    }

    return hasUpdate;
  } catch (error) {
    console.error('[PWA] Error checking for updates:', error);
    return false;
  }
}

/**
 * Update service worker (reload app)
 * Call this after showing update prompt to user
 */
export function updateServiceWorker() {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload page when new SW takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    console.log('[PWA] Updating to new version...');
  }
}

/**
 * Check if app is installed
 * @returns {boolean} True if running as standalone app
 */
export function isAppInstalled() {
  return (
    'standalone' in window.navigator &&
    window.navigator.standalone === true
  );
}

/**
 * Detect if app can be installed (iOS)
 */
export function canInstallApp() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid =
    /Android/.test(navigator.userAgent) && 'serviceWorker' in navigator;

  return isIOS || isAndroid || ('BeforeInstallPromptEvent' in window);
}

/**
 * Handle install prompt manually (for Android)
 * Store the event to trigger later
 */
let deferredPrompt = null;

export function setupInstallPrompt() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt available');

    // Dispatch event so app can show install button
    window.dispatchEvent(new Event('pwa-install-available'));
  });
}

/**
 * Trigger install prompt
 * Only works if event was previously intercepted
 */
export async function triggerInstallPrompt() {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`[PWA] User response: ${outcome}`);

    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Error showing install prompt:', error);
    return false;
  }
}

/**
 * Get app info
 */
export function getAppInfo() {
  return {
    isInstalled: isAppInstalled(),
    canInstall: canInstallApp(),
    isOnline: navigator.onLine,
    isSupported: 'serviceWorker' in navigator,
  };
}

/**
 * Initialize PWA
 * Call this on app startup
 */
export async function initPWA() {
  console.log('[PWA] Initializing...');

  try {
    // Register service worker
    await registerServiceWorker();

    // Setup install prompt
    setupInstallPrompt();

    // Check for updates periodically
    setInterval(async () => {
      await checkForUpdates();
    }, 60000); // Every minute

    console.log('[PWA] Initialization complete');
    return true;
  } catch (error) {
    console.error('[PWA] Initialization failed:', error);
    return false;
  }
}

export default {
  init: initPWA,
  registerSW: registerServiceWorker,
  checkUpdates: checkForUpdates,
  update: updateServiceWorker,
  isInstalled: isAppInstalled,
  canInstall: canInstallApp,
  triggerInstall: triggerInstallPrompt,
  getInfo: getAppInfo,
};
