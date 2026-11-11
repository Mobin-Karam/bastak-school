import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { EducationClassBook } from "./education-class-book.entity";
import { User } from "./user.entity";

/** A named assessment in one class book, created before any grades are recorded. */
@Entity("class_book_grade_sessions")
@Index(["classBook", "heldOn"])
export class ClassBookGradeSession {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => EducationClassBook, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  classBook!: EducationClassBook;
  @Column({ type: "varchar", length: 160 }) title!: string;
  @Column({ type: "varchar", length: 10 }) heldOn!: string;
  @Column({ type: "varchar", length: 500, default: "" }) description!: string;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  createdBy!: User;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
