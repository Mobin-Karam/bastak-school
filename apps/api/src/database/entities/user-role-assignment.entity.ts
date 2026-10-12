import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { OrganizationMembership } from "./organization-membership.entity";
import { Role } from "./role.entity";
import { User } from "./user.entity";

@Entity("user_role_assignments")
@Index(["user", "role", "membership"], { unique: true })
export class UserRoleAssignment {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" }) user!: User;
  @ManyToOne(() => Role, { nullable: false, onDelete: "RESTRICT" }) role!: Role;
  @ManyToOne(
    () => OrganizationMembership,
    (membership) => membership.roleAssignments,
    { nullable: true, onDelete: "CASCADE" },
  )
  membership?: OrganizationMembership | null;
  @CreateDateColumn() createdAt!: Date;
}
