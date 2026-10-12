import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

export enum RequestLetterStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  RECEIVED = "RECEIVED",
  UNDER_REVIEW = "UNDER_REVIEW",
  ANSWERED = "ANSWERED",
  REJECTED = "REJECTED",
  CLOSED = "CLOSED",
}

@Entity("request_letters")
export class RequestLetter {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  sender?: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  recipient?: User | null;

  @Column({ length: 120, default: "" })
  recipientRole!: string;

  @Column({ length: 200 })
  subject!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "simple-array", default: "" })
  attachments!: string[];

  @Column({ type: "varchar", length: 18, default: RequestLetterStatus.DRAFT })
  status!: RequestLetterStatus;

  @Column({ type: "varchar", length: 24, default: "normal" })
  priority!: string;

  @Column({ type: "datetime", nullable: true })
  readAt?: Date | null;

  @Column({ type: "datetime", nullable: true })
  respondedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
