import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

@Entity("user_capability_grants")
@Index(["user", "organization", "capability"], { unique: true })
export class UserCapabilityGrant {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" }) user!: User;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;
  @Column({ length: 100 }) capability!: string;
  @CreateDateColumn() createdAt!: Date;
}
