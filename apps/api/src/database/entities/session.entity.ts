import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("sessions")
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: "CASCADE" })
  user!: User;

  @Index({ unique: true })
  @Column()
  tokenHash!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", nullable: true })
  refreshTokenHash!: string | null;

  @Column()
  csrfToken!: string;

  @Index()
  @Column()
  expiresAt!: Date;

  @Index()
  @Column({ type: "datetime", nullable: true })
  refreshExpiresAt!: Date | null;

  /** Updated on authenticated use so the user can identify their current and last active devices. */
  @Column({ type: "datetime", nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
