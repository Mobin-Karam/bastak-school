import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Headphones, PlayCircle, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../../identity/auth";
import { Button, Card, EmptyState, Input, LoadingState, Textarea } from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { useFloatingIsland } from "../../../shared/ui/floating-island";
import {
  createAnnouncement,
  listAnnouncementRecipients,
  listAnnouncements,
  type SchoolAnnouncement,
} from "../../analytics/school-home/api/school-home.api";

function Media({ item }: { item: SchoolAnnouncement }) {
  const island = useFloatingIsland();
  if (!item.mediaUrl) return null;
  if (item.mediaType === "AUDIO") {
    return (
      <Button
        className="mt-3"
        onClick={() => {
          island.show({
            id: `audio:${item.id}`,
            kind: "audio",
            priority: 100,
            title: item.title,
            description: item.category,
            audioSrc: item.mediaUrl ?? undefined,
            dismissible: true,
          });
          island.expand(`audio:${item.id}`);
        }}
      >
        <Headphones size={16} /> پخش در برنامه
      </Button>
    );
  }
  const url = item.mediaUrl
    .replace("youtu.be/", "www.youtube.com/embed/")
    .replace("watch?v=", "embed/");
  return (
    <iframe
      className="mt-3 aspect-video w-full rounded-xl border"
      src={url}
      title={item.title}
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  );
}

export function AnnouncementInboxPage() {
  const auth = useAuth();
  const organizationId = auth.context?.activeOrganization?.id;
  const notices = useQuery({
    queryKey: ["announcements", organizationId],
    queryFn: () => listAnnouncements(organizationId),
    enabled: Boolean(organizationId) && auth.can("announcements.read"),
  });
  if (notices.isLoading) return <LoadingState label="در حال دریافت رسانه‌های شما…" />;
  const items = notices.data ?? [];
  return (
    <main className="mx-auto grid w-full max-w-4xl gap-4" dir="rtl">
      <header>
        <h1 className="text-xl font-black text-ink">رسانه‌ها و اطلاعیه‌های من</h1>
        <p className="mt-1 text-sm text-slate-500">
          فقط رسانه‌هایی که برای شما منتشر شده‌اند نمایش داده می‌شوند.
        </p>
      </header>
      {items.length ? (
        items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-brand/10 p-2 text-brand">
                {item.mediaType === "AUDIO" ? <Headphones size={20} /> : <PlayCircle size={20} />}
              </span>
              <div>
                <p className="text-xs font-bold text-brand">{item.category}</p>
                <h2 className="font-black text-ink">{item.title}</h2>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
              {item.body}
            </p>
            <Media item={item} />
            {item.linkUrl ? (
              <a
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand"
                href={item.linkUrl}
                target="_blank"
                rel="noreferrer"
              >
                باز کردن پیوند <ExternalLink size={15} />
              </a>
            ) : null}
          </Card>
        ))
      ) : (
        <EmptyState
          title="رسانه‌ای برای شما وجود ندارد."
          description="رسانه‌های جدید اینجا نمایش داده می‌شوند."
        />
      )}
    </main>
  );
}

export function AnnouncementManagementPage() {
  const auth = useAuth();
  const client = useQueryClient();
  const organizationId = auth.context?.activeOrganization?.id ?? "";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "عمومی",
    linkUrl: "",
    mediaUrl: "",
    mediaType: "VIDEO" as "VIDEO" | "AUDIO",
  });
  const recipients = useQuery({
    queryKey: ["announcement-recipients", organizationId, query],
    queryFn: () => listAnnouncementRecipients(organizationId, query),
    enabled: Boolean(organizationId),
  });
  const publish = useMutation({
    mutationFn: () =>
      createAnnouncement(organizationId, {
        ...form,
        linkUrl: form.linkUrl || null,
        mediaUrl: form.mediaUrl || null,
        mediaType: form.mediaUrl ? form.mediaType : null,
        audience: "USERS",
        recipientIds: selected,
        status: "ACTIVE",
      }),
    onSuccess: () => {
      setForm({
        title: "",
        body: "",
        category: "عمومی",
        linkUrl: "",
        mediaUrl: "",
        mediaType: "VIDEO",
      });
      setSelected([]);
      void client.invalidateQueries({ queryKey: ["announcements"] });
      notify("رسانه برای دریافت‌کنندگان انتخاب‌شده منتشر شد.", "success");
    },
    onError: () => notify("انتشار انجام نشد. نشانی و دریافت‌کنندگان را بررسی کنید.", "error"),
  });
  const eligible = useMemo(() => recipients.data ?? [], [recipients.data]);
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-4" dir="rtl">
      <header>
        <h1 className="text-xl font-black text-ink">مدیریت رسانه‌های هدفمند</h1>
        <p className="mt-1 text-sm text-slate-500">
          رسانه فقط برای اعضای انتخاب‌شده در مدرسه فعال منتشر می‌شود.
        </p>
      </header>
      <Card className="grid gap-3 p-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <Input
            placeholder="عنوان"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            placeholder="دسته‌بندی، مانند آموزشی"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Textarea
            placeholder="متن اطلاعیه"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
          <Input
            placeholder="پیوند HTTPS اختیاری"
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
          />
          <Input
            placeholder="نشانی ویدئو YouTube/Aparat یا صوت HTTPS"
            value={form.mediaUrl}
            onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
          />
          <select
            className="h-10 rounded-lg border bg-[rgb(var(--surface-card))] px-3"
            value={form.mediaType}
            onChange={(e) => setForm({ ...form, mediaType: e.target.value as "VIDEO" | "AUDIO" })}
          >
            <option value="VIDEO">ویدئو</option>
            <option value="AUDIO">صوت</option>
          </select>
        </div>
        <div>
          <Input
            placeholder="جستجوی نام یا نام کاربری"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mt-3 max-h-72 overflow-auto rounded-xl border p-2">
            {eligible.map((member) => (
              <label
                key={member.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-black/5"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(member.id)}
                  onChange={() =>
                    setSelected((current) =>
                      current.includes(member.id)
                        ? current.filter((id) => id !== member.id)
                        : [...current, member.id],
                    )
                  }
                />
                <span>
                  {member.name} <small className="text-slate-500">@{member.username}</small>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {selected.length.toLocaleString("fa-IR")} دریافت‌کننده انتخاب شده
          </p>
        </div>
        <Button
          className="lg:col-span-2"
          disabled={!form.title.trim() || !form.body.trim() || !selected.length}
          loading={publish.isPending}
          onClick={() => publish.mutate()}
        >
          <Send size={16} /> انتشار هدفمند
        </Button>
      </Card>
    </main>
  );
}
