// src/pages/student/chat/components/PeerProfileDialog.tsx
import { X } from "lucide-react";
import { initials } from "../lib/chat-format";
import type { ConversationParticipant } from "../model/types";

interface PeerProfileDialogProps {
  profile: ConversationParticipant;
  onClose(): void;
}

export function PeerProfileDialog({ profile, onClose }: PeerProfileDialogProps) {
  const name = profile.displayName || profile.name || profile.username;

  return (
    <div
      className="student-chat-profile"
      role="dialog"
      aria-modal="true"
      aria-label={`پروفایل ${name || "کاربر"}`}
    >
      <button
        type="button"
        className="student-chat-profile__backdrop"
        onClick={onClose}
        aria-label="بستن پروفایل"
      />
      <article>
        <button type="button" onClick={onClose} aria-label="بستن">
          <X />
        </button>
        <span>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" />
          ) : (
            initials(name)
          )}
        </span>
        <h2>{name}</h2>
        <b dir="ltr">@{profile.username}</b>
        {profile.bio ? (
          <p>{profile.bio}</p>
        ) : (
          <p>اطلاعات بیشتری ثبت نشده است.</p>
        )}
      </article>
    </div>
  );
}