import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { todayIso } from "../../../shared/lib/utils";
import { DatePicker } from "../../../shared/ui/date-picker";
import { notify } from "../../../shared/ui/notifications";
import { Button, Field, Input, Select, Textarea } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { createLearningItem, updateLearningItem } from "../api/learning.api";
import { learningFormSchema, type LearningFormValues } from "../model/learning-form.schema";
import type { LearningItem } from "../model/learning-model";
import { learningCopy } from "../learning-locale";

export function LearningForm({
  studentId,
  item,
  onSaved,
}: {
  studentId: string;
  item?: LearningItem;
  onSaved: () => void;
}) {
  const { language } = useLocale();
  const copy = learningCopy(language);
  const queryClient = useQueryClient();

  const form = useForm<LearningFormValues>({
    resolver: zodResolver(learningFormSchema),

    defaultValues: {
      title: item?.title || "",
      subject: item?.subject || "",
      book: item?.book || "",
      chapter: item?.chapter || "",
      lesson: item?.lesson || "",
      topic: item?.topic || "",
      note: item?.note || "",
      hint: item?.hint || "",
      dueDate: item?.dueDate || todayIso(),
      mastery: item?.mastery || 0,
      status: item?.status || "pending",
    },
  });

  const save = useMutation({
    mutationFn: (values: LearningFormValues) =>
      item ? updateLearningItem(studentId, item.id, values) : createLearningItem(studentId, values),

    onSuccess: () => {
      notify(item ? copy.updated : copy.created);

      void queryClient.invalidateQueries({
        queryKey: ["student-learning", studentId],
      });

      onSaved();
    },

    onError: (error) => notify(error instanceof Error ? error.message : copy.saveFailed, "error"),
  });

  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
      <Field label={copy.title} error={form.formState.errors.title?.message}>
        <Input autoFocus {...form.register("title")} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copy.subject}>
          <Input {...form.register("subject")} />
        </Field>

        <Field label={copy.topic}>
          <Input {...form.register("topic")} />
        </Field>

        <Field label={copy.book}>
          <Input {...form.register("book")} />
        </Field>

        <Field label={copy.chapter}>
          <Input {...form.register("chapter")} />
        </Field>

        <Field label={copy.lesson}>
          <Input {...form.register("lesson")} />
        </Field>

        <Field label={copy.reviewDate} error={form.formState.errors.dueDate?.message}>
          <DatePicker
            value={form.watch("dueDate")}
            onChange={(value) =>
              form.setValue("dueDate", value, {
                shouldValidate: true,
              })
            }
          />
        </Field>
      </div>

      {item ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.currentMastery}>
            <Input
              value={`${item.mastery.toLocaleString(language === "fa" ? "fa-IR" : "en-US")} / 5`}
              disabled
              readOnly
            />
          </Field>
          <Field label={copy.status}>
            <Select {...form.register("status")}>
              <option value="pending">{copy.pending}</option>

              <option value="done">{copy.done}</option>

              <option value="archived">{copy.archived}</option>
            </Select>
          </Field>
        </div>
      ) : null}

      <Field label={copy.note}>
        <Textarea rows={3} {...form.register("note")} />
      </Field>

      <Field label={copy.hint}>
        <Textarea rows={3} {...form.register("hint")} />
      </Field>

      <Button type="submit" loading={save.isPending} disabled={save.isPending}>
        {copy.save}
      </Button>
    </form>
  );
}
