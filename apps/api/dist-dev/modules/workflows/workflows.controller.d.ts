import { AuthenticatedUser } from "../auth";
import { WorkflowsService } from "./workflows.service";
export declare class WorkflowsController {
    private readonly service;
    constructor(service: WorkflowsService);
    listStudentLeaveRequests(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            leaveType: string;
            reviewerRole: import("../../database/entities").LeaveRequestReviewerRole;
            startDate: string;
            endDate: string;
            reason: string;
            note: string;
            attachments: string[];
            status: import("../../database/entities").LeaveRequestStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        }[];
    }>;
    createStudentLeaveRequest(user: AuthenticatedUser, body: any): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            leaveType: string;
            reviewerRole: import("../../database/entities").LeaveRequestReviewerRole;
            startDate: string;
            endDate: string;
            reason: string;
            note: string;
            attachments: string[];
            status: import("../../database/entities").LeaveRequestStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        };
    }>;
    listLeaveRequests(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            leaveType: string;
            reviewerRole: import("../../database/entities").LeaveRequestReviewerRole;
            startDate: string;
            endDate: string;
            reason: string;
            note: string;
            attachments: string[];
            status: import("../../database/entities").LeaveRequestStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        }[];
    }>;
    reviewLeaveRequest(user: AuthenticatedUser, id: string, body: {
        status: string;
        note?: string;
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            leaveType: string;
            reviewerRole: import("../../database/entities").LeaveRequestReviewerRole;
            startDate: string;
            endDate: string;
            reason: string;
            note: string;
            attachments: string[];
            status: import("../../database/entities").LeaveRequestStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        };
    }>;
    listStudentExitPermissions(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            destination: string;
            reason: string;
            requestedDepartureAt: string;
            expectedReturnAt: string | null;
            actualDepartureAt: string | null;
            actualReturnAt: string | null;
            returnRequestedAt: string | null;
            returnRequestNote: string;
            returnVerifiedById: string | null;
            returnVerifiedAt: string | null;
            note: string;
            status: import("../../database/entities").ExitPermissionStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        }[];
    }>;
    createStudentExitPermission(user: AuthenticatedUser, body: any): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            destination: string;
            reason: string;
            requestedDepartureAt: string;
            expectedReturnAt: string | null;
            actualDepartureAt: string | null;
            actualReturnAt: string | null;
            returnRequestedAt: string | null;
            returnRequestNote: string;
            returnVerifiedById: string | null;
            returnVerifiedAt: string | null;
            note: string;
            status: import("../../database/entities").ExitPermissionStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        };
    }>;
    listExitPermissions(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            destination: string;
            reason: string;
            requestedDepartureAt: string;
            expectedReturnAt: string | null;
            actualDepartureAt: string | null;
            actualReturnAt: string | null;
            returnRequestedAt: string | null;
            returnRequestNote: string;
            returnVerifiedById: string | null;
            returnVerifiedAt: string | null;
            note: string;
            status: import("../../database/entities").ExitPermissionStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        }[];
    }>;
    reviewExitPermission(user: AuthenticatedUser, id: string, body: {
        status: string;
        note?: string;
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            destination: string;
            reason: string;
            requestedDepartureAt: string;
            expectedReturnAt: string | null;
            actualDepartureAt: string | null;
            actualReturnAt: string | null;
            returnRequestedAt: string | null;
            returnRequestNote: string;
            returnVerifiedById: string | null;
            returnVerifiedAt: string | null;
            note: string;
            status: import("../../database/entities").ExitPermissionStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        };
    }>;
    requestReturn(user: AuthenticatedUser, id: string, body: {
        note?: string;
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            destination: string;
            reason: string;
            requestedDepartureAt: string;
            expectedReturnAt: string | null;
            actualDepartureAt: string | null;
            actualReturnAt: string | null;
            returnRequestedAt: string | null;
            returnRequestNote: string;
            returnVerifiedById: string | null;
            returnVerifiedAt: string | null;
            note: string;
            status: import("../../database/entities").ExitPermissionStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        };
    }>;
    gateDeparture(user: AuthenticatedUser, body: {
        organizationId: string;
        phoneNumber: string;
        destination?: string;
        reason?: string;
        expectedReturnAt?: string;
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            destination: string;
            reason: string;
            requestedDepartureAt: string;
            expectedReturnAt: string | null;
            actualDepartureAt: string | null;
            actualReturnAt: string | null;
            returnRequestedAt: string | null;
            returnRequestNote: string;
            returnVerifiedById: string | null;
            returnVerifiedAt: string | null;
            note: string;
            status: import("../../database/entities").ExitPermissionStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        };
    }>;
    gateReturn(user: AuthenticatedUser, body: {
        organizationId: string;
        phoneNumber: string;
        note?: string;
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            destination: string;
            reason: string;
            requestedDepartureAt: string;
            expectedReturnAt: string | null;
            actualDepartureAt: string | null;
            actualReturnAt: string | null;
            returnRequestedAt: string | null;
            returnRequestNote: string;
            returnVerifiedById: string | null;
            returnVerifiedAt: string | null;
            note: string;
            status: import("../../database/entities").ExitPermissionStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        };
    }>;
    departure(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            destination: string;
            reason: string;
            requestedDepartureAt: string;
            expectedReturnAt: string | null;
            actualDepartureAt: string | null;
            actualReturnAt: string | null;
            returnRequestedAt: string | null;
            returnRequestNote: string;
            returnVerifiedById: string | null;
            returnVerifiedAt: string | null;
            note: string;
            status: import("../../database/entities").ExitPermissionStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        };
    }>;
    return(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            destination: string;
            reason: string;
            requestedDepartureAt: string;
            expectedReturnAt: string | null;
            actualDepartureAt: string | null;
            actualReturnAt: string | null;
            returnRequestedAt: string | null;
            returnRequestNote: string;
            returnVerifiedById: string | null;
            returnVerifiedAt: string | null;
            note: string;
            status: import("../../database/entities").ExitPermissionStatus;
            approverId: string | null;
            reviewedAt: string | null;
            createdAt: string;
        };
    }>;
    occupancy(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            organizationId: string;
            totalStudents: number;
            currentlyOut: number;
            currentlyInSchool: number;
            generatedAt: string;
        }[];
    }>;
    listStudentLetters(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            senderId: string | null;
            senderName: string | null;
            recipientId: string | null;
            recipientName: string | null;
            recipientRole: string;
            subject: string;
            body: string;
            attachments: string[];
            status: import("../../database/entities").RequestLetterStatus;
            priority: string;
            readAt: string | null;
            respondedAt: string | null;
            createdAt: string;
        }[];
    }>;
    createStudentLetter(user: AuthenticatedUser, body: any): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            senderId: string | null;
            senderName: string | null;
            recipientId: string | null;
            recipientName: string | null;
            recipientRole: string;
            subject: string;
            body: string;
            attachments: string[];
            status: import("../../database/entities").RequestLetterStatus;
            priority: string;
            readAt: string | null;
            respondedAt: string | null;
            createdAt: string;
        };
    }>;
    listLetters(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            senderId: string | null;
            senderName: string | null;
            recipientId: string | null;
            recipientName: string | null;
            recipientRole: string;
            subject: string;
            body: string;
            attachments: string[];
            status: import("../../database/entities").RequestLetterStatus;
            priority: string;
            readAt: string | null;
            respondedAt: string | null;
            createdAt: string;
        }[];
    }>;
    reviewLetter(user: AuthenticatedUser, id: string, body: {
        status?: string;
        read?: boolean;
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            senderId: string | null;
            senderName: string | null;
            recipientId: string | null;
            recipientName: string | null;
            recipientRole: string;
            subject: string;
            body: string;
            attachments: string[];
            status: import("../../database/entities").RequestLetterStatus;
            priority: string;
            readAt: string | null;
            respondedAt: string | null;
            createdAt: string;
        };
    }>;
}
