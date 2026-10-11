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
export class DormRoomAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne("DormRoom", (room: DormRoom) => room.assignments, {
    onDelete: "CASCADE",
  })
  room!: DormRoom;

  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  student!: Student;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
