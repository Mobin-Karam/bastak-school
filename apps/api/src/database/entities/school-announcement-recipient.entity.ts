import { Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { SchoolAnnouncement } from "./school-announcement.entity";
import { User } from "./user.entity";

/**
 * Explicit recipients are the authority
 * for private school announcements.
 */
@Entity("school_announcement_recipients")
@Index(["announcement", "user"], { unique: true })
export class SchoolAnnouncementRecipient {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => SchoolAnnouncement, {
    nullable: false,
    onDelete: "CASCADE",
  })
  announcement!: SchoolAnnouncement;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "CASCADE",
  })
  user!: User;
}
