import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, UserPlus, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Student } from "../../../shared/types/domain";
import { useStudents } from "../../../shared/hooks/useStudents";
import { normalizePersianText } from "../../../shared/lib/utils";
import { useModal } from "../../../shared/ui/modal";
import { useOptionalAdminLanguage } from "../../../shared/ui/locale";
import { useAuth } from "../../auth";
import { getApiWorkContextKey } from "../../../shared/api/api";
import { Button, Card, EmptyState, ErrorState, LoadingState } from "../../../shared/ui/ui";
import { ManagementMasterDetail } from "../../../shared/ui/management-workspace";
import {
  archiveStudent,
  createStudent,
  getStudentAttempts,
  getStudentLearning,
  getStudentOverview,
  getStudentTopics,
  getStudentWeekly,
  resetStudentPassword,
  studentLifecycle,
  updateStudent,
} from "../api/students.api";
import { StudentAdminAccess } from "../components/StudentAdminAccess";
import { StudentDetail } from "../components/StudentDetail";
import {
  StudentEditor,
  type StudentEditorFeedback,
  type StudentEditorMode,
} from "../components/StudentEditor";
import { StudentInsights } from "../components/StudentInsights";
import { StudentList } from "../components/StudentList";
import { StudentOverview } from "../components/StudentOverview";
import { StudentSecurity } from "../components/StudentSecurity";
import { StudentSupportWorkspace } from "../components/StudentSupportWorkspace";
import { getStudentSyncHealth, reviewStudentSyncHealth } from "../api/student-activity.api";
import {
  getStudentProfileCompleteness,
  getStudentStatus,
  getStudentUsername,
  type StudentDetailTab,
  type StudentProfileFilter,
  type StudentSort,
  type StudentSortDirection,
  type StudentStatusFilter,
} from "../components/student-ui";
import {
  countData,
  emptyStudentForm,
  studentToForm,
  type StudentForm,
} from "../model/student-form";
import { studentCopy } from "../model/student-locale";

const detailTabs: StudentDetailTab[] = ["overview", "activity", "profile", "access", "security"];
const sortValues: StudentSort[] = ["name", "username", "grade", "lastSeen", "completeness"];
const statusValues: StudentStatusFilter[] = ["all", "active", "inactive", "archived"];

function sameForm(a: StudentForm, b: StudentForm) {
  return (Object.keys(a) as (keyof StudentForm)[]).every((key) => a[key] === b[key]);
}

function readableError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  )
    return (error as { message: string }).message;
  return fallback;
}

function normalizedUsername(value: string) {
  return normalizePersianText(value).trim().toLocaleLowerCase("en-US");
}

function dateValue(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function numberParam(value: string | null, fallback: number, allowed?: number[]) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return allowed && !allowed.includes(parsed) ? fallback : parsed;
}

function FeedbackBanner({
  feedback,
  onDismiss,
  closeLabel,
}: {
  feedback: StudentEditorFeedback;
  onDismiss: () => void;
  closeLabel: string;
}) {
  if (!feedback) return null;
  return (
    <div
      aria-live="polite"
      className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-sm ${feedback.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300" : feedback.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"}`}
    >
      <span>{feedback.message}</span>
      <button
        type="button"
        className="grid size-6 shrink-0 place-items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label={closeLabel}
        onClick={onDismiss}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function StudentsPage() {
  const language = useOptionalAdminLanguage();
  const copy = studentCopy[language];
  const locale = language === "en" ? "en-US" : "fa-IR";
  const auth = useAuth();
  const visibleDetailTabs: StudentDetailTab[] = [
    "overview",
    "activity",
    "access",
    ...(auth.can("students.update") ? ["profile" as const, "security" as const] : []),
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const studentStore = useStudents();
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [status, setStatus] = useState<StudentStatusFilter>(() => {
    const value = searchParams.get("status") as StudentStatusFilter | null;
    return value && statusValues.includes(value) ? value : "all";
  });
  const [profileFilter, setProfileFilter] = useState<StudentProfileFilter>(() =>
    searchParams.get("profile") === "incomplete" ? "incomplete" : "all",
  );
  const [sort, setSortState] = useState<StudentSort>(() => {
    const value = searchParams.get("sort") as StudentSort | null;
    return value && sortValues.includes(value) ? value : "name";
  });
  const [sortDirection, setSortDirection] = useState<StudentSortDirection>(() =>
    searchParams.get("direction") === "desc" ? "desc" : "asc",
  );
  const [page, setPage] = useState(() => numberParam(searchParams.get("page"), 1));
  const [pageSize, setPageSize] = useState(() =>
    numberParam(searchParams.get("pageSize"), 25, [25, 50, 100]),
  );
  const [creating, setCreating] = useState(() => searchParams.get("create") === "1");
  const [selectedId, setSelectedId] = useState(() => searchParams.get("studentId") || "");
  const [detailTab, setDetailTab] = useState<StudentDetailTab>(() => {
    const value = searchParams.get("tab") as StudentDetailTab | null;
    return value && detailTabs.includes(value) ? value : "overview";
  });
  const [mobileDirectory, setMobileDirectory] = useState(() => !searchParams.get("studentId"));
  const [form, setForm] = useState<StudentForm>(emptyStudentForm());
  const [securityPassword, setSecurityPassword] = useState("");
  const [feedback, setFeedback] = useState<StudentEditorFeedback>(null);
  const deferredSearch = useDeferredValue(search);
  const { students } = studentStore;
  const qc = useQueryClient();
  const modal = useModal();
  const studentsQueryKey = ["students", getApiWorkContextKey()] as const;

  const selected = useMemo(
    () => (selectedId ? (students.find((student) => student.id === selectedId) ?? null) : null),
    [selectedId, students],
  );
  const mode: StudentEditorMode = creating ? "create" : selected ? "edit" : "empty";
  const baseline = useMemo(
    () => (mode === "edit" && selected ? studentToForm(selected) : emptyStudentForm()),
    [mode, selected],
  );
  const dirty = useMemo(
    () => mode !== "empty" && !sameForm(form, baseline),
    [baseline, form, mode],
  );
  const saveDirty = useMemo(
    () => (mode === "edit" ? !sameForm(form, baseline) : mode === "create" ? dirty : false),
    [baseline, dirty, form, mode],
  );

  const usernameConflict = useMemo(() => {
    const username = normalizedUsername(form.username);
    if (!username) return null;
    return (
      students.find(
        (student) =>
          student.id !== selectedId && normalizedUsername(getStudentUsername(student)) === username,
      ) ?? null
    );
  }, [form.username, selectedId, students]);
  const usernameError = usernameConflict
    ? copy.usernameInUse.replace("{name}", usernameConflict.name)
    : undefined;

  const counts = useMemo(
    () => ({
      all: students.length,
      active: students.filter((student) => getStudentStatus(student) === "active").length,
      inactive: students.filter((student) => getStudentStatus(student) === "inactive").length,
      archived: students.filter((student) => getStudentStatus(student) === "archived").length,
    }),
    [students],
  );
  const incompleteCount = useMemo(
    () => students.filter((student) => getStudentProfileCompleteness(student) < 100).length,
    [students],
  );

  const filtered = useMemo(() => {
    const needle = normalizePersianText(deferredSearch).trim();
    const direction = sortDirection === "asc" ? 1 : -1;
    return students
      .filter(
        (student) =>
          !needle ||
          normalizePersianText(
            [
              student.name,
              student.id,
              getStudentUsername(student),
              student.grade,
              student.major,
              student.targetField || student.target_major,
              student.targetUniversity || student.target_city,
            ]
              .filter(Boolean)
              .join(" "),
          ).includes(needle),
      )
      .filter((student) => status === "all" || getStudentStatus(student) === status)
      .filter((student) => profileFilter === "all" || getStudentProfileCompleteness(student) < 100)
      .slice()
      .sort((a, b) => {
        if (sort === "lastSeen")
          return (dateValue(a.last_seen_at) - dateValue(b.last_seen_at)) * direction;
        if (sort === "completeness")
          return (getStudentProfileCompleteness(a) - getStudentProfileCompleteness(b)) * direction;
        const av =
          sort === "username"
            ? getStudentUsername(a)
            : sort === "grade"
              ? a.grade || ""
              : a.name || "";
        const bv =
          sort === "username"
            ? getStudentUsername(b)
            : sort === "grade"
              ? b.grade || ""
              : b.name || "";
        return (
          av.localeCompare(bv, language === "en" ? "en" : "fa", {
            numeric: true,
            sensitivity: "base",
          }) * direction
        );
      });
  }, [deferredSearch, language, profileFilter, sort, sortDirection, status, students]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const pagedStudents = useMemo(
    () => filtered.slice((activePage - 1) * pageSize, activePage * pageSize),
    [activePage, filtered, pageSize],
  );

  function updateStudentContext(id: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id) next.set("studentId", id);
        else next.delete("studentId");
        next.delete("create");
        return next;
      },
      { replace: true },
    );
  }

  function commitSelection(student: Student) {
    setCreating(false);
    setSelectedId(student.id);
    studentStore.setStudentId(student.id);
    updateStudentContext(student.id);
    setDetailTab("overview");
    setMobileDirectory(false);
    setForm(studentToForm(student));
    setSecurityPassword("");
    setFeedback(null);
  }

  function requestSelection(student: Student) {
    if (mode === "edit" && student.id === selectedId) {
      setMobileDirectory(false);
      return;
    }
    if (!dirty) return commitSelection(student);
    void modal
      .confirm({
        title: copy.discardChangesTitle,
        description: copy.discardChangesDescription,
        confirmLabel: copy.continue,
      })
      .then((ok) => {
        if (ok) commitSelection(student);
      });
  }

  function startCreate() {
    const run = () => {
      setCreating(true);
      setSelectedId("");
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("create", "1");
          next.delete("studentId");
          return next;
        },
        { replace: true },
      );
      setDetailTab("profile");
      setMobileDirectory(false);
      setForm(emptyStudentForm());
      setSecurityPassword("");
      setFeedback(null);
    };
    if (mode === "create") {
      setMobileDirectory(false);
      return;
    }
    if (!dirty) return run();
    void modal
      .confirm({
        title: copy.clearFormTitle,
        description: copy.clearFormDescription,
        confirmLabel: copy.createStudent,
      })
      .then((ok) => {
        if (ok) run();
      });
  }

  function cancelCreate() {
    const run = () => {
      const previous = students.find((student) => student.id === studentStore.studentId) ?? null;
      setCreating(false);
      setMobileDirectory(true);
      setFeedback(null);
      if (previous) {
        setSelectedId(previous.id);
        setForm(studentToForm(previous));
        updateStudentContext(previous.id);
      } else {
        setSelectedId("");
        setForm(emptyStudentForm());
        updateStudentContext("");
      }
    };
    if (!dirty) return run();
    void modal
      .confirm({
        title: copy.cancelCreateTitle,
        description: copy.cancelCreateDescription,
        confirmLabel: copy.cancelCreation,
      })
      .then((ok) => {
        if (ok) run();
      });
  }

  function showDirectory() {
    const run = () => setMobileDirectory(true);
    if (!dirty) return run();
    void modal
      .confirm({
        title: copy.returnToDirectoryTitle,
        description: copy.returnToDirectoryDescription,
        confirmLabel: copy.backToList,
      })
      .then((ok) => {
        if (ok) run();
      });
  }

  function replaceCachedStudent(student: Student) {
    qc.setQueryData<Student[]>(studentsQueryKey, (current) => {
      if (!Array.isArray(current)) return [student];
      return current.some((item) => item.id === student.id)
        ? current.map((item) => (item.id === student.id ? student : item))
        : [student, ...current];
    });
  }

  function patchCachedStudent(id: string, patch: Partial<Student>) {
    qc.setQueryData<Student[]>(studentsQueryKey, (current) =>
      Array.isArray(current)
        ? current.map((student) => (student.id === id ? { ...student, ...patch } : student))
        : current,
    );
  }

  const create = useMutation({
    mutationFn: (draft: StudentForm) => createStudent(draft, auth.context?.activeOrganization?.id),
    onSuccess: (student) => {
      replaceCachedStudent(student);
      commitSelection(student);
      setDetailTab("overview");
      setFeedback({
        tone: "success",
        message: copy.studentCreated,
      });
      void qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) =>
      setFeedback({
        tone: "error",
        message: readableError(error, copy.studentCreateFailed),
      }),
  });

  const update = useMutation({
    mutationFn: () => updateStudent(selectedId, form),
    onSuccess: (student) => {
      replaceCachedStudent(student);
      setForm(studentToForm(student));
      setFeedback({ tone: "success", message: copy.profileSaved });
      void qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) =>
      setFeedback({
        tone: "error",
        message: readableError(error, copy.profileSaveFailed),
      }),
  });

  const remove = useMutation({
    mutationFn: () => archiveStudent(selectedId),
    onSuccess: () => {
      patchCachedStudent(selectedId, {
        accountStatus: "archived",
        account_status: "archived",
        active: false,
        account_active: false,
      });
      setFeedback({
        tone: "success",
        message: copy.studentArchived,
      });
      void qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) =>
      setFeedback({
        tone: "error",
        message: readableError(error, copy.studentArchiveFailed),
      }),
  });

  const lifecycle = useMutation({
    mutationFn: (action: "activate" | "deactivate" | "restore" | "force-logout") =>
      studentLifecycle(selectedId, action),
    onSuccess: (_, action) => {
      if (action === "activate" || action === "restore")
        patchCachedStudent(selectedId, {
          accountStatus: "active",
          account_status: "active",
          active: true,
          account_active: true,
        });
      if (action === "deactivate")
        patchCachedStudent(selectedId, {
          accountStatus: "inactive",
          account_status: "inactive",
          active: false,
          account_active: false,
        });
      const message =
        action === "force-logout"
          ? copy.sessionsEnded
          : action === "deactivate"
            ? copy.studentDeactivated
            : action === "restore"
              ? copy.studentRestored
              : copy.studentActivated;
      setFeedback({ tone: "success", message });
      void qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) =>
      setFeedback({
        tone: "error",
        message: readableError(error, copy.lifecycleFailed),
      }),
  });

  const resetPassword = useMutation({
    mutationFn: () => resetStudentPassword(selectedId, securityPassword),
    onSuccess: () => {
      setSecurityPassword("");
      setFeedback({
        tone: "success",
        message: copy.passwordChanged,
      });
    },
    onError: (error) =>
      setFeedback({
        tone: "error",
        message: readableError(error, copy.passwordChangeFailed),
      }),
  });

  const reviewSyncHealth = useMutation({
    mutationFn: () => reviewStudentSyncHealth(selectedId),
    onSuccess: () => {
      setFeedback({ tone: "success", message: copy.syncHealthReviewed });
      void qc.invalidateQueries({ queryKey: ["student-sync-health", selectedId] });
    },
    onError: (error) =>
      setFeedback({
        tone: "error",
        message: readableError(error, copy.syncHealthReviewFailed),
      }),
  });

  const overview = useQuery({
    queryKey: ["student-overview", selectedId],
    enabled: mode === "edit" && !!selectedId && detailTab === "overview",
    queryFn: () => getStudentOverview(selectedId),
  });
  const activityEnabled = mode === "edit" && !!selectedId && detailTab === "activity";
  const learning = useQuery({
    queryKey: ["student-learning", selectedId],
    enabled: activityEnabled && auth.can("learning.read"),
    queryFn: () => getStudentLearning(selectedId),
  });
  const attempts = useQuery({
    queryKey: ["student-attempts", selectedId],
    enabled: activityEnabled && auth.can("exams.read"),
    queryFn: () => getStudentAttempts(selectedId),
  });
  const weekly = useQuery({
    queryKey: ["student-weekly", selectedId],
    enabled: activityEnabled,
    queryFn: () => getStudentWeekly(selectedId),
  });
  const topics = useQuery({
    queryKey: ["student-topics", selectedId],
    enabled: activityEnabled,
    queryFn: () => getStudentTopics(selectedId),
  });
  const syncHealth = useQuery({
    queryKey: ["student-sync-health", selectedId],
    enabled: activityEnabled && auth.can("student.activity.read"),
    queryFn: () => getStudentSyncHealth(selectedId),
  });

  useEffect(() => {
    if (creating || studentStore.isLoading || !students.length) return;
    const fromUrl = searchParams.get("studentId") || "";
    const fromUrlStudent = fromUrl ? students.find((student) => student.id === fromUrl) : null;
    if (fromUrlStudent) {
      if (fromUrlStudent.id !== selectedId) {
        setSelectedId(fromUrlStudent.id);
        setForm(studentToForm(fromUrlStudent));
        setFeedback(null);
      }
      if (studentStore.studentId !== fromUrlStudent.id)
        studentStore.setStudentId(fromUrlStudent.id);
      return;
    }
    if (selectedId && students.some((student) => student.id === selectedId)) return;
    const stored = students.find((student) => student.id === studentStore.studentId) ?? null;
    if (stored) {
      setSelectedId(stored.id);
      setForm(studentToForm(stored));
      updateStudentContext(stored.id);
    }
  }, [
    creating,
    searchParams,
    studentStore.isLoading,
    studentStore.studentId,
    students,
    selectedId,
  ]);

  useEffect(() => {
    setPage(1);
  }, [profileFilter, deferredSearch, sort, sortDirection, status, pageSize]);
  useEffect(() => {
    if (!visibleDetailTabs.includes(detailTab)) setDetailTab("overview");
  }, [detailTab, auth.activeRole]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        const setOrDelete = (key: string, value: string, defaultValue?: string) => {
          if (!value || value === defaultValue) next.delete(key);
          else next.set(key, value);
        };
        setOrDelete("q", search);
        setOrDelete("status", status, "all");
        setOrDelete("profile", profileFilter, "all");
        setOrDelete("sort", sort, "name");
        setOrDelete(
          "direction",
          sortDirection,
          sort === "lastSeen" || sort === "completeness" ? "desc" : "asc",
        );
        setOrDelete("page", String(page), "1");
        setOrDelete("pageSize", String(pageSize), "25");
        setOrDelete("tab", detailTab, "overview");
        return next;
      },
      { replace: true },
    );
  }, [
    detailTab,
    page,
    pageSize,
    profileFilter,
    search,
    setSearchParams,
    sort,
    sortDirection,
    status,
  ]);

  function setField(key: keyof StudentForm, value: string) {
    setFeedback(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setSort(value: StudentSort) {
    setPage(1);
    if (value === sort) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortState(value);
    setSortDirection(value === "lastSeen" || value === "completeness" ? "desc" : "asc");
  }

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setProfileFilter("all");
    setPage(1);
  }

  function setDirectorySearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function setDirectoryStatus(next: StudentStatusFilter) {
    setStatus(next);
    setProfileFilter("all");
    setPage(1);
  }

  function toggleDirectoryIncomplete() {
    setProfileFilter((current) => (current === "incomplete" ? "all" : "incomplete"));
    if (profileFilter !== "incomplete") setStatus("all");
    setPage(1);
  }

  function setDirectoryPageSize(value: number) {
    setPageSize(value);
    setPage(1);
  }

  function confirmLifecycle(action: "activate" | "deactivate" | "restore" | "force-logout") {
    const lifecycleCopy = {
      activate: [copy.activateTitle, copy.activateDescription, copy.activateAccount],
      deactivate: [copy.deactivateTitle, copy.deactivateDescription, copy.deactivateAccount],
      restore: [copy.restoreTitle, copy.restoreDescription, copy.restoreAccount],
      "force-logout": [copy.forceLogoutTitle, copy.forceLogoutDescription, copy.forceLogout],
    }[action];
    void modal
      .confirm({
        title: lifecycleCopy[0],
        description: lifecycleCopy[1],
        confirmLabel: lifecycleCopy[2],
        confirmationText: action === "restore" ? copy.restoreAccount : undefined,
        tone: action === "deactivate" || action === "force-logout" ? "danger" : "default",
      })
      .then((ok) => ok && lifecycle.mutate(action));
  }

  const retryActivity = () =>
    void Promise.all([
      ...(auth.can("learning.read") ? [learning.refetch()] : []),
      ...(auth.can("exams.read") ? [attempts.refetch()] : []),
      weekly.refetch(),
      topics.refetch(),
      ...(auth.can("student.activity.read") ? [syncHealth.refetch()] : []),
    ]);

  const activityValues = [
    ...(auth.can("learning.read")
      ? [
          {
            label: copy.learningItems,
            value: learning.data?.summary.totalItems || 0,
            loading: learning.isLoading,
            error: learning.isError,
            hint: copy.learningDataHint,
          },
        ]
      : []),
    ...(auth.can("exams.read")
      ? [
          {
            label: copy.examAttempts,
            value: countData(attempts.data),
            loading: attempts.isLoading,
            error: attempts.isError,
            hint: copy.examAttemptsHint,
          },
        ]
      : []),
    {
      label: copy.weeklyDays,
      value: countData(weekly.data),
      loading: weekly.isLoading,
      error: weekly.isError,
      hint: copy.weeklyProgressHint,
    },
    {
      label: copy.performanceTopics,
      value: countData(topics.data),
      loading: topics.isLoading,
      error: topics.isError,
      hint: copy.performanceTopicsHint,
    },
    ...(auth.can("student.activity.read")
      ? [
          {
            label: copy.pendingSync,
            value: (syncHealth.data || []).reduce((sum, device) => sum + device.pendingCount, 0),
            loading: syncHealth.isLoading,
            error: syncHealth.isError,
            hint: syncHealth.data?.some((device) => device.status === "failed")
              ? copy.deviceSyncFailed
              : copy.devicesReported.replace(
                  "{count}",
                  (syncHealth.data?.length || 0).toLocaleString(locale),
                ),
          },
        ]
      : []),
  ];

  const detailContent = selected ? (
    <>
      <FeedbackBanner
        feedback={feedback}
        onDismiss={() => setFeedback(null)}
        closeLabel={copy.closeMessage}
      />
      <div className={feedback ? "mt-4" : ""}>
        {detailTab === "overview" ? (
          <StudentOverview
            student={selected}
            overview={overview.data}
            loading={overview.isLoading}
            error={overview.isError}
            onRetry={() => void overview.refetch()}
            onEdit={auth.can("students.update") ? () => setDetailTab("profile") : undefined}
          />
        ) : null}
        {detailTab === "activity" ? (
          <>
            <StudentInsights onRetry={retryActivity} values={activityValues} />
            {auth.can("student.sync.support") ? (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="soft"
                  size="sm"
                  loading={reviewSyncHealth.isPending}
                  loadingLabel={copy.reviewingSyncHealth}
                  onClick={() => reviewSyncHealth.mutate()}
                >
                  {copy.reviewSyncHealth}
                </Button>
              </div>
            ) : null}
            <StudentSupportWorkspace studentId={selectedId} />
          </>
        ) : null}
        {detailTab === "profile" && auth.can("students.update") ? (
          <StudentEditor
            mode="edit"
            form={form}
            setField={setField}
            dirty={dirty}
            saveDirty={saveDirty}
            usernameError={usernameError}
            busy={update.isPending}
            onReset={() => {
              setFeedback(null);
              setForm(baseline);
            }}
            onSave={() => update.mutate()}
          />
        ) : null}
        {detailTab === "access" ? <StudentAdminAccess selectedId={selectedId} /> : null}
        {detailTab === "security" && auth.can("students.update") ? (
          <StudentSecurity
            student={selected}
            password={securityPassword}
            setPassword={(value) => {
              setFeedback(null);
              setSecurityPassword(value);
            }}
            onArchive={() =>
              void modal
                .confirm({
                  title: copy.archiveStudentTitle,
                  description: copy.archiveStudentDescription,
                  tone: "danger",
                  confirmLabel: copy.archiveConfirmation,
                  confirmationText: copy.archiveConfirmation,
                })
                .then((ok) => ok && remove.mutate())
            }
            onPassword={() =>
              void modal
                .confirm({
                  title: copy.changeStudentPasswordTitle,
                  description: copy.changeStudentPasswordDescription,
                  confirmLabel: copy.changePassword,
                })
                .then((ok) => ok && resetPassword.mutate())
            }
            onLifecycle={confirmLifecycle}
            busy={{
              remove: remove.isPending,
              password: resetPassword.isPending,
              lifecycle: lifecycle.isPending,
            }}
          />
        ) : null}
      </div>
    </>
  ) : null;

  return (
    <div className="grid gap-4 sm:gap-5">
      <ManagementMasterDetail
        directoryVisible={mobileDirectory}
        detailVisible={!mobileDirectory}
        detailWidth="minmax(420px,.75fr)"
        detailScroll={false}
        directory={
          <div>
            <StudentList
              students={pagedStudents}
              total={students.length}
              filteredTotal={filtered.length}
              page={activePage}
              pageCount={pageCount}
              pageSize={pageSize}
              setPage={setPage}
              setPageSize={setDirectoryPageSize}
              selectedId={selectedId}
              search={search}
              setSearch={setDirectorySearch}
              status={status}
              counts={counts}
              incomplete={incompleteCount}
              profileFilter={profileFilter}
              sort={sort}
              sortDirection={sortDirection}
              onSort={setSort}
              onStatusChange={setDirectoryStatus}
              onIncompleteToggle={toggleDirectoryIncomplete}
              onClearFilters={clearFilters}
              onSelect={requestSelection}
              loading={studentStore.isLoading}
              error={studentStore.isError}
              onRetry={() => void studentStore.refetch()}
              creating={creating}
            />
          </div>
        }
        detail={
          <div>
            {mode === "create" ? (
              <Card className="overflow-hidden p-0 xl:flex xl:max-h-[calc(100dvh-6rem)] xl:flex-col">
                <div className="border-b border-slate-200 p-3 xl:hidden dark:border-slate-800">
                  <button
                    type="button"
                    onClick={cancelCreate}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ArrowRight size={15} className="ltr:rotate-180" />
                    {copy.backToDirectory}
                  </button>
                </div>
                <div className="min-h-0 p-3 sm:p-4 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain">
                  <FeedbackBanner
                    feedback={feedback}
                    onDismiss={() => setFeedback(null)}
                    closeLabel={copy.closeMessage}
                  />
                  <div className={feedback ? "mt-4" : ""}>
                    <StudentEditor
                      mode="create"
                      form={form}
                      setField={setField}
                      dirty={dirty}
                      saveDirty={saveDirty}
                      usernameError={usernameError}
                      busy={create.isPending}
                      onCancelCreate={cancelCreate}
                      onReset={() => {
                        setFeedback(null);
                        setForm(emptyStudentForm());
                      }}
                      onSave={() => create.mutate(form)}
                    />
                  </div>
                </div>
              </Card>
            ) : selected ? (
              <StudentDetail
                student={selected}
                tab={detailTab}
                onTabChange={setDetailTab}
                onBack={showDirectory}
                dirty={dirty}
                visibleTabs={visibleDetailTabs}
                capabilities={auth.capabilities}
                onCreate={auth.can("students.create") ? startCreate : undefined}
              >
                {detailContent}
              </StudentDetail>
            ) : (
              <Card className="hidden xl:block">
                <div className="grid min-h-64 place-items-center text-center">
                  {studentStore.isLoading ? (
                    <LoadingState label={copy.preparingRecords} />
                  ) : studentStore.isError ? (
                    <ErrorState
                      title={copy.recordsUnavailable}
                      description={copy.recordsUnavailableDescription}
                      action={
                        <Button variant="soft" onClick={() => void studentStore.refetch()}>
                          {copy.retry}
                        </Button>
                      }
                    />
                  ) : !students.length ? (
                    <EmptyState
                      title={copy.noStudents}
                      description={copy.emptyStudentsDescription}
                      icon={<UserPlus size={20} />}
                      action={
                        auth.can("students.create") ? (
                          <Button onClick={startCreate}>
                            <UserPlus size={16} />
                            {copy.saveStudent}
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    <EmptyState
                      title={copy.selectStudentTitle}
                      description={copy.selectStudentDescription}
                      icon={<UserPlus size={20} />}
                      action={
                        auth.can("students.create") ? (
                          <Button onClick={startCreate}>
                            <UserPlus size={16} />
                            {copy.createStudent}
                          </Button>
                        ) : undefined
                      }
                    />
                  )}
                </div>
              </Card>
            )}
          </div>
        }
      />
    </div>
  );
}
