const isTauri = '__TAURI_INTERNALS__' in window;

export function registerWebUpdateAdapter() {
  if (isTauri || !('serviceWorker' in navigator)) return;

  if (import.meta.env.DEV && 'getRegistrations' in navigator.serviceWorker) {
    // A production worker may have been registered at this origin before Vite
    // started. It must not control Vite's module and HMR requests.
    void navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => undefined);
    return;
  }

  const controlledAtStartup = Boolean(navigator.serviceWorker.controller);

  void navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
    let updatePrompted = false;
    const promptForUpdate = (worker: ServiceWorker | null) => {
      if (!worker || updatePrompted || !navigator.serviceWorker.controller) return;
      updatePrompted = true;
      if (window.confirm('نسخه جدید برنامه آماده است. اکنون به‌روزرسانی شود؟')) {
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    promptForUpdate(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') promptForUpdate(worker);
      });
    });

    const checkForUpdate = () => void Promise.resolve(registration.update()).catch(() => undefined);
    window.setTimeout(checkForUpdate, 1000);
    window.addEventListener('online', checkForUpdate);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    });
  }).catch(() => {
    // Service workers are progressive enhancement for the web build.
  });

  if (controlledAtStartup) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    }, { once: true });
  }
}
