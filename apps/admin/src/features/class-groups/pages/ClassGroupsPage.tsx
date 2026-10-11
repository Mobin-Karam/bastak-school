import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers3, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useAuth } from "../../auth";
import { useLocale } from "../../../shared/ui/locale";
import { Button, Card, EmptyState, Field, Input, Select, Textarea } from "../../../shared/ui/ui";
import { ResponsiveDrawer } from "../../../shared/ui/responsive-drawer";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import {
  createClassGroup,
  updateClassGroup,
  deleteClassGroup,
  listClassGroups,
  listGroupClasses,
  listGroupMembers,
  listGroupStudents,
  setGroupMembers,
  type ClassGroupSummary,
} from "../api/class-groups.api";

const errorMessage = (error: unknown, fa: boolean) =>
  error instanceof Error
    ? error.message
    : fa
      ? "عملیات انجام نشد. دوباره تلاش کنید."
      : "Could not complete the request. Try again.";

export function ClassGroupsPage() {
  const auth = useAuth();
  return (
    <ClassGroupsWorkspace
      key={`${auth.context?.user?.id}:${auth.activeRole}:${auth.context?.activeOrganization?.id}`}
    />
  );
}
function ClassGroupsWorkspace() {
  const auth = useAuth();
  const { language, profile } = useLocale();
  const fa = language === "fa";
  const modal = useModal();
  const qc = useQueryClient();
  const canManage = auth.can("class_groups.manage");
  const organizationId = auth.context?.activeOrganization?.id;
  const scope = [auth.context?.user?.id, auth.activeRole, organizationId];
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [drawerGroup, setDrawerGroup] = useState<ClassGroupSummary | null>(null);
  const [deletingId, setDeletingId] = useState("");
  const classes = useQuery({
    queryKey: ["class-group-classes", ...scope],
    queryFn: () => listGroupClasses(organizationId),
    enabled: auth.can("class_groups.read"),
  });
  const classroom =
    classes.data?.find((item) => item.id === classId) ??
    classes.data?.find((item) => item.status === "ACTIVE") ??
    classes.data?.[0];
  const groups = useQuery({
    queryKey: ["class-groups", ...scope, classroom?.id],
    queryFn: () => listClassGroups(classroom!.id, classroom!.organizationId),
    enabled: Boolean(classroom),
  });
  const filtered = (groups.data ?? []).filter((group) =>
    `${group.name} ${group.code} ${group.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["class-groups"] });
    await qc.invalidateQueries({ queryKey: ["attendance-contexts"] });
  };
  const openEditor = (group?: ClassGroupSummary) => {
    if (!classroom || !canManage) return;
    modal.open({
      title: group
        ? fa
          ? "ویرایش گروه"
          : "Edit group"
        : fa
          ? "ساخت گروه کلاس"
          : "Create class group",
      description: classroom.name,
      size: "md",
      content: (
        <GroupEditor
          group={group}
          classId={classroom.id}
          onSaved={async () => {
            modal.close();
            await refresh();
          }}
        />
      ),
    });
  };
  const remove = async (group: ClassGroupSummary) => {
    if (!canManage || deletingId) return;
    const confirmed = await modal.confirm({
      title: fa ? "حذف گروه کلاس" : "Delete class group",
      description: fa
        ? `گروه «${group.name}» و عضویت‌های آن حذف می‌شود. خود کلاس و حساب دانش‌آموزان حذف نمی‌شوند.`
        : `Delete “${group.name}” and its memberships. The class and student accounts remain available.`,
      confirmLabel: fa ? "حذف گروه" : "Delete group",
      cancelLabel: fa ? "انصراف" : "Cancel",
      confirmationText: group.name,
      tone: "danger",
      showCancel: true,
    });
    if (!confirmed) return;
    setDeletingId(group.id);
    try {
      await deleteClassGroup(group.id);
      await refresh();
      notify(fa ? "گروه حذف شد." : "Group deleted.");
    } catch (reason) {
      notify(errorMessage(reason, fa), "error");
    } finally {
      setDeletingId("");
    }
  };
  return (
    <section className="grid gap-5" dir={profile.direction}>
      <ManagementPageHeader
        title={fa ? "گروه‌های کلاس" : "Class groups"}
        description={
          fa
            ? "کلاس را انتخاب کنید، گروه بسازید و فقط دانش‌آموزان همان کلاس را به گروه اضافه کنید."
            : "Choose a class, create a group, and add students already enrolled in that class."
        }
        action={
          canManage ? (
            <Button
              disabled={!classroom || classroom.status !== "ACTIVE"}
              onClick={() => openEditor()}
            >
              <Plus size={16} />
              {fa ? "ساخت گروه" : "Create group"}
            </Button>
          ) : undefined
        }
      />
      <ol
        aria-label={fa ? "مراحل مدیریت گروه" : "Group management steps"}
        className="grid gap-2 sm:grid-cols-3"
      >
        {(fa
          ? ["۱. انتخاب کلاس", "۲. ساخت یا انتخاب گروه", "۳. انتخاب و ذخیره اعضا"]
          : ["1. Choose a class", "2. Create or choose a group", "3. Choose and save members"]
        ).map((title, index) => (
          <li
            key={title}
            aria-current={
              drawerGroup && index === 2
                ? "step"
                : !drawerGroup && classroom && index === 1
                  ? "step"
                  : !classroom && index === 0
                    ? "step"
                    : undefined
            }
            className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-4 py-3 text-xs font-bold text-slate-500"
          >
            {title}
          </li>
        ))}
      </ol>
      <Card className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Field label={fa ? "کلاس" : "Class"}>
          <Select
            value={classroom?.id ?? ""}
            disabled={classes.isLoading || Boolean(drawerGroup)}
            onChange={(event) => {
              setClassId(event.target.value);
              setSearch("");
            }}
          >
            <option value="" disabled>
              {fa ? "انتخاب کلاس" : "Choose class"}
            </option>
            {classes.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.code} · {item.organizationName}
                {item.status !== "ACTIVE" ? (fa ? " (بایگانی)" : " (archived)") : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={fa ? "جستجوی گروه‌ها" : "Search groups"}>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={fa ? "نام، کد یا توضیحات گروه" : "Group name, code, or description"}
            disabled={!classroom}
          />
        </Field>
      </Card>
      {classes.isLoading ? (
        <Loading fa={fa} />
      ) : classes.isError ? (
        <LoadError fa={fa} onRetry={() => void classes.refetch()} />
      ) : !classroom ? (
        <EmptyState
          title={fa ? "کلاسی در دسترس نیست." : "No classes available."}
          description={
            fa
              ? "ابتدا یک کلاس بسازید یا از مدیر مدرسه بخواهید کلاس را به شما واگذار کند."
              : "Create a class or ask your school administrator to assign one to you."
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [fa ? "دانش‌آموزان کلاس" : "Class students", classroom.enrollmentCount],
              [fa ? "تعداد گروه‌ها" : "Groups", groups.data?.length],
              [
                fa ? "عضویت‌های گروهی" : "Group memberships",
                groups.data?.reduce((sum, group) => sum + group.memberCount, 0),
              ],
            ].map(([label, value]) => (
              <Card key={label} className="p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black">
                  {typeof value === "number" ? value.toLocaleString(profile.locale) : "—"}
                </p>
              </Card>
            ))}
          </div>
          {classroom.status !== "ACTIVE" ? (
            <p
              role="status"
              className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            >
              {fa
                ? "این کلاس بایگانی شده است؛ فقط مشاهده اعضا امکان‌پذیر است."
                : "This class is archived. Memberships are read-only."}
            </p>
          ) : null}
          {groups.isLoading ? (
            <Loading fa={fa} />
          ) : groups.isError ? (
            <LoadError fa={fa} onRetry={() => void groups.refetch()} />
          ) : !filtered.length ? (
            <EmptyState
              title={
                search
                  ? fa
                    ? "گروهی با این جستجو پیدا نشد."
                    : "No matching groups."
                  : fa
                    ? "این کلاس هنوز گروهی ندارد."
                    : "This class has no groups yet."
              }
              action={
                search ? (
                  <Button variant="soft" onClick={() => setSearch("")}>
                    {fa ? "پاک کردن جستجو" : "Clear search"}
                  </Button>
                ) : canManage && classroom.status === "ACTIVE" ? (
                  <Button onClick={() => openEditor()}>
                    {fa ? "ساخت نخستین گروه" : "Create the first group"}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((group) => (
                <Card key={group.id} className="flex min-w-0 flex-col gap-3 p-5">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-brand/10 p-2 text-brand">
                      <Layers3 size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="break-words font-black">{group.name}</h2>
                      <p className="mt-1 break-words text-xs text-slate-500">{group.code}</p>
                    </div>
                  </div>
                  <p className="break-words text-sm leading-6 text-slate-500">
                    {group.description || (fa ? "بدون توضیحات" : "No description")}
                  </p>
                  <p className="text-sm font-bold">
                    {group.memberCount.toLocaleString(profile.locale)} {fa ? "عضو" : "members"}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button
                      variant="soft"
                      size="sm"
                      aria-label={fa ? `اعضای ${group.name}` : `Members of ${group.name}`}
                      disabled={Boolean(deletingId)}
                      onClick={() => setDrawerGroup(group)}
                    >
                      <Users size={16} />
                      {canManage && classroom.status === "ACTIVE" && group.status === "ACTIVE"
                        ? fa
                          ? "مدیریت اعضا"
                          : "Manage members"
                        : fa
                          ? "مشاهده اعضا"
                          : "View members"}
                    </Button>
                    {canManage && classroom.status === "ACTIVE" && group.status === "ACTIVE" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={fa ? `ویرایش ${group.name}` : `Edit ${group.name}`}
                          onClick={() => openEditor(group)}
                          disabled={Boolean(deletingId)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={fa ? `حذف ${group.name}` : `Delete ${group.name}`}
                          loading={deletingId === group.id}
                          disabled={Boolean(deletingId)}
                          onClick={() => void remove(group)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      {drawerGroup ? (
        <GroupMembers
          key={drawerGroup.id}
          group={drawerGroup}
          editable={canManage && classroom?.status === "ACTIVE" && drawerGroup.status === "ACTIVE"}
          scope={scope}
          onClose={() => setDrawerGroup(null)}
          onSaved={refresh}
        />
      ) : null}
    </section>
  );
}

function GroupEditor({
  group,
  classId,
  onSaved,
}: {
  group?: ClassGroupSummary;
  classId: string;
  onSaved: () => Promise<void>;
}) {
  const { language } = useLocale();
  const fa = language === "fa";
  const modal = useModal();
  const [name, setName] = useState(group?.name ?? "");
  const [code, setCode] = useState(group?.code ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        try {
          const body = { name: name.trim(), code: code.trim(), description: description.trim() };
          if (group) await updateClassGroup(group.id, body);
          else await createClassGroup({ ...body, classId });
          notify(fa ? "گروه ذخیره شد." : "Group saved.");
          await onSaved();
        } catch (reason) {
          setError(errorMessage(reason, fa));
        } finally {
          setPending(false);
        }
      }}
    >
      <fieldset disabled={pending} className="grid min-w-0 gap-3">
        <Field label={fa ? "نام گروه" : "Group name"}>
          <Input
            required
            autoFocus
            maxLength={160}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field
          label={fa ? "کد گروه" : "Group code"}
          description={
            fa
              ? "کد باید در مدرسه یکتا باشد؛ حروف بزرگ و کوچک یکسان در نظر گرفته می‌شوند."
              : "The code must be unique within the school; letter case is ignored."
          }
        >
          <Input
            required
            maxLength={80}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </Field>
        <Field label={fa ? "توضیحات" : "Description"}>
          <Textarea
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="soft" disabled={pending} onClick={modal.close}>
          {fa ? "انصراف" : "Cancel"}
        </Button>
        <Button loading={pending} disabled={!name.trim() || !code.trim()}>
          {fa ? "ذخیره گروه" : "Save group"}
        </Button>
      </div>
    </form>
  );
}
function GroupMembers({
  group,
  editable,
  scope,
  onClose,
  onSaved,
}: {
  group: ClassGroupSummary;
  editable: boolean;
  scope: (string | null | undefined)[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { language, profile } = useLocale();
  const fa = language === "fa";
  const members = useQuery({
    queryKey: ["class-groups", "members", ...scope, group.id],
    queryFn: () => listGroupMembers(group.id),
  });
  const candidates = useQuery({
    queryKey: ["class-group-students", ...scope, group.classId],
    queryFn: () => listGroupStudents(group.classId!),
    enabled: editable && Boolean(group.classId),
  });
  const [draft, setDraft] = useState<string[] | null>(null);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const original = members.data?.map((item) => item.id) ?? [];
  const selected = draft ?? original;
  const dirty =
    selected.length !== original.length || selected.some((id) => !original.includes(id));
  const ready = members.isSuccess && (!editable || candidates.isSuccess);
  const options = editable ? (candidates.data ?? []) : (members.data ?? []);
  const filtered = options.filter((item) =>
    item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const outdated =
    editable && candidates.isSuccess
      ? selected.filter((id) => !options.some((item) => item.id === id))
      : [];
  return (
    <ResponsiveDrawer
      open
      onOpenChange={(open) => {
        if (open || pending) return;
        if (dirty) setDiscard(true);
        else onClose();
      }}
      title={fa ? `اعضای ${group.name}` : `Members of ${group.name}`}
      description={
        fa
          ? "فقط دانش‌آموزان ثبت‌شده در کلاس می‌توانند عضو این گروه باشند. تغییرات پس از ذخیره اعمال می‌شوند."
          : "Only enrolled class students can join this group. Changes apply when saved."
      }
      className="md:w-[min(48rem,94vw)]"
    >
      {members.isLoading || (editable && candidates.isLoading) ? (
        <Loading fa={fa} />
      ) : members.isError || (editable && candidates.isError) ? (
        <LoadError
          fa={fa}
          onRetry={() => {
            if (members.isError) void members.refetch();
            if (candidates.isError) void candidates.refetch();
          }}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p role="status" className="text-sm font-bold">
              {selected.length.toLocaleString(profile.locale)}{" "}
              {fa ? "عضو انتخاب‌شده" : "selected members"}
            </p>
            {editable ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="soft"
                  disabled={pending || !ready}
                  onClick={() => setDraft(options.map((item) => item.id))}
                >
                  {fa ? "انتخاب همه کلاس" : "Select all class students"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending || !ready}
                  onClick={() => setDraft([])}
                >
                  {fa ? "لغو انتخاب همه" : "Clear selection"}
                </Button>
              </div>
            ) : null}
          </div>
          <Field label={fa ? "جستجوی دانش‌آموز" : "Search students"}>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} />
          </Field>
          {outdated.length ? (
            <div
              role="alert"
              className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            >
              <p>
                {fa
                  ? "برخی اعضای قبلی دیگر در کلاس ثبت‌نام نیستند. آن‌ها را از گروه حذف کنید."
                  : "Some existing members are no longer enrolled in the class. Remove these memberships before saving."}
              </p>
              <Button
                variant="soft"
                size="sm"
                disabled={pending}
                onClick={() => setDraft(selected.filter((id) => !outdated.includes(id)))}
              >
                {fa ? "حذف اعضای خارج از کلاس" : "Remove unenrolled members"}
              </Button>
            </div>
          ) : null}
          <fieldset disabled={pending || !ready} className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
            <legend className="sr-only">{fa ? "دانش‌آموزان کلاس" : "Class students"}</legend>
            {filtered.map((student) => (
              <label
                key={student.id}
                className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${selected.includes(student.id) ? "border-brand bg-brand/5" : "border-[rgb(var(--border-subtle))]"}`}
              >
                {editable ? (
                  <input
                    type="checkbox"
                    checked={selected.includes(student.id)}
                    onChange={(event) =>
                      setDraft(
                        event.target.checked
                          ? [...selected, student.id]
                          : selected.filter((id) => id !== student.id),
                      )
                    }
                  />
                ) : (
                  <Users size={16} aria-hidden="true" />
                )}
                <span className="break-words font-medium">{student.name}</span>
              </label>
            ))}
          </fieldset>
          {!filtered.length ? (
            <div className="mt-4">
              <EmptyState
                title={
                  search
                    ? fa
                      ? "دانش‌آموزی یافت نشد."
                      : "No matching students."
                    : editable
                      ? fa
                        ? "این کلاس دانش‌آموز ثبت‌شده ندارد."
                        : "This class has no enrolled students."
                      : fa
                        ? "این گروه هنوز عضوی ندارد."
                        : "This group has no members."
                }
              />
            </div>
          ) : null}
        </>
      )}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-rose-600">
          {error}
        </p>
      ) : null}
      {discard ? (
        <div role="alert" className="mt-4 rounded-xl border border-amber-300 p-3">
          <p className="text-sm">
            {fa
              ? "تغییرات ذخیره نشده‌اند. کنار گذاشته شوند؟"
              : "You have unsaved changes. Discard them?"}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="danger" onClick={onClose}>
              {fa ? "کنار گذاشتن تغییرات" : "Discard changes"}
            </Button>
            <Button variant="soft" onClick={() => setDiscard(false)}>
              {fa ? "ادامه ویرایش" : "Keep editing"}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="sticky bottom-0 mt-5 flex flex-wrap justify-end gap-2 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] pt-3">
        <Button
          variant="soft"
          disabled={pending}
          onClick={() => {
            if (dirty) setDiscard(true);
            else onClose();
          }}
        >
          {fa ? "بستن" : "Close"}
        </Button>
        {editable ? (
          <Button
            loading={pending}
            disabled={!ready || !dirty || Boolean(outdated.length)}
            onClick={async () => {
              setPending(true);
              setError("");
              try {
                await setGroupMembers(group.id, selected);
                await onSaved();
                notify(fa ? "اعضای گروه ذخیره شدند." : "Group members saved.");
                onClose();
              } catch (reason) {
                setError(errorMessage(reason, fa));
              } finally {
                setPending(false);
              }
            }}
          >
            {fa ? "ذخیره اعضا" : "Save members"}
          </Button>
        ) : null}
      </div>
    </ResponsiveDrawer>
  );
}
function Loading({ fa }: { fa: boolean }) {
  return (
    <div role="status" className="rounded-xl bg-brand/5 p-5 text-sm">
      {fa ? "در حال دریافت اطلاعات…" : "Loading…"}
    </div>
  );
}
function LoadError({ fa, onRetry }: { fa: boolean; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="grid justify-items-start gap-3 rounded-xl border border-rose-200 p-4 text-sm text-rose-700 dark:border-rose-800 dark:text-rose-300"
    >
      <p>
        {fa
          ? "دریافت اطلاعات انجام نشد. اطلاعات فعلی قابل ذخیره نیست."
          : "Could not load data. Changes cannot be saved until loading succeeds."}
      </p>
      <Button variant="soft" onClick={onRetry}>
        {fa ? "تلاش دوباره" : "Retry"}
      </Button>
    </div>
  );
}
