import { WorkflowsService } from "./workflows.service";
import { SchoolAccessService } from "../school-access";
import { AttendanceStatus } from "../../database/entities/attendance-record.entity";
import { ExitPermissionStatus } from "../../database/entities/exit-permission.entity";
import {
  LeaveRequestReviewerRole,
  LeaveRequestStatus,
  LeaveRequestType,
} from "../../database/entities/leave-request.entity";

describe("WorkflowsService", () => {
  const makeRepo = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  });
  const realtime = { emitToUsers: jest.fn() };

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
      realtime as any,
      { createForUsers: jest.fn() } as any,
      new SchoolAccessService({} as never, memberships as never),
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
      realtime as any,
      { createForUsers: jest.fn() } as any,
      new SchoolAccessService({} as never, memberships as never),
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

  it("routes a same-day request of exactly four hours to the supervisor regardless of client type", async () => {
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
      endDate: new Date("2025-02-01T04:00:00.000Z"),
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
      realtime as any,
      { createForUsers: jest.fn() } as any,
      new SchoolAccessService({} as never, memberships as never),
    );

    await service.createLeaveRequest(
      { id: "user-1", username: "u", role: "STUDENT", sessionId: "s-1" },
      {
        organizationId: "org-1",
        // The client cannot route a short exit to the principal by sending LEAVE.
        leaveType: LeaveRequestType.LEAVE,
        startDate: "2025-02-01T00:00:00.000Z",
        endDate: "2025-02-01T04:00:00.000Z",
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

  it("creates one linked physical movement when an authorized leave is approved", async () => {
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
      name: "Ali",
      user: { id: "student-user" },
    };
    const leave = {
      id: "leave-1",
      organization,
      student,
      leaveType: LeaveRequestType.LEAVE,
      reviewerRole: LeaveRequestReviewerRole.PRINCIPAL,
      startDate: new Date("2025-02-01T08:00:00.000Z"),
      endDate: new Date("2025-02-02T08:00:00.000Z"),
      reason: "Family",
      note: "",
      includesLunch: false,
      includesDinner: false,
      exitPermissionId: null,
      attachments: [],
      status: LeaveRequestStatus.PENDING,
      approver: null,
      reviewedAt: null,
      createdAt: new Date(),
    };
    memberships.findOne.mockResolvedValue({ organization });
    memberships.find.mockResolvedValue([]);
    leaveRequests.findOne.mockResolvedValue(leave);
    leaveRequests.save.mockImplementation(async (value: unknown) => value);
    exitPermissions.findOne.mockResolvedValue(null);
    exitPermissions.create.mockImplementation(
      (value: Record<string, unknown>) => ({ id: "exit-1", ...value }),
    );
    exitPermissions.save.mockImplementation(async (value: unknown) => value);
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
      realtime as any,
      { createForUsers: jest.fn() } as any,
      new SchoolAccessService({} as never, memberships as never),
    );

    await expect(
      service.reviewLeaveRequest(
        {
          id: "principal-1",
          username: "principal",
          role: "PRINCIPAL",
          sessionId: "s",
        },
        leave.id,
        { status: "APPROVED" },
      ),
    ).resolves.toMatchObject({
      exitPermissionId: "exit-1",
      status: "APPROVED",
    });
    expect(exitPermissions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        leaveRequest: leave,
        origin: "student_request",
        status: ExitPermissionStatus.APPROVED,
      }),
    );
  });

  it("keeps a departed student out until their return is staff-confirmed", async () => {
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
    const row = {
      id: "exit-1",
      organization,
      student: { id: "student-1", name: "Ali", user: { id: "student-user" } },
      destination: "خانه",
      reason: "ضروری",
      requestedDepartureAt: new Date("2025-02-01T08:00:00.000Z"),
      expectedReturnAt: null,
      actualDepartureAt: new Date("2025-02-01T10:00:00.000Z"),
      actualReturnAt: null,
      returnRequestedAt: null,
      returnRequestNote: "",
      returnVerifiedBy: null,
      returnVerifiedAt: null,
      note: "",
      status: "APPROVED",
      approver: null,
      reviewedAt: null,
      createdAt: new Date(),
    };
    memberships.findOne.mockResolvedValue({ organization });
    memberships.find.mockResolvedValue([{ user: { id: "gate-staff" } }]);
    exitPermissions.findOne.mockResolvedValue(row);
    exitPermissions.save.mockImplementation(async (value: unknown) => value);
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
      realtime as any,
      { createForUsers: jest.fn() } as any,
      new SchoolAccessService({} as never, memberships as never),
    );

    const returned = await service.requestExitReturn(
      {
        id: "student-user",
        username: "student",
        role: "STUDENT",
        sessionId: "s-1",
      },
      "exit-1",
      "رسیدم",
    );

    expect(returned.actualReturnAt).toBeNull();
    expect(returned.returnRequestedAt).not.toBeNull();
    expect(returned.returnRequestNote).toBe("رسیدم");
    expect(realtime.emitToUsers).toHaveBeenCalledWith(
      ["gate-staff"],
      "school.occupancy.updated",
      expect.objectContaining({
        action: "return-requested",
        organizationId: "org-1",
      }),
    );
  });

  it("lets a principal confirm an active departure as returned without a student return request", async () => {
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
    const row = {
      id: "exit-1",
      organization,
      student: { id: "student-1", name: "Ali", user: { id: "student-user" } },
      requestedDepartureAt: new Date("2025-02-01T08:00:00.000Z"),
      actualDepartureAt: new Date("2025-02-01T10:00:00.000Z"),
      actualReturnAt: null,
      returnRequestedAt: null,
      returnRequestNote: "",
      returnVerifiedBy: null,
      returnVerifiedAt: null,
      resolution: "outside_school" as const,
      status: ExitPermissionStatus.APPROVED,
      createdAt: new Date(),
    };
    const eventRepository = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn(async (value: unknown) => value),
    };
    memberships.findOne.mockResolvedValue({ organization });
    memberships.find.mockResolvedValue([]);
    exitPermissions.findOne.mockResolvedValue(row);
    exitPermissions.save.mockImplementation(async (value: unknown) => value);
    (exitPermissions as any).manager = {
      getRepository: jest.fn(() => eventRepository),
    };
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
      realtime as any,
      { createForUsers: jest.fn() } as any,
      new SchoolAccessService({} as never, memberships as never),
    );

    const result = await service.confirmStudentInSchool(
      {
        id: "principal-1",
        username: "principal",
        role: "PRINCIPAL",
        sessionId: "s",
      },
      "exit-1",
    );

    expect(result).toMatchObject({
      status: ExitPermissionStatus.COMPLETED,
      returnRequestedAt: null,
      returnVerifiedById: "principal-1",
      resolution: null,
    });
    expect(row.actualReturnAt).toBeInstanceOf(Date);
    expect(eventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "return_confirmed",
        note: "حضور دانش‌آموز در مدرسه توسط مدیر تأیید شد.",
      }),
    );
    expect(realtime.emitToUsers).toHaveBeenCalledWith(
      [],
      "school.occupancy.updated",
      expect.objectContaining({ action: "return-confirmed" }),
    );

    row.actualReturnAt = null;
    row.returnVerifiedBy = null;
    row.returnVerifiedAt = null;
    row.status = ExitPermissionStatus.APPROVED;
    await expect(
      service.confirmStudentInSchool(
        {
          id: "school-admin-1",
          username: "school-admin",
          role: "SCHOOL_ADMIN",
          sessionId: "s",
        },
        "exit-1",
      ),
    ).resolves.toMatchObject({
      status: ExitPermissionStatus.COMPLETED,
      returnVerifiedById: "school-admin-1",
    });
  });

  it("does not allow a supervisor to use the principal in-school confirmation", async () => {
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
      realtime as any,
      { createForUsers: jest.fn() } as any,
      new SchoolAccessService({} as never, memberships as never),
    );

    await expect(
      service.confirmStudentInSchool(
        {
          id: "supervisor-1",
          username: "supervisor",
          role: "SCHOOL_SUPERVISOR",
          sessionId: "s",
        },
        "exit-1",
      ),
    ).rejects.toMatchObject({
      status: 403,
      response: {
        ok: false,
        error: { code: "MOVEMENT_IN_SCHOOL_CONFIRMATION_FORBIDDEN" },
      },
    });
    expect(exitPermissions.findOne).not.toHaveBeenCalled();
  });
});
