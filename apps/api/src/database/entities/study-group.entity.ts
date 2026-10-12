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
import { EducationClass } from "./education-class.entity";
import { StudyGroupMembership } from "./study-group-membership.entity";

@Entity("study_groups")
@Index(["organization", "code"], { unique: true })
export class StudyGroup {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  /** A school class can be split into one or more class groups. */
  @ManyToOne(() => EducationClass, { nullable: true, onDelete: "CASCADE" })
  classroom?: EducationClass | null;

  @Column({ length: 80 })
  code!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ length: 24, default: "ACTIVE" })
  status!: "ACTIVE" | "ARCHIVED";

  @OneToMany(() => StudyGroupMembership, (membership) => membership.group)
  memberships!: StudyGroupMembership[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
