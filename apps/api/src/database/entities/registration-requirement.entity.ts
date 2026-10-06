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

export const REGISTRATION_SECTIONS = [
  "BASIC_INFORMATION",
  "IDENTITY_INFORMATION",
  "ADDRESS_CONTACT",
  "PARENTS",
  "PREVIOUS_EDUCATION",
  "DOCUMENTS",
  "HEALTH",
  "VACCINATION",
  "INSURANCE",
  "CONSENTS",
  "TRANSPORT",
  "TUITION",
  "LEGAL_GUARDIAN",
  "EMERGENCY_CONTACT",
  "PHOTOGRAPHS",
] as const;
export type RegistrationSectionCode = (typeof REGISTRATION_SECTIONS)[number];

@Entity("registration_requirements")
@Index(["organization", "sectionCode"], { unique: true })
export class RegistrationRequirement {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { onDelete: "CASCADE" }) organization!: Organization;
  @Column({ length: 48 }) sectionCode!: RegistrationSectionCode;
  @Column({ default: true }) enabled!: boolean;
  @Column({ default: false }) required!: boolean;
  @Column({ type: "integer", default: 0 }) sortOrder!: number;
  @Column({ type: "text", default: "" }) announcement!: string;
  @Column({ type: "datetime", nullable: true }) opensAt?: Date | null;
  @Column({ type: "datetime", nullable: true }) closesAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
