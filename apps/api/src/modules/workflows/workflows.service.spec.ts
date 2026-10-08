import { WorkflowsService } from "./workflows.service";
import { AttendanceStatus } from "../../database/entities/attendance-record.entity";
import {
  LeaveRequestReviewerRole,
  LeaveRequestStatus,
  LeaveRequestType,
} from "../../database/entities/leave-request.entity";

describe("WorkflowsService", () => {
  const makeRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  });

  it("creates an attendance session for an authorized organization", async () => {
    const sessions = makeRepo();
    const memberships = makeRepo();
    const students = makeRepo();
    const attendanceRecords = makeRepo();
    const leaveRequests = makeRepo();
    const exitPermissions = makeRepo();
    const letters = makeRepo();
    const classes = makeRepo();
    const classEnrollments = makeRepo();
    const studyGroups = makeRepo();
    const studyGroupMemberships = makeRepo();
    const dormRooms = makeRepo();
    const dormAssignments = makeRepo();
    const users = makeRepo();

    const organization = { id: "org-1", name: "Al-Mahdi" };
    const sessionRow = {
      id: "session-1",
      organization,
      contextType: "class",
      contextId: "grade-1",
      sessionDate: new Date("2025-01-10T08:00:00.000Z"),
      note: "",
      createdBy: { id: "user-1" },
      createdAt: new Date(),
    };

    memberships.findOne.mockResolvedValue({ organization });
    sessions.create.mockReturnValue(sessionRow);
    sessions.save.mockResolvedValue(sessionRow);

    const service = new WorkflowsService(
      sessions as any,
      attendanceRecords as any,
      leaveRequests as any,
      exitPermissions as any,
      letters as any,
      students as any,
      classes as any,
      classEnrollments as any,
      studyGroups as any,
      studyGroupMemberships as any,
      dormRooms as any,
      dormAssignments as any,
      memberships as any,
      users as any,
    );

    await expect(
      service.createAttendanceSession(
        { id: "user-1", username: "u", role: "STUDENT", sessionId: "s-1" },
        {
          organizationId: "org-1",
          contextType: "class",
          contextId: "grade-1",
          sessionDate: "2025-01-10T08:00:00.000Z",
        },
      ),
    ).resolves.toEqual({
      id: "session-1",
      organizationId: "org-1",
      contextType: "class",
      contextId: "grade-1",
      sessionDate: "2025-01-10T08:00:00.000Z",
      note: "",
    });
  });

  it("creates a leave request with a valid date range", async () => {
    const sessions = makeRepo();
    const memberships = makeRepo();
    const students = makeRepo();
    const attendanceRecords = makeRepo();
    const leaveRequests = makeRepo();
    const exitPermissions = makeRepo();
    const letters = makeRepo();
    const classes = makeRepo();
    const classEnrollments = makeRepo();
    const studyGroups = makeRepo();
    const studyGroupMemberships = makeRepo();
    const dormRooms = makeRepo();
    const dormAssignments = makeRepo();
    const users = makeRepo();

    const organization = { id: "org-1", name: "Al-Mahdi" };
    const student = {
      id: "student-1",
      name: "Ali Ahmadi",
      user: { id: "user-1" },
    };
    const row = {
      id: "leave-1",
      organization,
      student,
      leaveType: LeaveRequestType.LEAVE,
      reviewerRole: LeaveRequestReviewerRole.PRINCIPAL,
      startDate: new Date("2025-02-01T00:00:00.000Z"),
      endDate: new Date("2025-02-02T00:00:00.000Z"),
      reason: "Family visit",
      note: "",
      attachments: [],
      status: LeaveRequestStatus.PENDING,
      approver: null,
      reviewedAt: null,
      createdAt: new Date(),
    };

    memberships.findOne.mockResolvedValue({ organization });
    students.findOne.mockResolvedValue(student);
    leaveRequests.create.mockReturnValue(row);
    leaveRequests.save.mockResolvedValue(row);

    const service = new WorkflowsService(
      sessions as any,
      attendanceRecords as any,
      leaveRequests as any,
      exitPermissions as any,
      letters as any,
      students as any,
      classes as any,
      classEnrollments as any,
      studyGroups as any,
      studyGroupMemberships as any,
      dormRooms as any,
      dormAssignments as any,
      memberships as any,
      users as any,
    );

    await expect(
      service.createLeaveRequest(
        { id: "user-1", username: "u", role: "STUDENT", sessionId: "s-1" },
        {
          organizationId: "org-1",
          startDate: "2025-02-01T00:00:00.000Z",
          endDate: "2025-02-02T00:00:00.000Z",
          reason: "Family visit",
        },
      ),
    ).resolves.toMatchObject({
      id: "leave-1",
      status: LeaveRequestStatus.PENDING,
      studentId: "student-1",
      organizationId: "org-1",
      leaveType: LeaveRequestType.LEAVE,
      reviewerRole: LeaveRequestReviewerRole.PRINCIPAL,
    });
    expect(leaveRequests.create).toHaveBeenCalledWith(
      expect.objectContaining({
        leaveType: LeaveRequestType.LEAVE,
        reviewerRole: LeaveRequestReviewerRole.PRINCIPAL,
      }),
    );
  });

  it("routes a school-exit request to the supervisor", async () => {
    const repositories = Array.from({ length: 14 }, makeRepo);
    const [
      sessions,
      attendanceRecords,
      leaveRequests,
      exitPermissions,
      letters,
      students,
      classes,
      classEnrollments,
      studyGroups,
      studyGroupMemberships,
      dormRooms,
      dormAssignments,
      memberships,
      users,
    ] = repositories;
    const organization = { id: "org-1", name: "Al-Mahdi" };
    const student = {
      id: "student-1",
      name: "Ali Ahmadi",
      user: { id: "user-1" },
    };
    const row = {
      id: "leave-exit-1",
      organization,
      student,
      leaveType: LeaveRequestType.SCHOOL_EXIT,
      reviewerRole: LeaveRequestReviewerRole.SCHOOL_SUPERVISOR,
      startDate: new Date("2025-02-01T00:00:00.000Z"),
      endDate: new Date("2025-02-01T00:00:00.000Z"),
      reason: "Medical visit",
      note: "",
      attachments: [],
      status: LeaveRequestStatus.PENDING,
      approver: null,
      reviewedAt: null,
      createdAt: new Date(),
    };
    memberships.findOne.mockResolvedValue({ organization });
    students.findOne.mockResolvedValue(student);
    leaveRequests.create.mockReturnValue(row);
    leaveRequests.save.mockResolvedValue(row);
    const service = new WorkflowsService(
      sessions as any,
      attendanceRecords as any,
      leaveRequests as any,
      exitPermissions as any,
      letters as any,
      students as any,
      classes as any,
      classEnrollments as any,
      studyGroups as any,
      studyGroupMemberships as any,
      dormRooms as any,
      dormAssignments as any,
      memberships as any,
      users as any,
    );

    await service.createLeaveRequest(
      { id: "user-1", username: "u", role: "STUDENT", sessionId: "s-1" },
      {
        organizationId: "org-1",
        leaveType: LeaveRequestType.SCHOOL_EXIT,
        startDate: "2025-02-01T00:00:00.000Z",
        endDate: "2025-02-01T00:00:00.000Z",
        reason: "Medical visit",
      },
    );

    expect(leaveRequests.create).toHaveBeenCalledWith(
      expect.objectContaining({
        leaveType: LeaveRequestType.SCHOOL_EXIT,
        reviewerRole: LeaveRequestReviewerRole.SCHOOL_SUPERVISOR,
      }),
    );
  });
});
