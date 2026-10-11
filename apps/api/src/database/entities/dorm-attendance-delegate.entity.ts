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
import { DormRoom } from "./dorm-room.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";

/** One current responsibility per room; replacements/revocations are preserved in audit. */
@Entity("dorm_attendance_delegates")
@Index(["room"], { unique: true })
export class DormAttendanceDelegate {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  organization!: Organization;
  @ManyToOne(() => DormRoom, { onDelete: "CASCADE" }) room!: DormRoom;
  @ManyToOne(() => Student, { onDelete: "CASCADE" }) student!: Student;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  grantedBy?: User | null;
  @Column({ length: 10 }) startsOn!: string;
  @Column({ length: 10 }) endsOn!: string;
  @Column({ default: false }) dormWide!: boolean;
  @Column({ default: false }) revoked!: boolean;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
