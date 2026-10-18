import { Plus } from "lucide-react";
import type { ComponentProps } from "react";
import { StudentPicker } from "../../../shared/ui/StudentPicker";
import { Button, Card } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { learningCopy } from "../learning-locale";

type StudentPickerProps = ComponentProps<typeof StudentPicker>;

export function LearningHeader({
  students,
  studentId,
  onStudentChange,
  onCreate,
}: {
  students: StudentPickerProps["students"];
  studentId: string;
  onStudentChange: (id: string) => void;
  onCreate?: () => void;
}) {
  const { language } = useLocale();
  const copy = learningCopy(language);
  return (
    <Card className="sticky top-14 z-10 flex flex-wrap items-center gap-3 p-3 shadow-[var(--shadow-surface)]">
      <div className="min-w-56 flex-1 md:max-w-sm">
        <StudentPicker students={students} value={studentId} onChange={onStudentChange} />
      </div>

      {onCreate ? (
        <Button onClick={onCreate} disabled={!studentId}>
          <Plus size={17} />
          {copy.newReview}
        </Button>
      ) : null}
    </Card>
  );
}
