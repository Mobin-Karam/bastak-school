import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

export type AccountChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

@Entity("account_change_requests")
@Index(["organization", "status"])
export class AccountChangeRequest {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;
  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" }) user!: User;
  @Column({ length: 32 }) kind!: "PHONE_NUMBER" | "PASSWORD";
  @Column({ length: 32 }) requestedValue!: string;
  /** bcrypt hash for a requested password; plaintext passwords are never stored. */
  @Column({ type: "varchar", length: 255, nullable: true, select: false })
  requestedSecretHash?: string | null;
  @Column({ type: "varchar", length: 16, default: "PENDING" })
  status!: AccountChangeRequestStatus;
  @Column({ type: "text", default: "" }) reason!: string;
  @Column({ type: "text", default: "" }) reviewNote!: string;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  reviewedBy?: User | null;
  @Column({ type: "datetime", nullable: true }) reviewedAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
