// src/pages/student/chat/components/MessageSearchBar.tsx
import { Search, X } from "lucide-react";

interface MessageSearchBarProps {
  value: string;
  onChange(value: string): void;
  onClose(): void;
}

export function MessageSearchBar({
  value,
  onChange,
  onClose,
}: MessageSearchBarProps) {
  return (
    <div className="student-chat__search">
      <Search />
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="جست‌وجو در پیام‌ها"
        aria-label="جست‌وجو در پیام‌ها"
      />
      <button type="button" onClick={onClose} aria-label="بستن جست‌وجو">
        <X />
      </button>
    </div>
  );
}
