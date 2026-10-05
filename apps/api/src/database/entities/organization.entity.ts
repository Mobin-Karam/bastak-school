import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrganizationMembership } from "./organization-membership.entity";

export enum OrganizationType { SCHOOL="SCHOOL", ACADEMY="ACADEMY", COUNSELING_CENTER="COUNSELING_CENTER", PRIVATE_PRACTICE="PRIVATE_PRACTICE", OTHER="OTHER" }
export enum OrganizationStatus { ACTIVE="ACTIVE", INACTIVE="INACTIVE", ARCHIVED="ARCHIVED" }

@Entity("organizations")
export class Organization {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ length: 180 }) name!: string;
  @Column({ type: "varchar", length: 32 }) type!: OrganizationType;
  @Column({ type: "varchar", length: 20, default: OrganizationStatus.ACTIVE }) status!: OrganizationStatus;
  @Column({ type: "simple-json", default: "[]" }) disabledFeatures!: string[];
  /** Platform delegates the organization admin's ability to operate signup. */
  @Column({ default: false }) studentSignupManagedByOrganization!: boolean;
  @Column({ default: false }) studentSignupEnabled!: boolean;
  /** Total self-service accounts permitted for this organization; zero is closed. */
  @Column({ type: "integer", default: 0 }) studentSignupLimit!: number;
  /** Atomically reserved on successful self-service signup. */
  @Column({ type: "integer", default: 0 }) studentSignupCount!: number;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @OneToMany(() => OrganizationMembership, (membership) => membership.organization) memberships!: OrganizationMembership[];
}
