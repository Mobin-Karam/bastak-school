import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EducationBook } from "./education-book.entity";
import type { EducationClass } from "./education-class.entity";
import { User } from "./user.entity";

@Entity("education_class_books")
@Index(["classroom", "book"], { unique: true })
export class EducationClassBook {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne("EducationClass", (classroom: EducationClass) => classroom.books, {
    nullable: false,
    onDelete: "CASCADE",
  })
  classroom!: EducationClass;
  @ManyToOne(() => EducationBook, { nullable: false, onDelete: "RESTRICT" })
  book!: EducationBook;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  teacher!: User;
  @CreateDateColumn() createdAt!: Date;
}
