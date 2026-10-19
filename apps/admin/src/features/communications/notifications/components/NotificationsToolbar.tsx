import {
  BellRing,
  MessageSquare,
  Settings2,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button, Card } from "../../../../shared/ui/ui";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import { ToggleButton } from "./ToggleButton";
import { useLocale } from "../../../../shared/ui/locale";
import { notificationCopy } from "../model/notification-copy";

export function NotificationsToolbar({
  onOpenSettings,
  studentMobile = false,
  onOpenStudentControls,
}: {
  onOpenSettings: () => void;
  studentMobile?: boolean;
  onOpenStudentControls?: () => void;
}) {
  const notifications = useAdminNotifications();
  const { language } = useLocale();
  const copy = notificationCopy[language];

  if (studentMobile) {
    return (
      <Card className="flex shrink-0 items-center gap-3 p-3 dark:border-slate-800 dark:bg-slate-900">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
          <BellRing size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block text-sm text-ink">{copy.center}</strong>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {notifications.unread.toLocaleString(language === "fa" ? "fa-IR" : "en-US")}{" "}
            {copy.unreadCount}
          </p>
        </div>
        <Button variant="soft" size="sm" onClick={onOpenStudentControls}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          {copy.options}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mobile-notification-toolbar flex shrink-0 flex-wrap items-center gap-2 p-2 sm:gap-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-40 flex-1 items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
          <BellRing size={18} />
        </span>
        <div>
          <strong className="block leading-5 text-slate-900 dark:text-white">
            {notifications.unread.toLocaleString(language === "fa" ? "fa-IR" : "en-US")}
          </strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{copy.unreadCount}</span>
        </div>
      </div>

      <div className="hidden sm:contents">
        <ToggleButton
          active={notifications.soundEnabled}
          onClick={() => {
            const enabled = !notifications.soundEnabled;
            notifications.setSoundEnabled(enabled);
            if (enabled) notifications.testSound(false);
          }}
          icon={notifications.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          label={copy.notificationSound}
        />

        <ToggleButton
          active={notifications.chatSoundEnabled}
          onClick={() => {
            const enabled = !notifications.chatSoundEnabled;
            notifications.setChatSoundEnabled(enabled);
            if (enabled) notifications.testSound(true);
          }}
          icon={<MessageSquare size={16} />}
          label={copy.messageSound}
        />
      </div>

      <Button variant="soft" onClick={onOpenSettings}>
        <Settings2 size={16} />
        {copy.deviceSettings}
      </Button>
    </Card>
  );
}
