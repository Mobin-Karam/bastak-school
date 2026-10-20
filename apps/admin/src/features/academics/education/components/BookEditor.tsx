import { useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Button, Field, Input } from "../../../../shared/ui/ui";
import { getClassOptions, type EducationClassBook } from "../api/classes.api";
import { type EducationBookInput } from "../api/education-catalog.api";

// getRandomValues also works when the workspace is served over plain HTTP.
function createClassBookId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `class-book-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function BookEditor({
  language,
  schoolYear,
  classId,
  organizationId,
  initial,
  onCancel,
  onSubmit,
}: {
  language: "fa" | "en";
  schoolYear: string;
  classId?: string;
  organizationId?: string;
  initial?: EducationClassBook;
  onCancel: () => void;
  onSubmit: (draft: EducationBookInput & { teacherId: string }) => Promise<unknown>;
}) {
  const fa = language === "fa";
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const options = useQuery({
    queryKey: ["class-options", "book-shelf", classId],
    queryFn: () => getClassOptions(classId!),
    enabled: Boolean(classId) && !initial,
  });
  const teachers = options.data?.teachers ?? [];
  const schema = z.object({
    title: z
      .string()
      .trim()
      .min(1, fa ? "نام کتاب لازم است." : "A book title is required.")
      .max(240, fa ? "نام کتاب حداکثر ۲۴۰ نویسه است." : "Use at most 240 characters."),
    code: z
      .string()
      .trim()
      .max(80, fa ? "کد کتاب حداکثر ۸۰ نویسه است." : "Use at most 80 characters."),
    teacherId: z
      .string()
      .refine(
        (value) => Boolean(initial || value),
        fa ? "دبیر مسئول را انتخاب کنید." : "Choose a responsible teacher.",
      ),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      code: initial?.code ?? "",
      teacherId: initial?.teacher.id ?? "",
    },
  });
  return (
    <form
      className="grid gap-4"
      dir={fa ? "rtl" : "ltr"}
      onSubmit={async (event) => {
        event.preventDefault();
        // Lock before async schema validation so queued submits cannot run after a failed request.
        if (submitting.current || (!initial && !options.data)) return;
        submitting.current = true;
        setSaving(true);
        try {
          await handleSubmit(async ({ title, code, teacherId }) => {
            await onSubmit({
              id: initial?.bookId ?? createClassBookId(),
              titleFa: title.trim(),
              titleEn: "",
              textbookCode: code.trim(),
              schoolYear,
              grade: 0,
              country: "IR",
              level: "class",
              branch: fa ? "کلاس" : "Class",
              track: fa ? "کلاس" : "Class",
              category: "class",
              appliesTo: [],
              state: "PUBLISHED",
              organizationId,
              teacherId,
            });
          })(event);
        } catch {
          // The mutation reports the API error; keep the form available for retry.
        } finally {
          submitting.current = false;
          setSaving(false);
        }
      }}
      noValidate
    >
      <Field label={fa ? "نام کتاب" : "Book title"} error={errors.title?.message}>
        <Input autoFocus {...register("title")} disabled={saving} />
      </Field>
      <Field label={fa ? "کد کتاب" : "Book code"} error={errors.code?.message}>
        <Input dir="ltr" {...register("code")} disabled={saving} />
      </Field>
      {!initial ? (
        <Field
          label={fa ? "دبیر مسئول" : "Responsible teacher"}
          error={errors.teacherId?.message}
          description={
            fa
              ? "برای اتصال کتاب به کلاس لازم است."
              : "Required to place the book on this class shelf."
          }
        >
          <select
            className="h-11 w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm"
            disabled={saving || options.isPending || options.isError}
            {...register("teacherId")}
          >
            <option value="">{fa ? "انتخاب دبیر" : "Choose a teacher"}</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {!initial && options.isPending ? (
        <p role="status">{fa ? "در حال دریافت دبیران…" : "Loading teachers…"}</p>
      ) : !initial && options.isError ? (
        <div role="alert">
          <p>{fa ? "دبیران دریافت نشدند." : "Teachers could not be loaded."}</p>
          <Button type="button" variant="ghost" onClick={() => void options.refetch()}>
            {fa ? "تلاش دوباره" : "Retry"}
          </Button>
        </div>
      ) : !initial && !teachers.length ? (
        <p role="alert">
          {fa
            ? "ابتدا یک دبیر فعال به سازمان این کلاس اضافه کنید."
            : "Add an active teacher to this class’s organization first."}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" disabled={saving} onClick={onCancel}>
          {fa ? "انصراف" : "Cancel"}
        </Button>
        <Button
          type="submit"
          disabled={saving || (!initial && (!options.data || !teachers.length))}
        >
          {saving ? (fa ? "در حال ذخیره…" : "Saving…") : fa ? "ذخیره روی قفسه" : "Save to shelf"}
        </Button>
      </div>
    </form>
  );
}
