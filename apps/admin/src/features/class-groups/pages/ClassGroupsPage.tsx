import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../../../shared/api/api";
import { Button, Card, Input } from "../../../shared/ui/ui";
import { getClassOptions, listClasses, type EducationClass } from "../../education/api/classes.api";

type Group = {
  id: string;
  name: string;
  code: string;
  classId?: string | null;
  memberCount: number;
};
type StudentOption = { id: string; name: string; grade: string; major: string };

export function ClassGroupsPage() {
  const [classes, setClasses] = useState<EducationClass[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [classId, setClassId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [eligible, setEligible] = useState<StudentOption[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  async function loadGroups(nextClassId: string) {
    const rows = nextClassId
      ? await api.get<Group[]>(`/class-groups?classId=${encodeURIComponent(nextClassId)}`)
      : [];
    setGroups(rows);
    setSelectedGroupId((current) =>
      rows.some((row) => row.id === current) ? current : (rows[0]?.id ?? ""),
    );
  }

  useEffect(() => {
    listClasses()
      .then(async (rows) => {
        setClasses(rows);
        const first = rows[0]?.id ?? "";
        setClassId(first);
        if (first) await loadGroups(first);
      })
      .catch(() => setMessage("دریافت کلاس‌ها انجام نشد."));
  }, []);

  useEffect(() => {
    if (!classId) {
      setEligible([]);
      return;
    }
    getClassOptions(classId)
      .then((options) => setEligible(options.classroom.students ?? []))
      .catch(() => setEligible([]));
    void loadGroups(classId);
  }, [classId]);

  useEffect(() => {
    if (!selectedGroupId) {
      setMemberIds([]);
      return;
    }
    api
      .get<Array<{ id: string }>>(`/class-groups/${encodeURIComponent(selectedGroupId)}/members`)
      .then((rows) => setMemberIds(rows.map((row) => row.id)))
      .catch(() => setMemberIds([]));
  }, [selectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!classId) return;
    await api.post("/class-groups", { classId, name, code });
    setName("");
    setCode("");
    setMessage("گروه ساخته شد.");
    await loadGroups(classId);
  }

  async function saveMembers() {
    if (!selectedGroupId) return;
    await api.put(`/class-groups/${encodeURIComponent(selectedGroupId)}/members`, {
      studentIds: memberIds,
    });
    setMessage("اعضای گروه ذخیره شدند.");
    await loadGroups(classId);
  }

  async function removeSelectedGroup() {
    if (!selectedGroupId || !selectedGroup) return;
    if (!window.confirm(`گروه «${selectedGroup.name}» حذف شود؟`)) return;

    try {
      await api.delete(`/class-groups/${encodeURIComponent(selectedGroupId)}`);
      setMessage("گروه حذف شد.");
      await loadGroups(classId);
    } catch {
      setMessage("حذف گروه انجام نشد.");
    }
  }

  return (
    <section className="space-y-4" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-ink">گروه‌های کلاس</h1>
        <p className="text-sm text-slate-500">
          هر کلاس می‌تواند چند گروه داشته باشد؛ اعضای گروه باید ابتدا عضو همان کلاس باشند.
        </p>
      </div>
      {message ? <p className="rounded-lg bg-brand/5 p-2 text-sm text-brand">{message}</p> : null}
      <Card className="p-4">
        <label className="text-sm font-bold">
          کلاس{" "}
          <select
            className="mr-2 h-10 rounded-lg border px-3"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>
        </label>
        <form onSubmit={create} className="mt-3 flex flex-wrap gap-2">
          <Input
            className="max-w-48"
            placeholder="کد گروه"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Input
            className="max-w-64"
            placeholder="نام گروه"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Button type="submit" disabled={!classId}>
            ساخت گروه
          </Button>
        </form>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.4fr)]">
        <Card className="p-3">
          <h2 className="mb-2 font-black text-ink">گروه‌ها</h2>
          <div className="grid gap-2">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className={`rounded-lg border p-3 text-right ${selectedGroupId === group.id ? "border-brand bg-brand/5" : "border-[rgb(var(--border-subtle))]"}`}
              >
                <b>{group.name}</b>
                <p className="mt-1 text-xs text-slate-500">
                  {group.code} · {group.memberCount} عضو
                </p>
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-black text-ink">اعضای {selectedGroup?.name ?? "گروه"}</h2>
              <p className="text-xs text-slate-500">
                فقط طلبه‌های ثبت‌شده در کلاس نمایش داده می‌شوند.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={!selectedGroupId}
                onClick={() => void removeSelectedGroup()}
              >
                حذف گروه
              </Button>
              <Button size="sm" disabled={!selectedGroupId} onClick={() => void saveMembers()}>
                ذخیره اعضا
              </Button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {eligible.map((student) => (
              <label
                key={student.id}
                className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border-subtle))] p-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={memberIds.includes(student.id)}
                  onChange={(e) =>
                    setMemberIds((all) =>
                      e.target.checked
                        ? [...new Set([...all, student.id])]
                        : all.filter((id) => id !== student.id),
                    )
                  }
                />
                <span>{student.name}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
