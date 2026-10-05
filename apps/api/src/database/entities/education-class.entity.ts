import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";
import { EducationClassBook } from "./education-class-book.entity";
import { EducationClassEnrollment } from "./education-class-enrollment.entity";

@Entity("education_classes")
@Index(["organization", "code"], { unique: true })
export class EducationClass {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  organization!: Organization;
  @Column({ length: 80 }) code!: string;
  @Column({ length: 160 }) name!: string;
  @Column({ length: 16 }) schoolYear!: string;
  @Column({ type: "integer" }) gradeId!: number;
  @Column({ length: 40 }) educationTypeId!: string;
  @Column({ length: 80 }) trackId!: string;
  @Column({ type: "integer", default: 35 }) capacity!: number;
  @Column({ length: 20, default: "ACTIVE" }) status!: "ACTIVE" | "ARCHIVED";
  @Column({ type: "text", default: "" }) description!: string;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  advisor?: User | null;
  @OneToMany(() => EducationClassBook, (book) => book.classroom)
  books!: EducationClassBook[];
  @OneToMany(
    () => EducationClassEnrollment,
    (enrollment) => enrollment.classroom,
  )
  enrollments!: EducationClassEnrollment[];
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
