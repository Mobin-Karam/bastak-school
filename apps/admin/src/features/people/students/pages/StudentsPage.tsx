import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, KeyRound, UserPlus, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Student } from "../../../../shared/types/domain";
import { useStudents } from "../../../../shared/hooks/useStudents";
import { normalizePersianText } from "../../../../shared/lib/utils";
import { Modal, useModal } from "../../../../shared/ui/modal";
import { useOptionalAdminLanguage } from "../../../../shared/ui/locale";
import { useAuth } from "../../../identity/auth";
import { getApiWorkContextKey } from "../../../../shared/api/api";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Select,
} from "../../../../shared/ui/ui";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { notify } from "../../../../shared/ui/notifications";
import {
  archiveStudent,
  bulkResetStudentPasswords,
  createStudent,
  getStudentAttempts,
  getStudentLearning,
  getStudentOverview,
  getStudentProfile,
  getStudentTopics,
  getStudentWeekly,
  resetStudentPassword,
  studentLifecycle,
  updateStudent,
} from "../api/students.api";
import { StudentAdminAccess } from "../components/StudentAdminAccess";
import { StudentDetail } from "../components/StudentDetail";
import { StudentAdminWorkspace } from "../components/StudentAdminWorkspace";
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
import { StudentTransferWorkspace } from "../components/StudentTransferWorkspace";
import { SpreadsheetTransferLauncher } from "../../../../shared/ui/spreadsheet-transfer-launcher";
import { getStudentSyncHealth, reviewStudentSyncHealth } from "../api/student-activity.api";
import {
  getStudentProfileCompleteness,
  getStudentStatus,
  getStudentUsername,
  matchesStudentClass,
  parseStudentPageNumber,
  studentClassOptions,
  type StudentDetailTab,
  type StudentProfileFilter,
  type StudentSort,
  type StudentSortDirection,
  type StudentStatusFilter,
} from "../components/student-ui";
import {
  countData,
  emptyStudentForm,
  normalizeIranianPhoneNumber,
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

function dateValue(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
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
  const visibleDetailTabs = useMemo<StudentDetailTab[]>(
    () => [
      "overview",
      "activity",
      "access",
      ...(auth.can("students.update") ? ["security" as const] : []),
    ],
    [auth],
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const studentStore = useStudents();
  const {
    isError: studentsError,
    isLoading: studentsLoading,
    setStudentId,
    studentId: storedStudentId,
  } = studentStore;
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [status, setStatus] = useState<StudentStatusFilter>(() => {
    const value = searchParams.get("status") as StudentStatusFilter | null;
    return value && statusValues.includes(value) ? value : "all";
  });
  const [profileFilter, setProfileFilter] = useState<StudentProfileFilter>(() =>
    searchParams.get("profile") === "incomplete" ? "incomplete" : "all",
  );
  const [classId, setClassId] = useState(() => searchParams.get("classId") || "");
  const [sort, setSortState] = useState<StudentSort>(() => {
    const value = searchParams.get("sort") as StudentSort | null;
    return value && sortValues.includes(value) ? value : "name";
  });
  const [sortDirection, setSortDirection] = useState<StudentSortDirection>(() =>
    searchParams.get("direction") === "desc" ? "desc" : "asc",
  );
  const [page, setPage] = useState(() => parseStudentPageNumber(searchParams.get("page"), 1));
  const [pageSize, setPageSize] = useState(() =>
    parseStudentPageNumber(searchParams.get("pageSize"), 25, [25, 50, 100]),
  );
  const [creating, setCreating] = useState(() => searchParams.get("create") === "1");
  const [editing, setEditing] = useState(
    () => searchParams.get("edit") === "1" && Boolean(searchParams.get("studentId")),
  );
  const [selectedId, setSelectedId] = useState(() => searchParams.get("studentId") || "");
  const [detailOpen, setDetailOpen] = useState(() => Boolean(searchParams.get("studentId")));
  const [detailTab, setDetailTab] = useState<StudentDetailTab>(() => {
    const value = searchParams.get("tab") as StudentDetailTab | null;
    return value && detailTabs.includes(value) ? value : "overview";
  });
  const [mobileDirectory, setMobileDirectory] = useState(() => !searchParams.get("studentId"));
  const [form, setForm] = useState<StudentForm>(emptyStudentForm());
  const [securityPassword, setSecurityPassword] = useState("");
  const [bulkPasswordOpen, setBulkPasswordOpen] = useState(false);
  const [bulkPassword, setBulkPassword] = useState("");
  const [bulkScope, setBulkScope] = useState<"selected" | "filtered">("filtered");
  const [feedback, setFeedback] = useState<StudentEditorFeedback>(null);
  const [createDiscardOpen, setCreateDiscardOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const { students } = studentStore;
  const qc = useQueryClient();
  const modal = useModal();
  const studentsQueryKey = ["students", getApiWorkContextKey()] as const;
  const canTransfer = auth.canAny(["students.import", "students.export"]);

  const selected = useMemo(
    () => (selectedId ? (students.find((student) => student.id === selectedId) ?? null) : null),
    [selectedId, students],
  );
  const mode: StudentEditorMode = creating ? "create" : editing && selected ? "edit" : "empty";
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
    const username = normalizeIranianPhoneNumber(form.username);
    if (!username || !/^09\d{9}$/.test(username)) return null;
    return (
      students.find(
        (student) =>
          student.id !== selectedId &&
          normalizeIranianPhoneNumber(getStudentUsername(student)) === username,
      ) ?? null
    );
  }, [form.username, selectedId, students]);
  const normalizedPhoneNumber = normalizeIranianPhoneNumber(form.username);
  const phoneNumberInvalid =
    normalizedPhoneNumber.length > 0 && !/^09\d{9}$/.test(normalizedPhoneNumber);
  const usernameError = usernameConflict
    ? copy.usernameInUse.replace("{name}", usernameConflict.name)
    : phoneNumberInvalid
      ? copy.phoneNumberInvalid
      : undefined;

  const classOptions = useMemo(() => studentClassOptions(students), [students]);

  const filtered = useMemo(() => {
    const needle = normalizePersianText(deferredSearch).trim();
    const direction = sortDirection === "asc" ? 1 : -1;
    return students
      .filter(
        (student) =>
          !needle ||
          normalizePersianText(
            [student.name, student.id, getStudentUsername(student), student.grade, student.major]
              .filter(Boolean)
              .join(" "),
          ).includes(needle),
      )
      .filter((student) => status === "all" || getStudentStatus(student) === status)
      .filter((student) => profileFilter === "all" || getStudentProfileCompleteness(student) < 100)
      .filter((student) => matchesStudentClass(student, classId))
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
  }, [classId, deferredSearch, language, profileFilter, sort, sortDirection, status, students]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const pagedStudents = useMemo(
    () => filtered.slice((activePage - 1) * pageSize, activePage * pageSize),
    [activePage, filtered, pageSize],
  );
  const detailIndex = filtered.findIndex((student) => student.id === selectedId);
  const hasPreviousDetail = detailIndex > 0;
  const hasNextDetail = detailIndex >= 0 && detailIndex < filtered.length - 1;

  function moveDetail(offset: -1 | 1) {
    const nextStudent = filtered[detailIndex + offset];
    if (nextStudent) requestSelection(nextStudent);
  }

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
    setEditing(false);
    setSelectedId(student.id);
    setDetailOpen(true);
    studentStore.setStudentId(student.id);
    updateStudentContext(student.id);
    setDetailTab("overview");
    setMobileDirectory(false);
    setForm(studentToForm(student));
    setSecurityPassword("");
    setFeedback(null);
  }

  function requestSelection(student: Student) {
    if (!creating && !editing && student.id === selectedId) {
      setDetailOpen(true);
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
      setCreateDiscardOpen(false);
      setCreating(true);
      setEditing(false);
      setDetailOpen(false);
      setSelectedId("");
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("create", "1");
          next.delete("studentId");
          next.delete("edit");
          return next;
        },
        { replace: true },
      );
      setDetailTab("overview");
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

  function discardCreate() {
    const previous = students.find((student) => student.id === studentStore.studentId) ?? null;
    setCreateDiscardOpen(false);
    setCreating(false);
    setEditing(false);
    setDetailOpen(false);
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
  }

  function cancelCreate() {
    if (!dirty) return discardCreate();
    setCreateDiscardOpen(true);
  }

  function startEdit() {
    if (!selected) return;
    setEditing(true);
    setDetailOpen(false);
    setForm(studentToForm(selected));
    setFeedback(null);
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("studentId", selected.id);
        next.set("edit", "1");
        next.delete("tab");
        return next;
      },
      { replace: true },
    );
  }

  function cancelEdit() {
    const run = () => {
      setEditing(false);
      setDetailOpen(true);
      setForm(selected ? studentToForm(selected) : emptyStudentForm());
      setFeedback(null);
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("edit");
          return next;
        },
        { replace: true },
      );
    };
    if (!dirty) return run();
    void modal
      .confirm({
        title: copy.discardChangesTitle,
        description: copy.discardChangesDescription,
        confirmLabel: copy.continue,
      })
      .then((ok) => {
        if (ok) run();
      });
  }

  function finishCreate() {
    setCreateDiscardOpen(false);
    setCreating(false);
    setEditing(false);
    setDetailOpen(false);
    setSelectedId("");
    setDetailTab("overview");
    setMobileDirectory(true);
    setForm(emptyStudentForm());
    setSecurityPassword("");
    setFeedback(null);
    studentStore.setStudentId("");
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("create");
        next.delete("studentId");
        next.delete("tab");
        next.delete("edit");
        return next;
      },
      { replace: true },
    );
  }

  function dismissDetail() {
    const run = () => {
      setDetailOpen(false);
      setEditing(false);
      setSelectedId("");
      setForm(emptyStudentForm());
      setFeedback(null);
      setMobileDirectory(true);
      studentStore.setStudentId("");
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("studentId");
          next.delete("tab");
          next.delete("edit");
          return next;
        },
        { replace: true },
      );
    };

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
      finishCreate();
      notify(copy.studentCreated);
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
      setEditing(false);
      setDetailOpen(true);
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("edit");
          return next;
        },
        { replace: true },
      );
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
  const bulkResetPassword = useMutation({
    mutationFn: () =>
      bulkResetStudentPasswords(
        bulkScope === "selected" && selectedId
          ? [selectedId]
          : filtered.map((student) => student.id),
        bulkPassword,
      ),
    onSuccess: (result) => {
      setBulkPassword("");
      setBulkPasswordOpen(false);
      setFeedback({
        tone: result.skippedStudentIds.length ? "info" : "success",
        message: result.skippedStudentIds.length
          ? `${result.updated.toLocaleString(locale)} حساب با رمز جدید به‌روزرسانی شد. ${result.skippedStudentIds.length.toLocaleString(locale)} پرونده بدون حساب ورود بود و تغییری نکرد.`
          : `${result.updated.toLocaleString(locale)} حساب با رمز جدید به‌روزرسانی شد و نشست‌های قبلی بسته شدند.`,
      });
    },
    onError: (error) =>
      setFeedback({ tone: "error", message: readableError(error, copy.passwordChangeFailed) }),
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
    enabled: detailOpen && !editing && !!selectedId && detailTab === "overview",
    queryFn: () => getStudentOverview(selectedId),
  });
  const profile = useQuery({
    queryKey: ["student-profile", getApiWorkContextKey(), selectedId],
    enabled: detailOpen && !editing && !!selectedId && detailTab === "overview",
    queryFn: () => getStudentProfile(selectedId),
  });
  const activityEnabled = detailOpen && !editing && !!selectedId && detailTab === "activity";
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
    if (creating || studentsLoading) return;
    const fromUrl = searchParams.get("studentId") || "";
    const fromUrlStudent = fromUrl ? students.find((student) => student.id === fromUrl) : null;
    if (fromUrlStudent) {
      if (fromUrlStudent.id !== selectedId) {
        setSelectedId(fromUrlStudent.id);
        setForm(studentToForm(fromUrlStudent));
        setFeedback(null);
      }
      if (storedStudentId !== fromUrlStudent.id) setStudentId(fromUrlStudent.id);
      setDetailOpen(!editing);
      return;
    }
    if (studentsError) {
      setDetailOpen(false);
      setEditing(false);
      setMobileDirectory(true);
      return;
    }
    if (fromUrl) {
      setSelectedId("");
      setEditing(false);
      setDetailOpen(false);
      setMobileDirectory(true);
      setForm(emptyStudentForm());
      setFeedback(null);
      if (storedStudentId) setStudentId("");
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("studentId");
          next.delete("tab");
          next.delete("edit");
          return next;
        },
        { replace: true },
      );
    }
  }, [
    creating,
    editing,
    searchParams,
    setSearchParams,
    setStudentId,
    storedStudentId,
    studentsError,
    studentsLoading,
    students,
    selectedId,
  ]);

  useEffect(() => {
    setPage(1);
  }, [classId, profileFilter, deferredSearch, sort, sortDirection, status, pageSize]);
  useEffect(() => {
    if (!visibleDetailTabs.includes(detailTab)) setDetailTab("overview");
  }, [detailTab, visibleDetailTabs]);
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
        setOrDelete("classId", classId);
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
    classId,
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

  function setDirectorySort(value: StudentSort, direction: StudentSortDirection) {
    setPage(1);
    setSortState(value);
    setSortDirection(direction);
  }

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setProfileFilter("all");
    setClassId("");
    setPage(1);
  }

  function setDirectorySearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function setDirectoryStatus(next: StudentStatusFilter) {
    setStatus(next);
    setPage(1);
  }

  function setDirectoryClass(next: string) {
    setClassId(next);
    setPage(1);
  }

  function setDirectoryProfile(next: StudentProfileFilter) {
    setProfileFilter(next);
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
            profile={profile.data}
            loading={overview.isLoading}
            error={overview.isError || profile.isError}
            onRetry={() => void Promise.all([overview.refetch(), profile.refetch()])}
            onEdit={auth.can("students.update") ? startEdit : undefined}
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
            canArchive={auth.can("students.archive")}
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
    <div>
      <StudentAdminWorkspace
        directoryVisible={mobileDirectory}
        detailVisible={!mobileDirectory}
        directory={
          <StudentList
            students={pagedStudents}
            filteredTotal={filtered.length}
            page={activePage}
            pageSize={pageSize}
            search={search}
            status={status}
            classId={classId}
            classOptions={classOptions}
            profileFilter={profileFilter}
            sort={sort}
            sortDirection={sortDirection}
            onSearchChange={setDirectorySearch}
            onSortChange={setDirectorySort}
            onStatusChange={setDirectoryStatus}
            onClassChange={setDirectoryClass}
            onProfileFilterChange={setDirectoryProfile}
            onPageChange={setPage}
            onPageSizeChange={setDirectoryPageSize}
            onClearFilters={clearFilters}
            onSelect={requestSelection}
            directoryActions={
              canTransfer || auth.can("students.create") ? (
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  {canTransfer ? (
                    <SpreadsheetTransferLauncher
                      title={
                        language === "fa" ? "ورود و خروجی طلبه‌ها" : "Student import and export"
                      }
                      description={
                        language === "fa"
                          ? "فایل را پیش‌نمایش بگیرید و سپس فقط ردیف‌های معتبر را ثبت کنید."
                          : "Preview the workbook before committing valid rows."
                      }
                      trigger={language === "fa" ? "ورود / خروجی Excel" : "Excel import / export"}
                    >
                      <StudentTransferWorkspace
                        organizationId={auth.context?.activeOrganization?.id ?? ""}
                        canImport={auth.can("students.import")}
                        canExport={auth.can("students.export")}
                        onCompleted={() => void qc.invalidateQueries({ queryKey: ["students"] })}
                      />
                    </SpreadsheetTransferLauncher>
                  ) : null}
                  {auth.can("students.create") ? (
                    <Button onClick={startCreate}>
                      <UserPlus size={16} />
                      {copy.createStudent}
                    </Button>
                  ) : null}
                  {auth.can("students.update") && filtered.length ? (
                    <Button
                      variant="soft"
                      onClick={() => {
                        setBulkScope(selectedId ? "selected" : "filtered");
                        setBulkPasswordOpen(true);
                      }}
                    >
                      <KeyRound size={16} />
                      {language === "fa" ? "تغییر گروهی رمز" : "Bulk password change"}
                    </Button>
                  ) : null}
                </div>
              ) : undefined
            }
            loading={studentStore.isLoading}
            error={studentStore.isError}
            onRetry={() => void studentStore.refetch()}
          />
        }
        detail={
          <div>
            <ResponsiveDrawer
              open={creating}
              onOpenChange={(open) => !open && cancelCreate()}
              title={copy.createStudent}
              description={copy.createDescription}
              className="max-w-full border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] text-[rgb(var(--color-ink))] min-[1200px]:!inset-5 min-[1200px]:!h-auto min-[1200px]:!w-auto min-[1200px]:!max-h-[calc(100dvh-2.5rem)] min-[1200px]:rounded-3xl"
            >
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="border-b border-border p-3 min-[1200px]:hidden">
                  <button
                    type="button"
                    onClick={cancelCreate}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ArrowRight size={15} className="ltr:rotate-180" />
                    {copy.backToDirectory}
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))] min-[1200px]:p-6">
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
              </section>
              <ResponsiveDrawer
                nested
                open={createDiscardOpen}
                onOpenChange={setCreateDiscardOpen}
                title={copy.cancelCreateTitle}
                description={copy.cancelCreateDescription}
                className="max-h-[min(26rem,72dvh)]"
              >
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <Button variant="soft" onClick={() => setCreateDiscardOpen(false)}>
                    {language === "fa" ? "ادامه ویرایش" : "Continue editing"}
                  </Button>
                  <Button variant="danger" onClick={discardCreate}>
                    {copy.cancelCreation}
                  </Button>
                </div>
              </ResponsiveDrawer>
            </ResponsiveDrawer>
            {selected ? (
              <ResponsiveDrawer
                open={editing}
                onOpenChange={(open) => !open && cancelEdit()}
                title={copy.editProfile}
                description={copy.editDescription}
              >
                <StudentEditor
                  mode="edit"
                  student={selected}
                  form={form}
                  setField={setField}
                  dirty={dirty}
                  saveDirty={saveDirty}
                  usernameError={usernameError}
                  busy={update.isPending}
                  onCancelCreate={cancelEdit}
                  onReset={() => {
                    setFeedback(null);
                    setForm(baseline);
                  }}
                  onSave={() => update.mutate()}
                />
              </ResponsiveDrawer>
            ) : null}
            {selected ? (
              <ResponsiveDrawer
                open={detailOpen && !creating}
                onOpenChange={(open) => {
                  if (open) setDetailOpen(true);
                  else dismissDetail();
                }}
                title={selected.name}
                description={copy.detailSections}
              >
                <StudentDetail
                  student={selected}
                  tab={detailTab}
                  onTabChange={setDetailTab}
                  onBack={dismissDetail}
                  dirty={dirty}
                  visibleTabs={visibleDetailTabs}
                  capabilities={auth.capabilities}
                  onEdit={auth.can("students.update") ? startEdit : undefined}
                  onPrevious={hasPreviousDetail ? () => moveDetail(-1) : undefined}
                  onNext={hasNextDetail ? () => moveDetail(1) : undefined}
                >
                  {detailContent}
                </StudentDetail>
              </ResponsiveDrawer>
            ) : !creating ? (
              <section className="hidden min-[1200px]:block">
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
              </section>
            ) : null}
          </div>
        }
      />
      <Modal
        open={bulkPasswordOpen}
        onOpenChange={setBulkPasswordOpen}
        title={language === "fa" ? "تغییر گروهی رمز عبور" : "Bulk password change"}
        description={
          language === "fa"
            ? "برای هر حساب انتخاب‌شده همان رمز ثبت می‌شود و همه نشست‌های قبلی آن‌ها پایان می‌یابد."
            : "The same password is set for every selected account and all their active sessions end."
        }
      >
        <div className="grid gap-4" dir={language === "fa" ? "rtl" : "ltr"}>
          <Field label={language === "fa" ? "دامنه تغییر" : "Change scope"}>
            <Select
              value={bulkScope}
              onChange={(event) => setBulkScope(event.target.value as "selected" | "filtered")}
            >
              {selectedId ? (
                <option value="selected">
                  {language === "fa" ? "فقط دانش‌آموز انتخاب‌شده" : "Selected student only"}
                </option>
              ) : null}
              <option value="filtered">
                {language === "fa"
                  ? `همه ${filtered.length.toLocaleString(locale)} دانش‌آموزِ فهرست فعلی`
                  : `All ${filtered.length.toLocaleString(locale)} students in this filtered list`}
              </option>
            </Select>
          </Field>
          <Field
            label={copy.newPassword}
            error={bulkPassword && bulkPassword.length < 12 ? copy.passwordMinimum : undefined}
          >
            <Input
              dir="ltr"
              autoComplete="new-password"
              type="password"
              value={bulkPassword}
              onChange={(event) => setBulkPassword(event.target.value)}
            />
          </Field>
          <Button
            variant="danger"
            loading={bulkResetPassword.isPending}
            disabled={bulkPassword.length < 12 || bulkResetPassword.isPending}
            onClick={() => bulkResetPassword.mutate()}
          >
            <KeyRound size={16} />
            {language === "fa" ? "ثبت رمز و پایان نشست‌ها" : "Set password and end sessions"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
