import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { AttendanceSession } from "./attendance-session.entity";

@Entity("attendance_pools")
export class AttendancePool {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  organization!: Organization;
  @OneToOne(() => AttendanceSession, { onDelete: "CASCADE" })
  @JoinColumn()
  session!: AttendanceSession;
  @Column({ length: 160 }) place!: string;
  @Column({ type: "datetime" }) endsAt!: Date;
  @Column({ type: "datetime", nullable: true }) closedAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
}
