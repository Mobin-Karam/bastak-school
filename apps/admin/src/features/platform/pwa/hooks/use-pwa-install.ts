"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "zanin:pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const prompting = useRef(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);
    setIsMobile(window.matchMedia("(max-width: 767px), (pointer: coarse)").matches);
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
    setIsAndroid(/Android/i.test(navigator.userAgent));

    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) setDismissed(Date.now() - Number(raw) < DISMISS_DAYS * 86400000);

    const onBeforeInstall = (event: Event) => {
      // We intentionally replace Chromium's automatic banner with Zanin's
      // install sheet. The stored event must be prompted from a user gesture.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
    };
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
    const prompt = deferredPrompt;
    if (!prompt || prompting.current) return { outcome: "unavailable" as const };

    prompting.current = true;
    setInstalling(true);
    try {
      // `prompt()` can only be used once, so consume this event for both an
      // accepted and dismissed choice. A future browser event will replace it.
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setDeferredPrompt((current) => (current === prompt ? null : current));
      return { outcome: choice.outcome };
    } catch {
      setDeferredPrompt((current) => (current === prompt ? null : current));
      return { outcome: "unavailable" as const };
    } finally {
      prompting.current = false;
      setInstalling(false);
    }
  }, [deferredPrompt, isIOS]);

  const trackPWAEvent = useCallback((name: string, detail?: Record<string, unknown>) => {
    window.dispatchEvent(new CustomEvent("zanin:pwa", { detail: { name, ...detail } }));
  }, []);

  return {
    canInstall: Boolean(deferredPrompt) || (isIOS && !installed),
    dismissInstall,
    installApp,
    isInstalling: installing,
    isIOS,
    isAndroid,
    isMobile,
    isInstalled: installed,
    // The welcome modal can explain installation before Chromium emits its
    // deferred prompt; its primary action is enabled as soon as the browser
    // makes installation available.
    shouldShowPrompt: !installed && !dismissed,
    trackPWAEvent,
  };
}
