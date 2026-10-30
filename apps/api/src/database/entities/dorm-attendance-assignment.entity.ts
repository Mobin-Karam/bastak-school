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

/** One school-wide dorm attendance assignment, independent from room attendants. */
@Entity("dorm_wide_attendance_delegates")
@Index("UQ_dorm_wide_attendance_delegate_org", ["organization"], {
  unique: true,
})
export class DormWideAttendanceDelegate {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  grantedBy?: User | null;

  @Column({ length: 10 }) startsOn!: string;
  @Column({ length: 10 }) endsOn!: string;
  @Column({ default: false }) revoked!: boolean;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

/** One room attendance assignment, independent from the school-wide attendant. */
@Entity("dorm_room_attendance_delegates")
@Index("UQ_dorm_room_attendance_delegate_room", ["room"], { unique: true })
export class DormRoomAttendanceDelegate {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  @ManyToOne(() => DormRoom, { nullable: false, onDelete: "CASCADE" })
  room!: DormRoom;

  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  grantedBy?: User | null;

  @Column({ length: 10 }) startsOn!: string;
  @Column({ length: 10 }) endsOn!: string;
  @Column({ default: false }) revoked!: boolean;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
