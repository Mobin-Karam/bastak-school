"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { brandText } from "../../../app/config/brand";
import { PWAUpdateBanner } from "./pwa-update-banner";
import { PWAInstallBanner } from "./PWAInstallBanner";
import { PWAInstallModal } from "./PWAInstallModal";
import {
  checkForUpdate,
  fetchRemoteVersion,
  setAcceptedVersion,
  setDismissedVersion,
  setInstalledVersion,
  VersionCheckResult,
} from "@/shared/lib/pwa/version-checker";
import {
  onSWUpdate,
  registerServiceWorker,
  skipWaiting,
  SWUpdateEvent,
  warmAppCache,
} from "@/shared/lib/pwa/register-service-worker";
import { usePWAInstall } from "./hooks/use-pwa-install";
import { syncOfflineChanges, warmOfflineCache } from "@/shared/lib/offline/offline-sync";
import { PWA_OPEN_INSTALL_EVENT } from "./install-launcher";

const CORE_ROUTES = ["/", "/offline", "/manifest.webmanifest", "/version.json"];

export function PWAProvider() {
  const {
    canInstall,
    dismissInstall,
    installApp,
    isInstalling,
    isAndroid,
    isIOS,
    isMobile,
    shouldShowPrompt,
    trackPWAEvent,
  } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [localVersion, setLocalVersion] = useState<string | null>(null);
  const reloading = useRef(false);

  const applyVersionResult = useCallback((result: VersionCheckResult) => {
    setLocalVersion(result.localVersion);
    setRemoteVersion(result.remoteVersion);
    if (result.updateAvailable && !result.dismissed) setShowUpdate(true);
  }, []);

  useEffect(() => {
    let alive = true;
    let unsubscribe: () => void = () => {};
    (async () => {
      const registration = await registerServiceWorker();
      if (!alive || !registration) return;
      const result = await checkForUpdate();
      if (!alive) return;
      if (!result.localVersion) {
        const remote = await fetchRemoteVersion();
        if (remote && alive) {
          setInstalledVersion(remote.version);
          setLocalVersion(remote.version);
          warmAppCache(remote.version, [...CORE_ROUTES, location.pathname + location.search]);
        }
      } else {
        applyVersionResult(result);
        warmAppCache(result.localVersion, [...CORE_ROUTES, location.pathname + location.search]);
      }
      if (registration.waiting) setWaitingWorker(registration.waiting);
    })();

    unsubscribe = onSWUpdate((event: SWUpdateEvent) => {
      if (!alive) return;
      if (event.type === "waiting" || event.type === "update-available") {
        setWaitingWorker(event.worker);
        // A changed worker means a new immutable asset graph exists even if a
        // release version was not manually changed.
        setShowUpdate(true);
        checkForUpdate().then((result) => alive && applyVersionResult(result));
      } else if (event.type === "controller-change" && !reloading.current) {
        reloading.current = true;
        location.reload();
      }
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [applyVersionResult]);

  useEffect(() => {
    const onFocus = () =>
      checkForUpdate()
        .then(applyVersionResult)
        .catch(() => undefined);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [applyVersionResult]);

  useEffect(() => {
    const sync = () => {
      if (!navigator.onLine) return;
      syncOfflineChanges()
        .then((count) => {
          if (count > 0) toast.success(`${count} تغییر آفلاین با موفقیت همگام شد`);
        })
        .catch(() => undefined);
    };
    warmOfflineCache().catch(() => undefined);
    sync();
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);

  useEffect(() => {
    if (!shouldShowPrompt) return;
    const timer = window.setTimeout(() => {
      setModalOpen(true);
      trackPWAEvent("pwa_install_shown", { surface: "modal" });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [shouldShowPrompt, trackPWAEvent]);

  useEffect(() => {
    const openInstall = () => {
      setModalOpen(true);
      setBannerDismissed(false);
      trackPWAEvent("pwa_install_shown", { surface: "settings" });
    };
    window.addEventListener(PWA_OPEN_INSTALL_EVENT, openInstall);
    return () => window.removeEventListener(PWA_OPEN_INSTALL_EVENT, openInstall);
  }, [trackPWAEvent]);

  const handleUpdate = useCallback(() => {
    if (remoteVersion) {
      setAcceptedVersion(remoteVersion);
      setInstalledVersion(remoteVersion);
      setDismissedVersion("");
    }
    setShowUpdate(false);
    if (waitingWorker) skipWaiting(waitingWorker);
    else location.reload();
  }, [remoteVersion, waitingWorker]);

  const dismissUpdate = useCallback(() => {
    if (remoteVersion) setDismissedVersion(remoteVersion);
    setShowUpdate(false);
  }, [remoteVersion]);

  const handleInstall = useCallback(async () => {
    const result = await installApp();
    if (result.outcome === "accepted") {
      toast.success(`${brandText("name", "fa")} با موفقیت نصب شد`);
      setModalOpen(false);
    } else if (result.outcome === "dismissed") {
      dismissInstall();
      setModalOpen(false);
      setBannerDismissed(true);
    } else if (result.outcome === "ios-instructions") {
      setModalOpen(true);
    }
  }, [dismissInstall, installApp]);

  const dismissInstallUI = useCallback(() => {
    dismissInstall();
    setModalOpen(false);
    setBannerDismissed(true);
  }, [dismissInstall]);

  return (
    <>
      <PWAUpdateBanner
        visible={showUpdate}
        currentVersion={localVersion}
        nextVersion={remoteVersion}
        onUpdate={handleUpdate}
        onDismiss={dismissUpdate}
      />
      <PWAInstallModal
        open={modalOpen}
        canInstall={canInstall}
        installing={isInstalling}
        isAndroid={isAndroid}
        isIOS={isIOS}
        onInstall={handleInstall}
        onDismiss={dismissInstallUI}
        onOpenChange={setModalOpen}
      />
      <PWAInstallBanner
        visible={canInstall && isMobile && !modalOpen && !bannerDismissed && !showUpdate}
        onInstall={() => {
          setModalOpen(true);
          trackPWAEvent("pwa_install_shown", { surface: "banner" });
        }}
        onDismiss={dismissInstallUI}
      />
    </>
  );
}
