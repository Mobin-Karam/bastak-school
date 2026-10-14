import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Plan } from "./plan.entity";
import { ExamAttempt } from "./exam-attempt.entity";
import { DailyReport } from "./daily-report.entity";
import { RecoveryRequest } from "./recovery-request.entity";
import { LearningItem } from "./learning-item.entity";
import { Organization } from "./organization.entity";
import { StudentProfile } from "./student-profile.entity";
import { EducationClassEnrollment } from "./education-class-enrollment.entity";

@Entity("students")
export class Student {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => User, (user) => user.student, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  user?: User | null;

  /** Primary school/organization owning this student record. */
  @ManyToOne(() => Organization, { nullable: true, onDelete: "SET NULL" })
  organization?: Organization | null;

  @Column({ length: 160 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 10, nullable: true })
  nationalCode?: string | null;

  @Column({ type: "integer", nullable: true })
  gradeId?: number | null;

  @Column({ length: 24, default: "school" })
  learnerProfile!: "school" | "independent";

  @Column({ type: "varchar", length: 32, nullable: true })
  independentType?: "adult" | "gap_year" | "homeschool" | "other" | null;

  @Column({ length: 120, default: "" })
  learningLevel!: string;

  @Column({ length: 40, default: "general" })
  educationTypeId!: string;

  @Column({ length: 80, default: "general" })
  trackId!: string;

  @Column({ default: "" })
  grade!: string;

  @Column({ default: "" })
  major!: string;

  @Column({ default: "" })
  targetUniversity!: string;

  @Column({ default: "" })
  targetField!: string;

  @Column({ default: "" })
  targetRank!: string;

  @Column({ default: "" })
  dailyCapacity!: string;

  @Column({ default: "active" })
  accountStatus!: "active" | "inactive" | "archived";

  @Column({ length: 32, default: "ASSIGNED" })
  onboardingStatus!: "PENDING_ASSIGNMENT" | "ASSIGNED";

  @Column({ length: 32, default: "ACCOUNT_CREATED" })
  registrationStatus!:
    | "ACCOUNT_CREATED"
    | "IN_PROGRESS"
    | "WAITING_REVIEW"
    | "NEEDS_CORRECTION"
    | "APPROVED"
    | "REJECTED"
    | "ACTIVE";

  @Column({ default: false })
  guardianChatReadOnly!: boolean;
  @Column({ type: "datetime", nullable: true })
  guardianChangedAt?: Date | null;

  // Extended fields for school registration
  // @Column({ type: "varchar", length: 20, nullable: true })
  // shenasnameNumber?: string | null;

  // @Column({ type: "datetime", nullable: true })
  // birthDate?: Date | null;

  // @Column({ length: 120, nullable: true })
  // birthPlace?: string | null;

  // @Column({ length: 120, nullable: true })
  // certificateIssuePlace?: string | null;

  // @Column({ length: 24, nullable: true })
  // gender?: string | null;

  // @Column({ length: 40, nullable: true })
  // educationLevel?: string | null;

  // @Column({ type: "text", nullable: true })
  // previousSchoolInfo?: string | null;

  // @Column({ type: "text", nullable: true })
  // schoolReport?: string | null;

  // @Column({ type: "text", nullable: true })
  // residenceAddress?: string | null;

  // @Column({ length: 10, nullable: true })
  // postalCode?: string | null;

  // @Column({ length: 24, nullable: true })
  // homePhone?: string | null;

  // @Column({ length: 24, nullable: true })
  // mobileNumber?: string | null;

  // @Column({ length: 160, nullable: true })
  // fatherName?: string | null;

  // @Column({ type: "varchar", length: 10, nullable: true })
  // fatherNationalCode?: string | null;

  // @Column({ length: 160, nullable: true })
  // fatherOccupation?: string | null;

  // @Column({ length: 160, nullable: true })
  // motherName?: string | null;

  // @Column({ type: "varchar", length: 10, nullable: true })
  // motherNationalCode?: string | null;

  // @Column({ length: 160, nullable: true })
  // motherOccupation?: string | null;

  // @Column({ type: "text", nullable: true })
  // legalGuardianInfo?: string | null;

  // @Column({ length: 24, nullable: true })
  // emergencyContact?: string | null;

  // @Column({ type: "boolean", default: false })
  // hasShenasnameImage!: boolean;

  // @Column({ type: "boolean", default: false })
  // hasNationalCardImage!: boolean;

  // @Column({ type: "boolean", default: false })
  // hasParentDocuments!: boolean;

  // @Column({ type: "boolean", default: false })
  // hasPersonalPhoto!: boolean;

  // @Column({ type: "boolean", default: false })
  // hasHealthRecord!: boolean;

  // @Column({ type: "boolean", default: false })
  // hasVaccinationRecord!: boolean;

  // @Column({ type: "boolean", default: false })
  // hasInsuranceInfo!: boolean;

  // @Column({ type: "boolean", default: false })
  // hasConsentForms!: boolean;

  // @Column({ type: "boolean", default: false })
  // hasTransportInfo!: boolean;

  // @Column({ type: "boolean", default: false })
  // hasTuitionInfo!: boolean;

  // @Column({ type: "boolean", default: false })
  // hasLegalGuardianSignature!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Plan, (plan) => plan.student)
  plans!: Plan[];

  @OneToMany(() => ExamAttempt, (attempt) => attempt.student)
  examAttempts!: ExamAttempt[];

  @OneToMany(() => DailyReport, (report) => report.student)
  dailyReports!: DailyReport[];

  @OneToMany(() => RecoveryRequest, (request) => request.student)
  recoveryRequests!: RecoveryRequest[];

  @OneToMany(() => LearningItem, (item) => item.student)
  learningItems!: LearningItem[];

  @OneToOne(() => StudentProfile, (profile) => profile.student)
  profile?: StudentProfile | null;

  @OneToMany(() => EducationClassEnrollment, (enrollment) => enrollment.student)
  enrollments?: EducationClassEnrollment[];
}
