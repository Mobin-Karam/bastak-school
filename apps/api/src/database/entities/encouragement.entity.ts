import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Student } from "./student.entity";
import { User } from "./user.entity";
@Entity("encouragements")
export class Encouragement {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index()
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;
  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  guardian!: User;
  @Column({ length: 500 }) message!: string;
  @Column({ length: 40, default: "SUPPORT" }) kind!: string;
  @CreateDateColumn() createdAt!: Date;
}
