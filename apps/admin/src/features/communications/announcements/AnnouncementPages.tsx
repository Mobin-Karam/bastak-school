import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ExternalLink, Headphones, PlayCircle, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../identity/auth";
import { roleLabel } from "../../../shared/lib/role-ui";
import { AdminList } from "../../../shared/ui/admin-list";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { useLocale } from "../../../shared/ui/locale";
import { useAdminNotifications } from "../notifications/hooks/useAdminNotifications";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Textarea,
  Badge,
} from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { useFloatingIsland } from "../../../shared/ui/floating-island";
import {
  createAnnouncement,
  listAnnouncementMedia,
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
  // Kept as a compatibility route for saved links. Announcements are delivered
  // as first-class notifications, so every recipient has one inbox.
  const [params] = useSearchParams();
  const announcementId = params.get("announcementId");
  return (
    <Navigate
      replace
      to={`/admin/communication/notifications?type=announcement${announcementId ? `&announcementId=${encodeURIComponent(announcementId)}` : ""}`}
    />
  );
}

export function LegacyAnnouncementInboxPage() {
  const auth = useAuth();
  const { formatDateTime, language } = useLocale();
  const notifications = useAdminNotifications();
  const { items: notificationItems, markRead: markNotificationRead } = notifications;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const organizationId = auth.context?.activeOrganization?.id;
  const announcementId = params.get("announcementId") || "";
  const [search, setSearch] = useState("");
  const notices = useQuery({
    queryKey: ["announcements", organizationId],
    queryFn: () => listAnnouncements(organizationId),
    enabled: Boolean(organizationId) && auth.can("announcements.read"),
  });
  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(language === "en" ? "en-US" : "fa-IR");
    return (notices.data ?? []).filter(
      (item) =>
        !query ||
        `${item.title} ${item.body} ${item.category}`
          .toLocaleLowerCase(language === "en" ? "en-US" : "fa-IR")
          .includes(query),
    );
  }, [language, notices.data, search]);
  useEffect(() => {
    if (!announcementId) return;
    const notification = notificationItems.find(
      (item) => String(item.data?.announcementId ?? "") === announcementId,
    );
    if (notification && !notification.isRead) markNotificationRead(notification.id);
  }, [announcementId, notificationItems, markNotificationRead]);

  const copy =
    language === "en"
      ? {
          title: "School announcements",
          description: "Messages and media published for your active school.",
          search: "Search announcements",
          placeholder: "Search title, message, or category",
          none: "No announcements for you",
          noMatch: "No announcement matches this search.",
          loadError: "Could not load school announcements.",
          retry: "Try again",
          inbox: "Open notification center",
          read: "Read",
          unread: "Unread",
          openLink: "Open link",
          noOrg: "Select an active school to view announcements.",
        }
      : {
          title: "اطلاعیه‌های مدرسه",
          description: "پیام‌ها و رسانه‌های منتشرشده برای مدرسه فعال شما.",
          search: "جستجوی اطلاعیه‌ها",
          placeholder: "جستجو در عنوان، متن یا دسته‌بندی",
          none: "اطلاعیه‌ای برای شما وجود ندارد",
          noMatch: "اطلاعیه‌ای با این جستجو پیدا نشد.",
          loadError: "دریافت اطلاعیه‌های مدرسه انجام نشد.",
          retry: "تلاش دوباره",
          inbox: "رفتن به مرکز اعلان‌ها",
          read: "خوانده‌شده",
          unread: "خوانده‌نشده",
          openLink: "بازکردن پیوند",
          noOrg: "برای دیدن اطلاعیه‌ها، مدرسه فعال را انتخاب کنید.",
        };
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-4" dir={language === "fa" ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-brand">
            <Bell size={18} />
            <span className="text-xs font-bold">
              {language === "en" ? "COMMUNICATION" : "ارتباطات مدرسه"}
            </span>
          </div>
          <h1 className="mt-1 text-xl font-black text-ink">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <Button variant="soft" onClick={() => navigate("/admin/communication/notifications")}>
          {copy.inbox}
        </Button>
      </header>
      {!organizationId ? (
        <Card className="p-4 text-sm text-muted-foreground">{copy.noOrg}</Card>
      ) : null}
      <AdminList
        label={copy.title}
        description={
          language === "en"
            ? "Published content and its matching personal notification state."
            : "محتوای منتشرشده و وضعیت اعلان شخصی هر مورد."
        }
        items={items}
        loading={notices.isLoading}
        error={notices.isError}
        errorTitle={copy.loadError}
        onRetry={() => void notices.refetch()}
        emptyTitle={search ? copy.noMatch : copy.none}
        className="overflow-hidden"
        toolbar={
          <CollectionToolbar
            search={search}
            onSearchChange={setSearch}
            searchLabel={copy.search}
            placeholder={copy.placeholder}
          />
        }
      >
        {(rows) => (
          <div className="grid gap-3">
            {rows.map((item) => {
              const notice = notificationItems.find(
                (candidate) => String(candidate.data?.announcementId ?? "") === item.id,
              );
              const selected = announcementId === item.id;
              return (
                <Card
                  key={item.id}
                  id={`announcement-${item.id}`}
                  className={`p-4 transition ${selected ? "border-brand ring-2 ring-brand/20" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-brand/10 p-2 text-brand">
                      {item.mediaType === "AUDIO" ? (
                        <Headphones size={20} />
                      ) : (
                        <PlayCircle size={20} />
                      )}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-brand">{item.category}</p>
                      <h2 className="font-black text-ink">{item.title}</h2>
                    </div>
                    {notice ? (
                      <Badge tone={notice.isRead ? "neutral" : "blue"}>
                        {notice.isRead ? copy.read : copy.unread}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {item.body}
                  </p>
                  <Media item={item} />
                  {item.publishedAt ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {language === "en" ? "Published" : "تاریخ انتشار"}:{" "}
                      {formatDateTime(item.publishedAt)}
                    </p>
                  ) : null}
                  {item.linkUrl ? (
                    <a
                      className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand"
                      href={item.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {copy.openLink} <ExternalLink size={15} />
                    </a>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </AdminList>
    </main>
  );
}

export function AnnouncementManagementPage() {
  const auth = useAuth();
  const client = useQueryClient();
  const organizationId = auth.context?.activeOrganization?.id ?? "";
  const { language } = useLocale();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [audienceMode, setAudienceMode] = useState<"ALL" | "ROLES" | "USERS">("USERS");
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
  const mediaLibrary = useQuery({
    queryKey: ["announcement-media", organizationId],
    queryFn: () => listAnnouncementMedia(organizationId),
    enabled: Boolean(organizationId) && auth.can("announcements.manage"),
  });
  const publish = useMutation({
    mutationFn: () =>
      createAnnouncement(organizationId, {
        ...form,
        linkUrl: form.linkUrl || null,
        mediaUrl: form.mediaUrl || null,
        mediaType: form.mediaUrl ? form.mediaType : null,
        audience: audienceMode === "ALL" ? "ALL" : "USERS",
        recipientIds: audienceMode === "USERS" ? selected : [],
        recipientRoleCodes: audienceMode === "ROLES" ? selectedRoles : [],
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
      setSelectedRoles([]);
      setAudienceMode("USERS");
      void client.invalidateQueries({ queryKey: ["announcements"] });
      void client.invalidateQueries({ queryKey: ["announcement-media", organizationId] });
      notify("رسانه برای دریافت‌کنندگان انتخاب‌شده منتشر شد.", "success");
    },
    onError: () => notify("انتشار انجام نشد. نشانی و دریافت‌کنندگان را بررسی کنید.", "error"),
  });
  const eligible = useMemo(() => recipients.data?.members ?? [], [recipients.data]);
  const availableRoles = recipients.data?.roles ?? [];
  const audienceReady =
    audienceMode === "ALL" ||
    (audienceMode === "ROLES" && selectedRoles.length > 0) ||
    (audienceMode === "USERS" && selected.length > 0);
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-4" dir={language === "fa" ? "rtl" : "ltr"}>
      <header>
        <h1 className="text-xl font-black text-ink">
          {language === "en" ? "Announcement composer" : "ساخت و انتشار اطلاعیه"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {language === "en"
            ? "Publish a school message to active members, selected roles, or specific people."
            : "یک پیام مدرسه را برای اعضای فعال، نقش‌های انتخابی یا افراد مشخص منتشر کنید."}
        </p>
      </header>
      {!organizationId ? (
        <Card className="p-3 text-sm text-rose-700">
          {language === "en"
            ? "Select an active school before publishing."
            : "پیش از انتشار، مدرسه فعال را انتخاب کنید."}
        </Card>
      ) : null}
      <Card className="grid gap-3 p-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <Field label={language === "en" ? "Title" : "عنوان"} required>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={language === "en" ? "Announcement title" : "عنوان اطلاعیه"}
            />
          </Field>
          <Field label={language === "en" ? "Category" : "دسته‌بندی"}>
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder={language === "en" ? "For example: Educational" : "برای نمونه: آموزشی"}
            />
          </Field>
          <Field label={language === "en" ? "Message" : "متن اطلاعیه"} required>
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder={
                language === "en"
                  ? "Write a clear message for recipients"
                  : "پیام روشن و کامل برای دریافت‌کنندگان بنویسید"
              }
              rows={5}
            />
          </Field>
          <Field label={language === "en" ? "Link (optional)" : "پیوند (اختیاری)"}>
            <Input
              dir="ltr"
              type="url"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field
            label={
              language === "en" ? "Video or audio URL (optional)" : "نشانی ویدئو یا صوت (اختیاری)"
            }
          >
            <Input
              dir="ltr"
              type="url"
              value={form.mediaUrl}
              onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label={language === "en" ? "Media type" : "نوع رسانه"}>
            <AdaptiveSelect
              className="h-10 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
              value={form.mediaType}
              onChange={(e) => setForm({ ...form, mediaType: e.target.value as "VIDEO" | "AUDIO" })}
            >
              <option value="VIDEO">{language === "en" ? "Video" : "ویدئو"}</option>
              <option value="AUDIO">{language === "en" ? "Audio" : "صوت"}</option>
            </AdaptiveSelect>
          </Field>
          <section
            aria-labelledby="announcement-media-library"
            className="rounded-xl border border-[rgb(var(--border-subtle))] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 id="announcement-media-library" className="text-sm font-black text-ink">
                  {language === "en" ? "Media library" : "کتابخانه رسانه"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {language === "en"
                    ? "Reuse media published in this school."
                    : "رسانه‌های قبلی همین مدرسه را دوباره استفاده کنید."}
                </p>
              </div>
              {form.mediaUrl ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setForm({ ...form, mediaUrl: "" })}
                >
                  {language === "en" ? "Clear" : "پاک کردن"}
                </Button>
              ) : null}
            </div>
            {mediaLibrary.isLoading ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {language === "en" ? "Loading media…" : "در حال دریافت رسانه‌ها…"}
              </p>
            ) : null}
            {mediaLibrary.isError ? (
              <p role="alert" className="mt-2 text-xs text-rose-700">
                {language === "en"
                  ? "Media library could not load."
                  : "دریافت کتابخانه رسانه انجام نشد."}
              </p>
            ) : null}
            {mediaLibrary.data?.length ? (
              <div className="mt-3 grid max-h-44 gap-2 overflow-auto">
                {mediaLibrary.data.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    className={`flex items-center justify-between gap-2 rounded-lg border p-2 text-start text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${form.mediaUrl === asset.mediaUrl ? "border-brand bg-brand/10" : "border-[rgb(var(--border-subtle))]"}`}
                    onClick={() =>
                      setForm({
                        ...form,
                        mediaUrl: asset.mediaUrl ?? "",
                        mediaType: asset.mediaType ?? "VIDEO",
                      })
                    }
                  >
                    <span className="min-w-0 truncate font-bold">{asset.title}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {asset.mediaType === "AUDIO" ? "صوت" : "ویدئو"}
                    </span>
                  </button>
                ))}
              </div>
            ) : !mediaLibrary.isLoading && !mediaLibrary.isError ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {language === "en" ? "No saved media yet." : "هنوز رسانه ذخیره‌شده‌ای ندارید."}
              </p>
            ) : null}
          </section>
        </div>
        <fieldset className="grid gap-3" aria-label="گروه دریافت‌کنندگان">
          <legend className="text-sm font-black text-ink">
            {language === "en" ? "Recipients" : "دریافت‌کنندگان"}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["ALL", language === "en" ? "All active" : "همه اعضای فعال"],
              ["ROLES", language === "en" ? "By role" : "براساس نقش"],
              ["USERS", language === "en" ? "People" : "افراد مشخص"],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-lg border p-2 text-center text-xs font-bold transition ${audienceMode === value ? "border-brand bg-brand/10 text-brand" : "border-[rgb(var(--border-subtle))] text-slate-600"}`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="announcement-audience"
                  value={value}
                  checked={audienceMode === value}
                  onChange={() => setAudienceMode(value as "ALL" | "ROLES" | "USERS")}
                />
                {label}
              </label>
            ))}
          </div>

          {audienceMode === "ALL" ? (
            <p className="rounded-lg bg-brand/10 p-3 text-sm text-brand">
              {language === "en"
                ? "The announcement will be delivered to all active school members."
                : "اطلاعیه برای همه اعضای فعال مدرسه منتشر می‌شود."}
            </p>
          ) : null}

          {audienceMode === "ROLES" ? (
            <div className="grid max-h-60 grid-cols-2 gap-2 overflow-auto rounded-xl border p-2 sm:grid-cols-3">
              {availableRoles.map((role) => (
                <label
                  key={role}
                  className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-black/5"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() =>
                      setSelectedRoles((current) =>
                        current.includes(role)
                          ? current.filter((code) => code !== role)
                          : [...current, role],
                      )
                    }
                  />
                  <span className="text-xs font-bold">{roleLabel(role)}</span>
                </label>
              ))}
              {recipients.isError ? (
                <div className="col-span-full">
                  <ErrorState
                    title={language === "en" ? "Could not load roles." : "دریافت نقش‌ها انجام نشد."}
                    action={
                      <Button variant="soft" onClick={() => void recipients.refetch()}>
                        {language === "en" ? "Retry" : "تلاش دوباره"}
                      </Button>
                    }
                  />
                </div>
              ) : recipients.isLoading ? (
                <div className="col-span-full">
                  <LoadingState
                    label={
                      language === "en" ? "Loading recipients…" : "در حال دریافت دریافت‌کنندگان…"
                    }
                  />
                </div>
              ) : !availableRoles.length ? (
                <div className="col-span-full">
                  <EmptyState
                    title={
                      language === "en"
                        ? "No active roles to select."
                        : "نقش فعالی برای انتخاب وجود ندارد."
                    }
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {audienceMode === "USERS" ? (
            <>
              <Input
                placeholder={
                  language === "en" ? "Search name or username" : "جستجوی نام یا نام کاربری"
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="max-h-56 overflow-auto rounded-xl border p-2">
                {recipients.isError ? (
                  <ErrorState
                    title={
                      language === "en"
                        ? "Could not load recipients."
                        : "دریافت دریافت‌کنندگان انجام نشد."
                    }
                    action={
                      <Button variant="soft" onClick={() => void recipients.refetch()}>
                        {language === "en" ? "Retry" : "تلاش دوباره"}
                      </Button>
                    }
                  />
                ) : recipients.isLoading ? (
                  <LoadingState
                    label={
                      language === "en" ? "Loading recipients…" : "در حال دریافت دریافت‌کنندگان…"
                    }
                  />
                ) : eligible.length ? (
                  eligible.map((member) => (
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
                  ))
                ) : (
                  <EmptyState
                    title={language === "en" ? "No active members found." : "عضو فعالی پیدا نشد."}
                  />
                )}
              </div>
            </>
          ) : null}
          <p className="text-xs text-slate-500">
            {audienceMode === "ROLES"
              ? `${selectedRoles.length.toLocaleString("fa-IR")} نقش انتخاب شده`
              : audienceMode === "USERS"
                ? `${selected.length.toLocaleString("fa-IR")} دریافت‌کننده انتخاب شده`
                : "همه اعضای فعال دریافت‌کننده هستند"}
          </p>
        </fieldset>
        <Button
          className="lg:col-span-2"
          disabled={
            !organizationId ||
            !form.title.trim() ||
            !form.body.trim() ||
            !audienceReady ||
            publish.isPending
          }
          loading={publish.isPending}
          onClick={() => publish.mutate()}
        >
          <Send size={16} /> {language === "en" ? "Publish announcement" : "انتشار اطلاعیه"}
        </Button>
      </Card>
    </main>
  );
}
