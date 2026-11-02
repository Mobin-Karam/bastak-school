import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";

/** Immutable, organization-scoped balance changes. A reversal is another row. */
@Entity("student_reward_ledger")
@Index("IDX_student_reward_ledger_student_created", ["student", "createdAt", "id"])
@Index("IDX_student_reward_ledger_organization_created", ["organization", "createdAt", "id"])
@Index("UQ_student_reward_ledger_request_scope", ["organization", "awardedBy", "requestId"], {
  unique: true,
  where: "requestId IS NOT NULL AND awardedById IS NOT NULL",
})
@Index("UQ_student_reward_ledger_source", ["sourceType", "sourceId"], {
  unique: true,
  where: "sourceId IS NOT NULL AND reversalOfId IS NULL",
})
export class StudentRewardLedger {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;

  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  awardedBy?: User | null;

  /** The original entry is retained; a linked opposite entry reverses it. */
  @ManyToOne(() => StudentRewardLedger, { nullable: true, onDelete: "RESTRICT" })
  reversalOf?: StudentRewardLedger | null;

  @Column({ type: "integer" }) points!: number;
  @Column({ type: "varchar", length: 40 }) sourceType!: string;
  @Column({ type: "varchar", nullable: true }) sourceId?: string | null;
  @Column({ type: "varchar", nullable: true }) contextType?: string | null;
  @Column({ type: "varchar", nullable: true }) contextId?: string | null;
  @Column({ type: "varchar", length: 200, nullable: true }) contextName?: string | null;
  @Column({ type: "varchar", nullable: true }) requestId?: string | null;
  @Column({ type: "text" }) reason!: string;
  @CreateDateColumn() createdAt!: Date;
}
