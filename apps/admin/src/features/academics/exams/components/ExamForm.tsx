import { useState } from "react";
import { DatePicker, DateTimePicker } from "../../../shared/ui/date-picker";
import { Button, Field, Input, Select, Textarea } from "../../../shared/ui/ui";
import { persianDateForIso, replaceIsoDay } from "../lib/exam-formatters";
import { examDraftError, type ExamDraft } from "../model/exam-model";
import { useLocale } from "../../../shared/ui/locale";
import { examsCopy } from "../exams-locale";

export function ExamForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: ExamDraft;
  onSubmit: (data: ExamDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const { language } = useLocale();
  const copy = examsCopy(language);
  const [data, setData] = useState(initial);

  const [submitting, setSubmitting] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const error = examDraftError(data);

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);

        if (error) {
          return;
        }

        setSubmitting(true);

        void onSubmit({
          ...data,
          title: data.title.trim(),
          note: data.note.trim(),
          instructions: data.instructions.trim(),
        }).finally(() => setSubmitting(false));
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copy.title}>
          <Input
            required
            value={data.title}
            onChange={(event) =>
              setData({
                ...data,
                title: event.target.value,
              })
            }
          />
        </Field>

        <Field label={copy.persianDate}>
          <Input
            required
            value={data.persianDate}
            onChange={(event) =>
              setData({
                ...data,
                persianDate: event.target.value,
              })
            }
          />
        </Field>

        <Field label={copy.isoDate}>
          <DatePicker
            required
            value={data.isoDate}
            onChange={(isoDate) =>
              setData({
                ...data,
                isoDate,
                persianDate: persianDateForIso(isoDate),
                openAt: replaceIsoDay(data.openAt, isoDate),
                closeAt: replaceIsoDay(data.closeAt, isoDate),
              })
            }
          />
        </Field>

        <Field label={copy.status}>
          <Select
            value={data.status}
            onChange={(event) =>
              setData({
                ...data,
                status: event.target.value as ExamDraft["status"],
              })
            }
          >
            <option value="upcoming">{copy.upcoming}</option>

            <option value="active">{copy.active}</option>

            <option value="completed">{copy.completed}</option>

            <option value="cancelled">{copy.cancelled}</option>
          </Select>
        </Field>

        <Field label={copy.startsAt}>
          <DateTimePicker
            value={data.openAt}
            onChange={(openAt) =>
              setData({
                ...data,
                openAt,
              })
            }
          />
        </Field>

        <Field label={copy.endsAt}>
          <DateTimePicker
            value={data.closeAt}
            onChange={(closeAt) =>
              setData({
                ...data,
                closeAt,
              })
            }
          />
        </Field>

        <Field label={copy.durationMinutes}>
          <Input
            min={1}
            max={600}
            type="number"
            value={data.durationMinutes}
            onChange={(event) =>
              setData({
                ...data,
                durationMinutes: Number(event.target.value),
              })
            }
          />
        </Field>

        <Field label={copy.maxAttempts}>
          <Input
            min={1}
            max={100}
            type="number"
            value={data.maxAttempts}
            onChange={(event) =>
              setData({
                ...data,
                maxAttempts: Number(event.target.value),
              })
            }
          />
        </Field>

        <Field label={copy.visibility}>
          <Select
            value={data.published ? "1" : "0"}
            onChange={(event) =>
              setData({
                ...data,
                published: event.target.value === "1",
              })
            }
          >
            <option value="0">{copy.draft}</option>

            <option value="1">{copy.published}</option>
          </Select>
        </Field>
      </div>

      <Field label={copy.internalNote}>
        <Textarea
          value={data.note}
          onChange={(event) =>
            setData({
              ...data,
              note: event.target.value,
            })
          }
        />
      </Field>

      <Field label={copy.studentInstructions}>
        <Textarea
          rows={3}
          value={data.instructions}
          onChange={(event) =>
            setData({
              ...data,
              instructions: event.target.value,
            })
          }
        />
      </Field>

      {submitted && error ? (
        <p role="alert" className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="soft" onClick={onCancel}>
          {copy.cancel}
        </Button>

        <Button loading={submitting}>{copy.saveExam}</Button>
      </div>
    </form>
  );
}
