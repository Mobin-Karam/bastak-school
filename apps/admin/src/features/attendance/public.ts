/**
 * Lightweight, deliberate cross-feature surface. Keep route pages in index.ts
 * so a shell consumer does not eagerly load the attendance route chunk.
 */
export { StudentAttendancePoolPrompt } from "./components/StudentAttendanceWorkspace";
export { useAttendanceDiscard } from "./components/useAttendanceDiscard";
export {
  bulkMarkAttendance,
  getAttendanceParticipants,
  getAttendanceEncouragement,
  getAttendanceOverview,
  listMyAttendanceAbsenceReviews,
} from "./api";
export type {
  AttendanceBulkMarkRequest,
  AttendanceContextOption,
  AttendanceContextType,
  SelfAttendanceRecord,
} from "./api";
export { prepareAttendanceWrite } from "./model/attendance-write";
export type { PendingAttendanceWrite } from "./model/attendance-write";
