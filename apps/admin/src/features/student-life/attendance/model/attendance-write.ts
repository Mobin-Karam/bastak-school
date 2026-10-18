import { attendanceRequestId } from "./attendance-request-id";
import type { AttendanceBulkMarkRequest } from "../api/attendance.api.ts";

export type PendingAttendanceWrite = {
  signature: string;
  body: AttendanceBulkMarkRequest;
};

/** Keep the exact request (including its timestamp) when retrying an uncertain save. */
export function prepareAttendanceWrite(
  previous: PendingAttendanceWrite | null,
  signature: string,
  createBody: () => AttendanceBulkMarkRequest,
): PendingAttendanceWrite {
  if (previous?.signature === signature) return previous;
  return { signature, body: { ...createBody(), requestId: attendanceRequestId() } };
}
