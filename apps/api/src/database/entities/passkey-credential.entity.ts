import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("passkey_credentials")
@Index(["credentialId"], { unique: true })
@Index(["user", "createdAt"])
export class PasskeyCredential {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" }) user!: User;

  @Column({ type: "varchar", length: 1024 }) credentialId!: string;
  /** base64url encoded COSE public key; private key material never reaches this table. */
  @Column({ type: "text" }) publicKey!: string;
  @Column({ default: 0 }) counter!: number;
  @Column({ type: "simple-json", nullable: true }) transports!: string[] | null;
  @Column({ type: "varchar", length: 32, nullable: true }) deviceType!:
    string | null;
  @Column({ type: "boolean", default: false }) backedUp!: boolean;
  @Column({ type: "datetime", nullable: true }) lastUsedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}
