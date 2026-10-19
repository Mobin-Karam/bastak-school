import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { EducationClass } from "./education-class.entity";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

export type SchoolAnnouncementAudience =
  | "STAFF"
  | "STUDENTS"
  | "CLASS"
  | "USERS";

@Entity("school_announcements")
@Index(["organization", "audience", "publishedAt"])
export class SchoolAnnouncement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Organization, {
    nullable: false,
    onDelete: "CASCADE",
  })
  organization!: Organization;

  @Column({ length: 16 })
  audience!: SchoolAnnouncementAudience;

  @ManyToOne(() => EducationClass, {
    nullable: true,
    onDelete: "CASCADE",
  })
  classroom?: EducationClass | null;

  @Column({ length: 180 })
  title!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ length: 48, default: "general" })
  category!: string;

  @Column({
    type: "varchar",
    length: 2048,
    nullable: true,
  })
  linkUrl?: string | null;

  @Column({
    type: "varchar",
    length: 2048,
    nullable: true,
  })
  mediaUrl?: string | null;

  @Column({
    type: "varchar",
    length: 16,
    nullable: true,
  })
  mediaType?: "VIDEO" | "AUDIO" | null;

  @Column({
    type: "varchar",
    length: 16,
    default: "ACTIVE",
  })
  status!: "DRAFT" | "ACTIVE" | "ARCHIVED";

  @Column({
    type: "datetime",
    nullable: true,
  })
  publishedAt?: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  expiresAt?: Date | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: "SET NULL",
  })
  createdBy?: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
