import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { notify } from "../../../shared/ui/notifications";
import { Button, Field, Select } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { reviewLearningItem } from "../api/learning.api";
import { learningCopy } from "../learning-locale";

export function LearningReviewForm({
  studentId,
  itemId,
  onSaved,
}: {
  studentId: string;
  itemId: string;
  onSaved: () => void;
}) {
  const { language } = useLocale();
  const copy = learningCopy(language);
  const [rating, setRating] = useState(3);
  const queryClient = useQueryClient();
  const review = useMutation({
    mutationFn: () => reviewLearningItem(studentId, itemId, rating),
    onSuccess: () => {
      notify(copy.reviewSaved);
      void queryClient.invalidateQueries({ queryKey: ["student-learning", studentId] });
      onSaved();
    },
    onError: (error) => notify(error instanceof Error ? error.message : copy.reviewFailed, "error"),
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        review.mutate();
      }}
    >
      <Field label={copy.recallQuality}>
        <Select value={String(rating)} onChange={(event) => setRating(Number(event.target.value))}>
          {copy.ratings.map((label, rating) => (
            <option key={rating} value={rating}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <p className="text-xs leading-6 text-slate-500">{copy.reviewHelp}</p>
      <Button type="submit" loading={review.isPending} disabled={review.isPending}>
        {copy.review}
      </Button>
    </form>
  );
}
