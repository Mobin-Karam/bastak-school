import {
  CreateDateColumn,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AttendanceSession } from "./attendance-session.entity";
import { User } from "./user.entity";

@Entity("attendance_session_reviews")
@Index("IDX_attendance_session_review_session_revision_date", [
  "session",
  "reviewedRevision",
  "reviewedAt",
])
@Index("IDX_attendance_session_review_date", ["reviewedAt"])
export class AttendanceSessionReview {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => AttendanceSession, { nullable: false, onDelete: "CASCADE" })
  session!: AttendanceSession;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  reviewer?: User | null;

  @Column({ type: "integer" })
  reviewedRevision!: number;

  @CreateDateColumn({ type: "datetime" })
  reviewedAt!: Date;
}
