import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { DormRoom } from "./dorm-room.entity";
import { Student } from "./student.entity";

@Entity("dorm_room_assignments")
@Index(["room", "student"], { unique: true })
@Index("UQ_dorm_assignment_student", ["student"], { unique: true })
export class DormRoomAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne("DormRoom", (room: DormRoom) => room.assignments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  room!: DormRoom;

  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
