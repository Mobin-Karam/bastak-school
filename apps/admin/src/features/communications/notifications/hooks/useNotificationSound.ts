import { useCallback, useRef } from "react";
import { useStoredBoolean } from "./useStoredBoolean";

// The original 0.12 peak was barely audible on common laptop/mobile output.
const NOTIFICATION_SOUND_GAIN = 0.12 * 20;

export function useNotificationSound() {
  const [soundEnabled, setSoundEnabled] = useStoredBoolean("admin-notification-sound", true);

  const [chatSoundEnabled, setChatSoundEnabled] = useStoredBoolean("admin-chat-sound", true);

  const lastSoundAt = useRef(0);

  const playSound = useCallback(
    (chat = false) => {
      if (chat ? !chatSoundEnabled : !soundEnabled) {
        return;
      }

      if (typeof window === "undefined") {
        return;
      }

      const now = Date.now();
      if (now - lastSoundAt.current < 500) {
        return;
      }

      lastSoundAt.current = now;

      try {
        const AudioContextClass =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;

        if (!AudioContextClass) {
          return;
        }

        const context = new AudioContextClass();
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = chat ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(chat ? 720 : 659.25, context.currentTime);
        if (chat) {
          oscillator.frequency.exponentialRampToValueAtTime(920, context.currentTime + 0.12);
        } else {
          // A two-note E5 → A5 chime makes inbox alerts distinct from chat messages.
          oscillator.frequency.setValueAtTime(880, context.currentTime + 0.11);
        }

        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(NOTIFICATION_SOUND_GAIN, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);

        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.24);

        oscillator.onended = () => {
          void context.close().catch(() => undefined);
        };
      } catch {
        // Sound is optional and browser autoplay policies may reject it.
      }
    },
    [chatSoundEnabled, soundEnabled],
  );

  return {
    soundEnabled,
    chatSoundEnabled,
    setSoundEnabled,
    setChatSoundEnabled,
    playSound,
  };
}
