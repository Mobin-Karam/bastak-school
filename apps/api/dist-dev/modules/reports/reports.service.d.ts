import { Repository } from "typeorm";
import { DailyReport } from "../../database/entities/daily-report.entity";
import { RecoveryRequest, RecoveryRequestStatus } from "../../database/entities/recovery-request.entity";
import { Student } from "../../database/entities/student.entity";
import { CreateDailyReportDto } from "./dto/create-daily-report.dto";
import { CreateRecoveryRequestDto } from "./dto/create-recovery-request.dto";
import { AuthorizationService, UserContext } from "../authorization";
import { User } from "../../database/entities/user.entity";
export declare class ReportsService {
    private readonly reports;
    private readonly recoveries;
    private readonly students;
    private readonly authorization;
    private readonly users;
    constructor(reports: Repository<DailyReport>, recoveries: Repository<RecoveryRequest>, students: Repository<Student>, authorization: AuthorizationService, users: Repository<User>);
    saveReport(userId: string, dto: CreateDailyReportDto): Promise<DailyReport>;
    listReports(userId: string, limit?: string): Promise<DailyReport[]>;
    createRecovery(userId: string, dto: CreateRecoveryRequestDto): Promise<RecoveryRequest>;
    listRecovery(userId: string): Promise<RecoveryRequest[]>;
    reportsForStudent(context: UserContext, studentId: string): Promise<DailyReport[]>;
    recoveryForActor(context: UserContext): Promise<RecoveryRequest[]>;
    moderateRecovery(context: UserContext, id: string, status: RecoveryRequestStatus): Promise<RecoveryRequest>;
    private studentForUser;
}
