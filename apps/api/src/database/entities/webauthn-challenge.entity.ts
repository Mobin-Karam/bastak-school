import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("webauthn_challenges")
@Index(["expiresAt"])
export class WebAuthnChallenge {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })
  user!: User | null;
  @Column({ type: "varchar", length: 24 }) purpose!:
    "registration" | "authentication";
  @Column({ type: "varchar", length: 1024 }) challenge!: string;
  @Column({ type: "varchar", length: 255 }) origin!: string;
  @Column({ type: "varchar", length: 255 }) rpId!: string;
  @Column({ type: "datetime" }) expiresAt!: Date;
  @CreateDateColumn() createdAt!: Date;
}
