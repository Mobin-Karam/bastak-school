import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { TimetableWorkspace } from "@moshaver/api-contract";
import { useAuth } from "../../../identity/auth";
import {
  createClass,
  getClassOptions,
  addClassBook,
  createEducationBook,
  publishEducationBook,
} from "../../education/catalog";
import { Button, Field, Input } from "../../../../shared/ui/ui";
import { timetableSelectClass } from "./TimetableLessonEditor";

/** Explicit preparation uses the school catalog's own permission-checked APIs. */
export function TimetableImportCatalog({
  workspace,
  classLabels,
  subjectKeys,
  classMapping,
  onPrepared,
}: {
  workspace: TimetableWorkspace;
  classLabels: string[];
  subjectKeys: string[];
  classMapping: Record<string, string>;
  onPrepared: (kind: "class" | "book", source: string, id: string) => void;
}) {
  const auth = useAuth();
  const [kind, setKind] = useState<"class" | "book">(auth.can("classes.manage") ? "class" : "book");
  const [source, setSource] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [bookId, setBookId] = useState("");
  const [newBookId, setNewBookId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const options = useQuery({
    queryKey: ["timetable-import-class-options", workspace.organizationId, classId],
    queryFn: () => getClassOptions(classId),
    enabled: kind === "book" && !!classId && auth.can("education.catalog.manage"),
  });
  const classroom = workspace.classes.find((x) => x.id === classId);
  const save = useMutation({
    mutationFn: async () => {
      if (!source || !name.trim()) throw Error("ردیف منبع و نام را انتخاب کنید.");
      if (kind === "class") {
        if (!code.trim() || !schoolYear) throw Error("کد یکتا و سال تحصیلی لازم است.");
        const row = await createClass({
          organizationId: workspace.organizationId,
          name: name.trim(),
          code: code.trim(),
          schoolYear,
          capacity: 35,
        });
        return { kind: "class" as const, source, id: row.id };
      }
      if (classMapping[`class:${source.split("|")[0]}`] !== classId)
        throw Error("ابتدا کلاس این مورد منبع را در بخش نگاشت انتخاب کنید.");
      if (!options.data || options.isFetching)
        throw Error("ابتدا دریافت اطلاعات کلاس باید کامل شود.");
      if (!classroom || !teacherId) throw Error("کلاس مقصد و حساب استاد را انتخاب کنید.");
      let selectedBook = bookId || newBookId;
      if (!selectedBook) {
        if (!auth.can("education.catalog.publish"))
          throw Error("ساخت کتاب جدید نیاز به اجازه انتشار کتاب دارد؛ کتاب موجود را انتخاب کنید.");
        const row = await createEducationBook({
          id: `timetable-${crypto.randomUUID()}`,
          organizationId: workspace.organizationId,
          titleFa: name.trim(),
          titleEn: "",
          country: "IR",
          schoolYear: classroom.schoolYear,
          grade: options.data?.classroom.gradeId ?? 0,
          level: "universal",
          branch: "مشترک",
          track: "مشترک",
          category: "school",
          appliesTo: [],
          state: "DRAFT",
          notes: `کتاب آماده‌شده برای نگاشت برنامه: ${source}`,
        });
        selectedBook = row.id;
        setNewBookId(row.id);
      }
      if (!bookId) await publishEducationBook(selectedBook);
      const row = await addClassBook(classId, selectedBook, teacherId);
      const assigned = row.books.find((x) => x.bookId === selectedBook);
      if (!assigned) throw Error("اتصال کتاب کلاس دریافت نشد؛ اطلاعات را تازه کنید.");
      return { kind: "book" as const, source, id: assigned.id };
    },
    onSuccess: (result) => {
      onPrepared(result.kind, result.source, result.id);
      setError("");
      setNewBookId(null);
      setSource("");
      setName("");
      setCode("");
      setBookId("");
      void options.refetch();
    },
    onError: (error) => setError(error instanceof Error ? error.message : "آماده‌سازی انجام نشد."),
  });
  if (!auth.canAny(["classes.manage", "education.catalog.manage"])) return null;
  return (
    <details className="rounded-xl border p-3">
      <summary className="cursor-pointer font-bold">
        کلاس یا کتابی در سیستم ندارید؟ آماده‌سازی اتصال‌ها
      </summary>
      <p className="mt-2 text-xs text-slate-500">
        موارد جدید به فهرست واقعی مدرسه اضافه می‌شوند. استاد باید حساب فعال همین مدرسه داشته باشد.
        نام مشابه به‌تنهایی اتصال ایجاد نمی‌کند.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="نوع آماده‌سازی">
          <AdaptiveSelect
            className={timetableSelectClass}
            value={kind}
            disabled={save.isPending}
            onChange={(e) => {
              setKind(e.target.value as typeof kind);
              setSource("");
              setName("");
              setNewBookId(null);
            }}
          >
            {auth.can("classes.manage") ? (
              <option value="class">ساخت کلاس از نام منبع</option>
            ) : null}
            {auth.can("education.catalog.manage") ? (
              <option value="book">افزودن کتاب و اتصال به کلاس و استاد</option>
            ) : null}
          </AdaptiveSelect>
        </Field>
        <Field label="مورد منبع">
          <AdaptiveSelect
            className={timetableSelectClass}
            value={source}
            disabled={save.isPending || !!newBookId}
            onChange={(e) => {
              setSource(e.target.value);
              if (kind === "book")
                setClassId(classMapping[`class:${e.target.value.split("|")[0]}`] || "");
              setName(e.target.value.split("|").at(-1) ?? "");
            }}
          >
            <option value="">انتخاب کنید</option>
            {(kind === "class" ? classLabels : subjectKeys).map((x) => (
              <option key={x} value={x}>
                {x.replace("|", " · ")}
              </option>
            ))}
          </AdaptiveSelect>
        </Field>
        <Field label="نام در سیستم">
          <Input
            value={name}
            disabled={save.isPending || !!newBookId}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        {kind === "class" ? (
          <>
            <Field label="کد یکتای کلاس">
              <Input
                dir="ltr"
                value={code}
                disabled={save.isPending}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            <Field label="سال تحصیلی کلاس (مثال 1405-1406)">
              <Input
                dir="ltr"
                placeholder="1405-1406"
                value={schoolYear}
                disabled={save.isPending}
                onChange={(e) => setSchoolYear(e.target.value)}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="کلاس برای اتصال کتاب">
              <AdaptiveSelect
                className={timetableSelectClass}
                value={classId}
                disabled={save.isPending || !!newBookId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setBookId("");
                }}
              >
                <option value="">انتخاب کلاس</option>
                {workspace.classes.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} · {x.schoolYear}
                  </option>
                ))}
              </AdaptiveSelect>
            </Field>
            <Field label="حساب استاد برای کتاب">
              <AdaptiveSelect
                className={timetableSelectClass}
                value={teacherId}
                disabled={save.isPending}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                <option value="">انتخاب استاد مدرسه</option>
                {workspace.teachers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </AdaptiveSelect>
            </Field>
            <Field label="کتاب موجود یا کتاب جدید">
              <AdaptiveSelect
                className={timetableSelectClass}
                value={bookId}
                disabled={save.isPending || !!newBookId || options.isFetching}
                onChange={(e) => setBookId(e.target.value)}
              >
                <option value="">ساخت و انتشار کتاب با نام بالا</option>
                {options.data?.books
                  .filter((x) => !options.data.classroom.books.some((b) => b.bookId === x.id))
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.title}
                    </option>
                  ))}
              </AdaptiveSelect>
            </Field>
            {options.isError ? (
              <p role="alert">
                دریافت کتاب‌ها انجام نشد.{" "}
                <button type="button" onClick={() => void options.refetch()}>
                  تلاش دوباره
                </button>
              </p>
            ) : null}
          </>
        )}
        {error ? (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <Button
          variant="soft"
          disabled={
            save.isPending ||
            !source ||
            (kind === "class" ? !auth.can("classes.manage") : !auth.can("education.catalog.manage"))
          }
          onClick={() => save.mutate()}
        >
          {save.isPending
            ? "در حال آماده‌سازی…"
            : kind === "class"
              ? "ساخت کلاس و انتخاب در نگاشت"
              : bookId
                ? "اتصال کتاب موجود به کلاس و استاد"
                : "ساخت، انتشار و اتصال کتاب به کلاس و استاد"}
        </Button>
      </div>
    </details>
  );
}
