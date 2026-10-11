import type { OrganizationAuthProfile } from "@moshaver/api-contract";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { OrganizationMembership } from "./organization-membership.entity";

/**
 * Product organization types. Roles are assigned within one of these scopes;
 * school-only operational roles cannot be attached to a non-school tenant.
 */
export enum OrganizationType {
  SCHOOL = "SCHOOL",
  INSTITUTION = "INSTITUTION",
  ORGANIZATION = "ORGANIZATION",
}
export enum OrganizationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

@Entity("organizations")
export class Organization {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ length: 180 }) name!: string;
  @Column({ type: "varchar", length: 32 }) type!: OrganizationType;
  @Column({ type: "varchar", length: 20, default: OrganizationStatus.ACTIVE })
  status!: OrganizationStatus;
  @Column({ type: "simple-json", default: "[]" }) disabledFeatures!: string[];
  /** Platform delegates the organization admin's ability to operate signup. */
  @Column({ default: false }) studentSignupManagedByOrganization!: boolean;
  @Column({ default: false }) studentSignupEnabled!: boolean;
  /** Total self-service accounts permitted for this organization; zero is closed. */
  @Column({ type: "integer", default: 0 }) studentSignupLimit!: number;
  /** Atomically reserved on successful self-service signup. */
  @Column({ type: "integer", default: 0 }) studentSignupCount!: number;
  @Column({ type: "simple-json", nullable: true })
  authProfile!: OrganizationAuthProfile | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @OneToMany(
    () => OrganizationMembership,
    (membership) => membership.organization,
  )
  memberships!: OrganizationMembership[];
}
