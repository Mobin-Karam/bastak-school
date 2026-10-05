"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "zanin:pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);
    setIsMobile(window.matchMedia("(max-width: 767px), (pointer: coarse)").matches);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) setDismissed(Date.now() - Number(raw) < DISMISS_DAYS * 86400000);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setDeferredPrompt(null); localStorage.removeItem(DISMISS_KEY); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismissInstall = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }, []);

  const installApp = useCallback(async () => {
    if (isIOS && !deferredPrompt) return { outcome: "ios-instructions" as const };
    if (!deferredPrompt) return { outcome: "unavailable" as const };
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setDeferredPrompt(null);
    return { outcome: choice.outcome };
  }, [deferredPrompt, isIOS]);

  const trackPWAEvent = useCallback((name: string, detail?: Record<string, unknown>) => {
    window.dispatchEvent(new CustomEvent("zanin:pwa", { detail: { name, ...detail } }));
  }, []);

  return {
    canInstall: Boolean(deferredPrompt) || (isIOS && !installed),
    dismissInstall,
    installApp,
    isIOS,
    isMobile,
    isInstalled: installed,
    shouldShowPrompt: !installed && !dismissed && (Boolean(deferredPrompt) || isIOS),
    trackPWAEvent,
  };
}
