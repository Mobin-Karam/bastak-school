import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import type { Exam } from "../../../shared/types/domain";
import {
  AssessmentMetric,
  AssessmentWorkspaceIntro,
} from "../../../shared/ui/assessment-workspace-intro";
import { StudentPicker } from "../../../shared/ui/StudentPicker";
import { Button, Card, Field, Select } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { questionsCopy } from "../questions-locale";
export function QuestionsSelector({
  students,
  showStudentPicker,
  showExamsLink,
  studentId,
  setStudentId,
  examId,
  setExamId,
  exams,
  loading,
  error,
  selectedExam,
  questionCount,
}: {
  students: Parameters<typeof StudentPicker>[0]["students"];
  showStudentPicker: boolean;
  showExamsLink: boolean;
  studentId: string;
  setStudentId: (id: string) => void;
  examId: string;
  setExamId: (id: string) => void;
  exams: Exam[];
  loading: boolean;
  error: boolean;
  selectedExam?: Exam;
  questionCount: number;
}) {
  const { language } = useLocale();
  const copy = questionsCopy(language);
  return (
    <>
      <AssessmentWorkspaceIntro
        icon={<BookOpen size={20} />}
        title={copy.title}
        description={copy.description}
        actions={
          examId && showExamsLink ? (
            <Link
              to={`/admin/exams${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ""}`}
            >
              <Button variant="soft">{copy.returnToExams}</Button>
            </Link>
          ) : null
        }
        metrics={
          selectedExam ? (
            <>
              <AssessmentMetric>
                {questionCount || selectedExam.delivery?.questionCount || 0} {copy.questions}
              </AssessmentMetric>
              <AssessmentMetric>
                {selectedExam.published ? copy.published : copy.draft}
              </AssessmentMetric>
            </>
          ) : null
        }
      />
      <Card className="sticky top-16 z-10 shadow-sm">
        <div className={`grid gap-3 ${showStudentPicker ? "md:grid-cols-2" : ""}`}>
          {showStudentPicker ? (
            <Field label={copy.optionalStudent}>
              <StudentPicker students={students} value={studentId} onChange={setStudentId} />
            </Field>
          ) : null}
          <Field label={copy.exam}>
            <Select value={examId} disabled={loading} onChange={(e) => setExamId(e.target.value)}>
              <option value="">
                {loading ? copy.loadingExams : error ? copy.loadExamsFailed : copy.selectExam}
              </option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold">{selectedExam?.title || copy.noExam}</span>
          {selectedExam ? (
            <>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {selectedExam.persianDate || selectedExam.isoDate}
              </span>
              <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">
                {questionCount || selectedExam.delivery?.questionCount || 0} {copy.questions}
              </span>
              <span
                className={`rounded-full px-2 py-1 ${selectedExam.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
              >
                {selectedExam.published ? copy.published : copy.draft}
              </span>
            </>
          ) : null}
        </div>
        {selectedExam?.published ? (
          <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
            {copy.publishedWarning}
          </p>
        ) : null}
      </Card>
    </>
  );
}
