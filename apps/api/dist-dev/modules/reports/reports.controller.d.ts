import { AuthenticatedUser } from "../auth";
import { CreateDailyReportDto } from "./dto/create-daily-report.dto";
import { CreateRecoveryRequestDto } from "./dto/create-recovery-request.dto";
import { ReportsService } from "./reports.service";
import { RecoveryRequestStatus } from "../../database/entities/recovery-request.entity";
export declare class ReportsController {
    private readonly reports;
    constructor(reports: ReportsService);
    saveReport(user: AuthenticatedUser, dto: CreateDailyReportDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").DailyReport;
    }>;
    listReports(user: AuthenticatedUser, limit?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").DailyReport[];
    }>;
    createRecovery(user: AuthenticatedUser, dto: CreateRecoveryRequestDto): Promise<{
        ok: boolean;
        data: import("../../database/entities/recovery-request.entity").RecoveryRequest;
    }>;
    listRecovery(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("../../database/entities/recovery-request.entity").RecoveryRequest[];
    }>;
    moderate(user: AuthenticatedUser, id: string, status: RecoveryRequestStatus): Promise<{
        ok: boolean;
        data: import("../../database/entities/recovery-request.entity").RecoveryRequest;
    }>;
    staffReports(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").DailyReport[];
    }>;
    private context;
}
