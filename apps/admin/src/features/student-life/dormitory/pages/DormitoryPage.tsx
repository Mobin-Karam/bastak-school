import { Building2, Megaphone, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, ErrorState, Field, Input, Textarea } from "../../../../shared/ui/ui";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { SearchBar } from "../../../../shared/ui/mobile";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { useAuth } from "../../../identity/auth";
import { notifications, type PromiseNotificationData } from "../../../../shared/ui/notifications";
import { useOptionalAdminLanguage } from "../../../../shared/ui/locale";
import {
  createDormRoom,
  findDormitoryStudents,
  listAvailableDormStudents,
  listDormAssignments,
  listDormRooms,
  sendDormitoryAnnouncement,
  setDormAssignments,
  type DormAssignment,
  type DormitoryStudent,
  type DormRoom,
} from "../api/dormitory.api";

const emptyRoom = { building: "ساختمان اصلی", floor: 1, code: "", name: "", capacity: 14 };

export function DormitoryPage() {
  const auth = useAuth();
  const scope = `${auth.user?.id ?? "staff"}:${auth.activeRole ?? "none"}:${auth.context?.activeOrganization?.id ?? "all"}`;
  return <DormitoryWorkspace key={scope} />;
}

function DormitoryWorkspace() {
  const auth = useAuth();
  const language = useOptionalAdminLanguage();
  const t = useCallback((fa: string, en: string) => (language === "fa" ? fa : en), [language]);
  const canRead = auth.can("dormitory.read");
  const canManage = auth.can("dormitory.manage");
  const canAnnounce = auth.canAny(["announcements.manage", "dormitory.manage"]);
  const organizationId = auth.context?.activeOrganization?.id || "";
  const [rooms, setRooms] = useState<DormRoom[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [assigned, setAssigned] = useState<DormAssignment[]>([]);
  const [savedAssigned, setSavedAssigned] = useState<DormAssignment[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [residentSearch, setResidentSearch] = useState("");
  const [roomDraft, setRoomDraft] = useState(emptyRoom);
  const [drawer, setDrawer] = useState<"room" | "announcement" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomsVersion, setRoomsVersion] = useState(0);
  const [assignmentsVersion, setAssignmentsVersion] = useState(0);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState("");
  const operationInFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<"ROOM" | "STUDENT">("ROOM");
  const [announcement, setAnnouncement] = useState({ title: "", body: "" });
  const [recipientQuery, setRecipientQuery] = useState("");
  const [results, setResults] = useState<DormitoryStudent[]>([]);
  const [recipient, setRecipient] = useState<DormitoryStudent | null>(null);

  const selected = useMemo(
    () => rooms.find((room) => room.id === selectedId) ?? rooms[0] ?? null,
    [rooms, selectedId],
  );
  const groups = useMemo(
    () =>
      Object.entries(
        rooms.reduce<Record<string, DormRoom[]>>((acc, room) => {
          (acc[room.building || "ساختمان اصلی"] ||= []).push(room);
          return acc;
        }, {}),
      ),
    [rooms],
  );
  const assignedIds = useMemo(() => new Set(assigned.map((item) => item.studentId)), [assigned]);
  const savedAssignedIds = useMemo(
    () => new Set(savedAssigned.map((item) => item.studentId)),
    [savedAssigned],
  );
  const hasResidentChanges =
    assignedIds.size !== savedAssignedIds.size ||
    [...assignedIds].some((studentId) => !savedAssignedIds.has(studentId));
  const visibleStudents = useMemo(() => {
    const query = residentSearch.trim().toLocaleLowerCase("fa-IR");
    return query
      ? students.filter((student) => student.name.toLocaleLowerCase("fa-IR").includes(query))
      : students;
  }, [residentSearch, students]);
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const totalResidents = rooms.reduce((sum, room) => sum + room.studentCount, 0);
  const remainingBeds = selected ? Math.max(0, selected.capacity - assigned.length) : 0;
  const roomRecipientCount = assigned.filter((item) => item.userId).length;

  useEffect(() => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    let alive = true;
    const toastId = `dormitory:rooms-load:${organizationId}`;
    setLoading(true);
    setError("");
    void listDormRooms(organizationId)
      .then((next) => {
        if (!alive) return;
        setRooms(next);
        setSelectedId((id) => (next.some((room) => room.id === id) ? id : next[0]?.id || ""));
        notifications.dismiss(toastId);
      })
      .catch(() => {
        if (!alive) return;
        const message = t("دریافت اتاق‌های خوابگاه انجام نشد.", "Dorm rooms could not be loaded.");
        setError(message);
        notifications.error(message, {
          id: toastId,
          description: t(
            "اتصال را بررسی کنید و دوباره تلاش کنید.",
            "Check your connection and try again.",
          ),
          action: {
            label: t("تلاش دوباره", "Retry"),
            onClick: () => setRoomsVersion((value) => value + 1),
          },
        });
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [canRead, organizationId, roomsVersion, t]);

  const selectedRoomId = selected?.id;
  useEffect(() => {
    if (!selectedRoomId || !canRead) {
      setAssigned([]);
      setSavedAssigned([]);
      setStudents([]);
      setAssignmentsLoading(false);
      return;
    }
    let alive = true;
    setAssignmentsLoading(true);
    setAssignmentsError("");
    setAssigned([]);
    setSavedAssigned([]);
    setStudents([]);
    const toastId = `dormitory:residents-load:${selectedRoomId}`;
    void Promise.all([
      listDormAssignments(selectedRoomId),
      canManage ? listAvailableDormStudents(selectedRoomId) : Promise.resolve([]),
    ])
      .then(([nextAssigned, nextStudents]) => {
        if (!alive) return;
        setAssigned(nextAssigned);
        setSavedAssigned(nextAssigned);
        setStudents(
          canManage
            ? nextStudents.map((student) => ({ id: student.id, name: student.name }))
            : nextAssigned.map((student) => ({ id: student.studentId, name: student.name })),
        );
        notifications.dismiss(toastId);
      })
      .catch(() => {
        if (!alive) return;
        const message = t(
          "اطلاعات ساکنان دریافت نشد.",
          "Resident information could not be loaded.",
        );
        setAssignmentsError(message);
        notifications.error(message, {
          id: toastId,
          description: t(
            "برای جلوگیری از تغییر اشتباه اعضا، ابتدا اطلاعات را دوباره دریافت کنید.",
            "Reload the residents before changing assignments.",
          ),
          action: {
            label: t("تلاش دوباره", "Retry"),
            onClick: () => setAssignmentsVersion((value) => value + 1),
          },
        });
      })
      .finally(() => alive && setAssignmentsLoading(false));
    return () => {
      alive = false;
    };
  }, [canManage, canRead, organizationId, selectedRoomId, assignmentsVersion, t]);

  useEffect(() => {
    setResidentSearch("");
  }, [selectedRoomId]);

  useEffect(() => {
    if (
      target !== "STUDENT" ||
      recipient ||
      recipientQuery.trim().length < 2 ||
      drawer !== "announcement"
    ) {
      setResults([]);
      return;
    }
    let alive = true;
    const timer = window.setTimeout(
      () =>
        void findDormitoryStudents(organizationId, recipientQuery)
          .then((next) => {
            if (alive) setResults(next);
          })
          .catch(() => {
            if (!alive) return;
            setResults([]);
            notifications.error(t("جست‌وجوی طلبه انجام نشد.", "Student search failed."), {
              id: `dormitory:student-search:${organizationId}`,
              description: t(
                "اتصال را بررسی کنید و نام یا شماره را دوباره وارد کنید.",
                "Check your connection and search again.",
              ),
            });
          }),
      250,
    );
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [target, recipient, recipientQuery, organizationId, drawer, t]);

  async function runOperation<T>(
    request: () => Promise<T>,
    feedback: PromiseNotificationData<T>,
    onSuccess: (result: T) => void,
  ) {
    if (operationInFlight.current) return;
    operationInFlight.current = true;
    setSaving(true);
    try {
      const result = await notifications
        .promise(Promise.resolve().then(request), feedback)
        .unwrap();
      if (mounted.current) onSuccess(result);
    } catch {
      // Sonner replaces the pending notification with the error; retain the draft for correction.
    } finally {
      operationInFlight.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  const toggle = (studentId: string) => {
    if (!canManage || saving || assignmentsLoading || assignmentsError) return;
    if (assignedIds.has(studentId)) {
      setAssigned((current) => current.filter((item) => item.studentId !== studentId));
      return;
    }
    if (selected && assigned.length >= selected.capacity) {
      notifications.warning(t("ظرفیت اتاق کامل است.", "This room is full."), {
        id: `dormitory:capacity:${selected.id}`,
        description: t(
          `ظرفیت «${selected.name}» ${selected.capacity} نفر است. ابتدا یک نفر را از اتاق بردارید.`,
          `${selected.name} has ${selected.capacity} places. Remove a resident before adding another.`,
        ),
      });
      return;
    }
    setAssigned((current) => [
      ...current,
      {
        id: studentId,
        studentId,
        name: students.find((student) => student.id === studentId)?.name || "",
        userId: null,
      },
    ]);
  };
  const createRoom = async () => {
    if (!canManage || operationInFlight.current) return;
    if (
      !organizationId ||
      !roomDraft.building.trim() ||
      !roomDraft.code.trim() ||
      !roomDraft.name.trim() ||
      !Number.isInteger(roomDraft.floor) ||
      roomDraft.floor < 1 ||
      roomDraft.floor > 200 ||
      !Number.isInteger(roomDraft.capacity) ||
      roomDraft.capacity < 1 ||
      roomDraft.capacity > 14
    ) {
      notifications.warning(t("اطلاعات اتاق را کامل کنید.", "Complete the room details."), {
        id: "dormitory:room-validation",
        description: t(
          "سازمان، ساختمان، کد و نام اتاق لازم است؛ ظرفیت بین ۱ تا ۱۴ نفر و طبقه بین ۱ تا ۲۰۰ باشد.",
          "Choose an organization and enter a building, code and name. Capacity must be 1–14 and floor 1–200.",
        ),
      });
      return;
    }
    const draft = {
      organizationId,
      ...roomDraft,
      building: roomDraft.building.trim(),
      code: roomDraft.code.trim(),
      name: roomDraft.name.trim(),
    };
    await runOperation(
      () => createDormRoom(draft),
      {
        id: `dormitory:room-create:${organizationId}`,
        loading: t("در حال ایجاد اتاق…", "Creating room…"),
        description: t("اطلاعات اتاق در حال ذخیره است.", "Saving the room details."),
        success: (room) => ({
          message: t("اتاق ایجاد شد.", "Room created."),
          description: t(
            `«${room.name}» آماده تخصیص ساکنان است.`,
            `${room.name} is ready for residents.`,
          ),
        }),
        error: () => ({
          message: t("ایجاد اتاق انجام نشد.", "Could not create the room."),
          description: t(
            "اطلاعات واردشده حفظ شده است. کد اتاق باید یکتا باشد؛ اتصال را بررسی کنید و دوباره تلاش کنید.",
            "Your details were kept. Check the room code is unique and try again.",
          ),
          duration: 8000,
        }),
      },
      (room) => {
        setRooms((current) => [...current, room]);
        setSelectedId(room.id);
        setRoomDraft(emptyRoom);
        setDrawer(null);
      },
    );
  };
  const save = async () => {
    if (
      !selected ||
      !canManage ||
      assignmentsLoading ||
      assignmentsError ||
      operationInFlight.current
    )
      return;
    const roomId = selected.id,
      roomName = selected.name;
    const ids = assigned.map((item) => item.studentId);
    await runOperation(
      () => setDormAssignments(roomId, ids),
      {
        id: `dormitory:residents-save:${roomId}`,
        loading: t("در حال ذخیره اعضا…", "Saving residents…"),
        description: roomName,
        success: (result) => ({
          message: t("اعضای اتاق ذخیره شدند.", "Room residents saved."),
          description: t(
            `${result.count.toLocaleString("fa-IR")} نفر در «${roomName}» ثبت شد.`,
            `${result.count.toLocaleString("en-US")} residents assigned to ${roomName}.`,
          ),
        }),
        error: () => ({
          message: t("ذخیره اعضا انجام نشد.", "Could not save the residents."),
          description: t(
            "انتخاب‌های شما حفظ شده است. اتصال را بررسی کنید و دوباره ذخیره کنید.",
            "Your selections were kept. Check your connection and save again.",
          ),
          duration: 8000,
        }),
      },
      (result) => {
        setSavedAssigned(assigned);
        setRooms((current) =>
          current.map((room) =>
            room.id === roomId ? { ...room, studentCount: result.count } : room,
          ),
        );
      },
    );
  };
  const announce = async () => {
    if (!canAnnounce || operationInFlight.current) return;
    if (
      !organizationId ||
      !announcement.title.trim() ||
      !announcement.body.trim() ||
      (target === "ROOM" ? !selected : !recipient)
    ) {
      notifications.warning(t("اعلان آماده ارسال نیست.", "The announcement is incomplete."), {
        id: "dormitory:announcement-validation",
        description: t(
          "گیرنده، عنوان و متن پیام را مشخص کنید.",
          "Choose a recipient and enter a title and message.",
        ),
      });
      return;
    }
    if (target === "ROOM" && (assignmentsLoading || roomRecipientCount === 0)) {
      notifications.warning(t("گیرنده‌ای آمادهٔ دریافت نیست.", "No recipients are ready."), {
        id: "dormitory:announcement-recipients",
        description: assignmentsLoading
          ? t("ابتدا فهرست ساکنان اتاق را دریافت کنید.", "Wait for the room residents to load.")
          : t(
              "برای ارسال اعلان، حداقل یک ساکن اتاق باید حساب کاربری فعال داشته باشد.",
              "At least one room resident needs an active account to receive this announcement.",
            ),
      });
      return;
    }
    if (target === "STUDENT" && recipient && !recipient.hasAccount) {
      notifications.warning(t("طلبه حساب کاربری ندارد.", "The student has no account."), {
        id: "dormitory:announcement-recipient-account",
        description: t(
          "ابتدا برای این طلبه حساب کاربری ایجاد یا فعال کنید.",
          "Create or activate this student's account before sending an announcement.",
        ),
      });
      return;
    }
    const draft = {
      organizationId,
      title: announcement.title.trim(),
      body: announcement.body.trim(),
      target,
      roomId: target === "ROOM" ? selected?.id : undefined,
      studentId: target === "STUDENT" ? recipient?.id : undefined,
    };
    await runOperation(
      () => sendDormitoryAnnouncement(draft),
      {
        id: `dormitory:announcement:${organizationId}`,
        loading: t("در حال ارسال اعلان…", "Sending announcement…"),
        description: t(
          "در حال ارسال به گیرندگان انتخاب‌شده.",
          "Sending to the selected recipients.",
        ),
        success: (result) => ({
          message: result.delivered
            ? t("اعلان ارسال شد.", "Announcement sent.")
            : t("گیرنده‌ای پیدا نشد.", "No recipients found."),
          description: result.delivered
            ? t(
                `اعلان برای ${result.delivered.toLocaleString("fa-IR")} نفر ارسال شد.`,
                `Delivered to ${result.delivered.toLocaleString("en-US")} recipients.`,
              )
            : t(
                "هیچ ساکن دارای حساب کاربری برای دریافت این اعلان وجود نداشت.",
                "No residents with an account could receive this announcement.",
              ),
        }),
        error: () => ({
          message: t("ارسال اعلان انجام نشد.", "Could not send the announcement."),
          description: t(
            "عنوان و متن پیام حفظ شده است. اتصال را بررسی کنید و دوباره تلاش کنید.",
            "Your message was kept. Check your connection and try again.",
          ),
          duration: 8000,
        }),
      },
      (result) => {
        if (result.delivered) {
          setAnnouncement({ title: "", body: "" });
          setDrawer(null);
        } else {
          notifications.warning(t("گیرنده‌ای پیدا نشد.", "No recipients found."), {
            id: `dormitory:announcement:${organizationId}`,
            description: t(
              "هیچ ساکن دارای حساب کاربری برای دریافت این اعلان وجود نداشت.",
              "No residents with an account could receive this announcement.",
            ),
          });
        }
      },
    );
  };

  if (!canRead)
    return (
      <ErrorState
        title={t("دسترسی به خوابگاه ندارید.", "You do not have access to the dormitory.")}
      />
    );

  return (
    <section className="space-y-4">
      <ManagementPageHeader
        eyebrow="خوابگاه"
        title="مدیریت اتاق‌های خوابگاه"
        description="نمای ساختمان، طبقه و ظرفیت اتاق‌ها؛ تخصیص ساکنان و ارسال اعلان هدفمند."
      />
      {!error && !loading && rooms.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-3" aria-label="خلاصه ظرفیت خوابگاه">
          {[
            ["اتاق فعال", rooms.length, "text-brand"],
            ["ساکن ثبت‌شده", totalResidents, "text-emerald-700 dark:text-emerald-300"],
            [
              "تخت خالی",
              Math.max(0, totalCapacity - totalResidents),
              "text-amber-700 dark:text-amber-300",
            ],
          ].map(([label, value, tone]) => (
            <Card key={label as string} className="flex min-h-20 items-center justify-between p-3">
              <span className="text-sm text-slate-500">{label}</span>
              <strong className={`text-2xl font-black ${tone}`}>
                {Number(value).toLocaleString("fa-IR")}
              </strong>
            </Card>
          ))}
        </div>
      ) : null}
      {error ? (
        <ErrorState
          title="اتاق‌ها در دسترس نیستند"
          description={error}
          action={
            <Button variant="soft" onClick={() => setRoomsVersion((value) => value + 1)}>
              تلاش دوباره
            </Button>
          }
        />
      ) : null}
      {!error && loading ? (
        <Card className="p-6 text-sm text-slate-500">در حال دریافت اتاق‌ها…</Card>
      ) : null}
      {!error && !loading && rooms.length === 0 ? (
        <Card className="grid min-h-72 place-items-center p-6 text-center">
          <div>
            <Building2 className="mx-auto size-10 text-brand" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-black text-ink">هنوز اتاقی ثبت نشده است</h2>
            <p className="mt-2 text-sm text-slate-500">
              اولین اتاق را بسازید؛ ظرفیت پیش‌فرض هر اتاق ۱۴ نفر است.
            </p>
            <Button
              className="mt-5"
              disabled={!canManage || saving}
              onClick={() => setDrawer("room")}
            >
              <Plus size={17} aria-hidden="true" />
              ایجاد اولین اتاق
            </Button>
          </div>
        </Card>
      ) : null}
      {!error && !loading && rooms.length > 0 ? (
        <div className="grid gap-4 min-[960px]:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="space-y-4">
            {groups.map(([building, buildingRooms]) => (
              <Card key={building} className="p-4">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-brand" aria-hidden="true" />
                  <h2 className="font-black text-ink">{building}</h2>
                </div>
                {[...new Set(buildingRooms.map((room) => room.floor))].sort().map((floor) => (
                  <div key={floor} className="mt-4">
                    <h3 className="mb-2 text-xs font-bold text-slate-500">طبقه {floor}</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 min-[960px]:grid-cols-8">
                      {buildingRooms
                        .filter((room) => room.floor === floor)
                        .map((room) => (
                          <button
                            key={room.id}
                            type="button"
                            disabled={saving}
                            onClick={() => setSelectedId(room.id)}
                            className={`min-h-24 rounded-xl border p-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${room.id === selected?.id ? "border-brand bg-brand/10" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]"}`}
                          >
                            <span className="text-xs text-slate-500">{room.code}</span>
                            <strong className="mt-1 block text-sm text-ink">{room.name}</strong>
                            <span
                              className={`mt-2 block text-xs font-bold ${room.studentCount >= room.capacity ? "text-rosewood" : "text-emerald-700"}`}
                            >
                              {room.studentCount}/{room.capacity} نفر
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </Card>
            ))}
          </div>
          <Card className="h-fit p-4 min-[960px]:sticky min-[960px]:top-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-black text-ink">{selected?.name}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  طبقه {selected?.floor} · {assigned.length}/{selected?.capacity} نفر
                </p>
                <p
                  role="status"
                  className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                >
                  {remainingBeds.toLocaleString("fa-IR")} تخت خالی
                  {hasResidentChanges ? " · تغییرات ذخیره نشده" : " · وضعیت ذخیره شده"}
                </p>
              </div>
              <Button
                size="icon"
                variant="soft"
                disabled={!canAnnounce || saving}
                aria-label="ارسال اعلان"
                onClick={() => setDrawer("announcement")}
              >
                <Megaphone size={18} aria-hidden="true" />
              </Button>
            </div>
            {assignmentsLoading ? (
              <p role="status" className="mt-4 text-sm text-slate-500">
                در حال دریافت ساکنان…
              </p>
            ) : null}
            {assignmentsError ? (
              <ErrorState
                title={assignmentsError}
                action={
                  <Button
                    variant="soft"
                    onClick={() => setAssignmentsVersion((value) => value + 1)}
                  >
                    تلاش دوباره
                  </Button>
                }
              />
            ) : null}
            <label className="mt-4 block text-xs font-bold text-slate-600 dark:text-slate-300">
              جست‌وجوی ساکن
              <SearchBar
                aria-label="جست‌وجوی ساکن"
                value={residentSearch}
                onChange={(event) => setResidentSearch(event.target.value)}
                placeholder="نام طلبه"
                className="mt-2"
                disabled={assignmentsLoading || Boolean(assignmentsError)}
              />
            </label>
            <div
              className="mt-3 max-h-96 space-y-2 overflow-y-auto"
              aria-label="فهرست ساکنان قابل تخصیص"
            >
              {visibleStudents.map((student) => (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[rgb(var(--border-subtle))] px-3 py-2"
                >
                  <span className="text-sm font-semibold text-ink">{student.name}</span>
                  <input
                    aria-label={`تخصیص ${student.name}`}
                    type="checkbox"
                    disabled={
                      !canManage || saving || assignmentsLoading || Boolean(assignmentsError)
                    }
                    checked={assignedIds.has(student.id)}
                    onChange={() => toggle(student.id)}
                  />
                </label>
              ))}
              {!assignmentsLoading && !assignmentsError && !visibleStudents.length ? (
                <p className="rounded-lg bg-[rgb(var(--surface-muted))] p-3 text-center text-sm text-slate-500">
                  طلبه‌ای با این نام پیدا نشد.
                </p>
              ) : null}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 min-[960px]:grid-cols-1">
              <Button
                className="w-full"
                disabled={
                  !canManage ||
                  assignmentsLoading ||
                  Boolean(assignmentsError) ||
                  !hasResidentChanges
                }
                loading={saving}
                onClick={save}
              >
                <Users size={17} aria-hidden="true" />
                ذخیره اعضای اتاق
              </Button>
              {hasResidentChanges ? (
                <Button
                  className="w-full"
                  variant="soft"
                  disabled={saving || assignmentsLoading}
                  onClick={() => setAssigned(savedAssigned)}
                >
                  بازگردانی تغییرات
                </Button>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}
      {!loading && !error && rooms.length > 0 ? (
        <Button variant="soft" disabled={!canManage || saving} onClick={() => setDrawer("room")}>
          <Plus size={17} aria-hidden="true" />
          ایجاد اتاق
        </Button>
      ) : null}
      <ResponsiveDrawer
        open={drawer === "room"}
        onOpenChange={(open) => !open && !saving && setDrawer(null)}
        title="ایجاد اتاق جدید"
        description="ساختمان، طبقه و ظرفیت اتاق را مشخص کنید."
      >
        <div className="space-y-4">
          <Field label="ساختمان" required>
            <Input
              disabled={saving}
              value={roomDraft.building}
              onChange={(event) =>
                setRoomDraft((current) => ({ ...current, building: event.target.value }))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="طبقه" required>
              <Input
                disabled={saving}
                type="number"
                min={1}
                max={200}
                value={roomDraft.floor}
                onChange={(event) =>
                  setRoomDraft((current) => ({
                    ...current,
                    floor: Number(event.target.value) || 1,
                  }))
                }
              />
            </Field>
            <Field label="ظرفیت" required>
              <Input
                disabled={saving}
                type="number"
                min={1}
                max={14}
                value={roomDraft.capacity}
                onChange={(event) =>
                  setRoomDraft((current) => ({
                    ...current,
                    capacity: Math.min(14, Number(event.target.value) || 1),
                  }))
                }
              />
            </Field>
          </div>
          <Field label="کد اتاق" required>
            <Input
              disabled={saving}
              dir="ltr"
              value={roomDraft.code}
              onChange={(event) =>
                setRoomDraft((current) => ({ ...current, code: event.target.value }))
              }
              placeholder="A-101"
            />
          </Field>
          <Field label="نام اتاق" required>
            <Input
              disabled={saving}
              value={roomDraft.name}
              onChange={(event) =>
                setRoomDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </Field>
          <Button className="w-full" loading={saving} onClick={createRoom}>
            ایجاد اتاق
          </Button>
        </div>
      </ResponsiveDrawer>
      <ResponsiveDrawer
        open={drawer === "announcement"}
        onOpenChange={(open) => !open && !saving && setDrawer(null)}
        title="ارسال اعلان خوابگاه"
        description="فقط ساکنان اتاق یا طلبه انتخاب‌شده پیام را می‌گیرند."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={saving}
              variant={target === "ROOM" ? "primary" : "soft"}
              onClick={() => setTarget("ROOM")}
            >
              ساکنان این اتاق
            </Button>
            <Button
              disabled={saving}
              variant={target === "STUDENT" ? "primary" : "soft"}
              onClick={() => setTarget("STUDENT")}
            >
              یک طلبه
            </Button>
          </div>
          {target === "ROOM" ? (
            <p className="rounded-lg bg-[rgb(var(--surface-muted))] p-3 text-sm" role="status">
              گیرنده: {selected?.name}
              {assignmentsLoading
                ? " · در حال بررسی حساب ساکنان…"
                : ` · ${roomRecipientCount.toLocaleString("fa-IR")} حساب قابل دریافت`}
              {!assignmentsLoading && roomRecipientCount === 0 ? (
                <span className="mt-1 block text-xs font-semibold text-amber-700 dark:text-amber-300">
                  برای ارسال اعلان، دست‌کم یک ساکن باید حساب کاربری فعال داشته باشد.
                </span>
              ) : null}
            </p>
          ) : (
            <Field label="نام یا شماره همراه" required>
              <div className="space-y-2">
                <Input
                  disabled={saving}
                  value={recipientQuery}
                  onChange={(event) => {
                    setRecipientQuery(event.target.value);
                    setRecipient(null);
                  }}
                  placeholder="حداقل دو حرف یا رقم"
                />
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setRecipient(item);
                      setRecipientQuery(item.name);
                      setResults([]);
                    }}
                    className="w-full rounded-lg border border-[rgb(var(--border-subtle))] p-3 text-start text-sm"
                  >
                    {item.name}{" "}
                    <span dir="ltr" className="text-xs text-slate-500">
                      {item.phoneNumber}
                    </span>
                    {!item.hasAccount ? (
                      <span className="ms-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        بدون حساب کاربری
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <Field label="عنوان" required>
            <Input
              disabled={saving}
              value={announcement.title}
              onChange={(event) =>
                setAnnouncement((current) => ({ ...current, title: event.target.value }))
              }
            />
          </Field>
          <Field label="متن اعلان" required>
            <Textarea
              disabled={saving}
              value={announcement.body}
              onChange={(event) =>
                setAnnouncement((current) => ({ ...current, body: event.target.value }))
              }
            />
          </Field>
          <Button
            className="w-full"
            disabled={
              !canAnnounce ||
              (target === "ROOM" &&
                (!selected || assignmentsLoading || roomRecipientCount === 0)) ||
              (target === "STUDENT" && recipient?.hasAccount === false)
            }
            loading={saving}
            onClick={announce}
          >
            <Megaphone size={17} aria-hidden="true" />
            ارسال اعلان
          </Button>
        </div>
      </ResponsiveDrawer>
    </section>
  );
}
