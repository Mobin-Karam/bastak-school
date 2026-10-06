import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "../../../shared/ui/ui";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { useAuth } from "../../auth";
import { listRelationshipStudents } from "../../access/api/access.api";
import { createDormRoom, listDormAssignments, listDormRooms, setDormAssignments, type DormAssignment, type DormRoom } from "../api/dormitory.api";

const EMPTY_FORM = { code: "", name: "", capacity: 12 };

type RoomDraft = typeof EMPTY_FORM;

export function DormitoryPage() {
  const auth = useAuth();
  const activeOrganizationId = auth.context?.activeOrganization?.id || "";
  const [rooms, setRooms] = useState<DormRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [assigned, setAssigned] = useState<DormAssignment[]>([]);
  const [allStudents, setAllStudents] = useState<Array<{ id: string; name: string; nationalCode?: string | null }>>([]);
  const [draft, setDraft] = useState<RoomDraft>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0] ?? null,
    [rooms, selectedRoomId],
  );

  useEffect(() => {
    void listDormRooms(activeOrganizationId).then((result) => {
      setRooms(result);
      if (result[0]) setSelectedRoomId(result[0].id);
    }).catch(() => setRooms([]));
  }, [activeOrganizationId]);

  useEffect(() => {
    if (!selectedRoom) return;
    void listDormAssignments(selectedRoom.id)
      .then((result) => setAssigned(result))
      .catch(() => setAssigned([]));
  }, [selectedRoom]);

  useEffect(() => {
    if (!selectedRoom) return;
    void listRelationshipStudents(activeOrganizationId)
      .then((result) => {
        setAllStudents(result.map((student) => ({ id: student.id, name: student.name, nationalCode: null })));
      })
      .catch(() => setAllStudents([]));
  }, [selectedRoom, activeOrganizationId]);

  const assignedIds = useMemo(() => new Set(assigned.map((item) => item.studentId)), [assigned]);

  const toggleStudent = (studentId: string) => {
    setAssigned((current) => {
      const exists = current.some((item) => item.studentId === studentId);
      const next = exists ? current.filter((item) => item.studentId !== studentId) : [...current, { id: studentId, studentId, name: allStudents.find((student) => student.id === studentId)?.name ?? "", nationalCode: allStudents.find((student) => student.id === studentId)?.nationalCode ?? null, userId: null }];
      return next;
    });
  };

  const createRoom = async () => {
    const organizationId = rooms[0]?.organizationId ?? selectedRoom?.organizationId ?? activeOrganizationId;
    if (!draft.code.trim() || !draft.name.trim()) {
      setMessage("کد و نام اتاق الزامی است.");
      return;
    }
    if (!organizationId) {
      setMessage("برای ایجاد اتاق، ابتدا دسترسی به سازمان فعال مشخص شود.");
      return;
    }

    try {
      const room = await createDormRoom({
        organizationId,
        code: draft.code.trim(),
        name: draft.name.trim(),
        capacity: Number(draft.capacity) || 1,
      });
      setRooms((current) => [room, ...current]);
      setSelectedRoomId(room.id);
      setDraft(EMPTY_FORM);
      setMessage("اتاق خوابگاه ایجاد شد.");
    } catch {
      setMessage("ایجاد اتاق خوابگاه انجام نشد. دوباره تلاش کنید.");
    }
  };

  const saveAssignments = async () => {
    if (!selectedRoom) return;
    setSaving(true);
    try {
      await setDormAssignments(selectedRoom.id, assigned.map((item) => item.studentId));
      setMessage(`اتاق «${selectedRoom.name}» به‌روزرسانی شد.`);
      const refreshed = await listDormAssignments(selectedRoom.id);
      setAssigned(refreshed);
      setRooms((current) => current.map((room) => (room.id === selectedRoom.id ? { ...room, studentCount: refreshed.length } : room)));
    } catch {
      setMessage("ذخیره‌سازی اعضای اتاق انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <ManagementPageHeader
        eyebrow="V1"
        title="اتاق‌های خوابگاه"
        description="ساخت اتاق، تخصیص طلبه‌ها به هر اتاق و ثبت حضور شبانه اعضا."
      />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-4">
          <h3 className="font-black text-ink">ایجاد اتاق جدید</h3>
          <div className="mt-3 space-y-3">
            <input
              value={draft.code}
              onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))}
              className="w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 py-2"
              placeholder="کد اتاق"
            />
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 py-2"
              placeholder="نام اتاق"
            />
            <input
              type="number"
              min={1}
              value={draft.capacity}
              onChange={(event) => setDraft((current) => ({ ...current, capacity: Number(event.target.value || 1) }))}
              className="w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 py-2"
              placeholder="ظرفیت"
            />
            <Button type="button" onClick={createRoom}>ایجاد اتاق</Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-ink">اتاق‌ها</h3>
            <Button type="button" variant="soft" size="sm" onClick={saveAssignments} loading={saving}>ذخیره اعضا</Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {rooms.length === 0 ? (
              <p className="text-sm text-slate-500">هیچ اتاقی برای این سازمان ثبت نشده است.</p>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`rounded-full border px-3 py-1 text-sm font-bold ${
                    room.id === selectedRoom?.id ? "border-brand bg-brand/10 text-brand" : "border-[rgb(var(--border-subtle))] bg-white text-slate-600"
                  }`}
                >
                  {room.name} ({room.studentCount}/{room.capacity})
                </button>
              ))
            )}
          </div>

          {selectedRoom && (
            <div className="mt-4 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3">
              <p className="text-xs text-slate-500">کد اتاق</p>
              <p className="mt-1 text-lg font-black text-ink">{selectedRoom.code}</p>
              <p className="mt-2 text-sm text-slate-600">{selectedRoom.studentCount} نفر در این اتاق هستند.</p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {allStudents.length === 0 ? (
              <p className="text-sm text-slate-500">دانش‌آموزی برای این سازمان پیدا نشد.</p>
            ) : (
              allStudents.map((student) => {
                const isChecked = assignedIds.has(student.id);
                return (
                  <label key={student.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 py-2">
                    <div>
                      <p className="font-bold text-ink">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.nationalCode || "بدون کد ملی"}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStudent(student.id)}
                      className="h-4 w-4"
                    />
                  </label>
                );
              })
            )}
          </div>

          {message && <p className="mt-3 text-xs text-slate-500">{message}</p>}
        </Card>
      </div>
    </section>
  );
}
