import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

export enum SmsCampaignStatus { DRAFT = "DRAFT", SCHEDULED = "SCHEDULED", SENDING = "SENDING", SENT = "SENT", PARTIAL = "PARTIAL", FAILED = "FAILED", CANCELLED = "CANCELLED" }
export enum SmsRecipientStatus { PENDING = "PENDING", SUBMITTED = "SUBMITTED", DELIVERED = "DELIVERED", FAILED = "FAILED", CANCELLED = "CANCELLED" }
export enum SmsBatchStatus { PENDING = "PENDING", SUBMITTED = "SUBMITTED", FAILED = "FAILED", CANCELLED = "CANCELLED" }

@Entity("sms_campaigns")
export class SmsCampaign {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @ManyToOne(() => Organization, { nullable: true, onDelete: "RESTRICT" }) organization?: Organization | null;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" }) createdBy!: User;
  @Column({ length: 140 }) title!: string;
  @Column({ type: "text" }) messageText!: string;
  @Column({ type: "varchar", length: 20, default: SmsCampaignStatus.DRAFT }) status!: SmsCampaignStatus;
  @Column({ type: "simple-json" }) criteria!: Record<string, unknown>;
  @Column({ type: "varchar", length: 32, default: "SMSIR" }) provider!: string;
  @Column({ type: "varchar", length: 32, nullable: true }) lineNumberSnapshot?: string | null;
  @Column({ default: 0 }) totalRecipients!: number;
  @Column({ default: 0 }) submittedRecipients!: number;
  @Column({ default: 0 }) failedRecipients!: number;
  @Column({ type: "real", nullable: true }) totalCost?: number | null;
  @Column({ type: "datetime", nullable: true }) scheduledAt?: Date | null;
  @Column({ type: "datetime", nullable: true }) startedAt?: Date | null;
  @Column({ type: "datetime", nullable: true }) completedAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @OneToMany(() => SmsCampaignRecipient, (recipient) => recipient.campaign) recipients!: SmsCampaignRecipient[];
  @OneToMany(() => SmsCampaignBatch, (batch) => batch.campaign) batches!: SmsCampaignBatch[];
}

@Entity("sms_campaign_recipients") @Unique(["campaign", "user"])
export class SmsCampaignRecipient {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @ManyToOne(() => SmsCampaign, (campaign) => campaign.recipients, { nullable: false, onDelete: "RESTRICT" }) campaign!: SmsCampaign;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" }) user!: User;
  @Column({ length: 11 }) mobileSnapshot!: string;
  @Column({ length: 220 }) displayNameSnapshot!: string;
  @Column({ type: "simple-json" }) roleCodesSnapshot!: string[];
  @Column({ type: "varchar", length: 36, nullable: true }) organizationIdSnapshot?: string | null;
  @Column({ type: "varchar", length: 20, default: SmsRecipientStatus.PENDING }) status!: SmsRecipientStatus;
  @Column({ type: "varchar", length: 120, nullable: true }) providerMessageId?: string | null;
  @Column({ type: "varchar", length: 120, nullable: true }) providerPackId?: string | null;
  @Column({ type: "varchar", length: 80, nullable: true }) failureCode?: string | null;
  @Column({ type: "varchar", length: 300, nullable: true }) failureMessage?: string | null;
  @Column({ type: "datetime", nullable: true }) submittedAt?: Date | null;
  @Column({ type: "integer", nullable: true }) providerDeliveryState?: number | null;
  @Column({ type: "datetime", nullable: true }) deliveredAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
}

@Entity("sms_campaign_batches") @Unique(["campaign", "sequence"])
export class SmsCampaignBatch {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @ManyToOne(() => SmsCampaign, (campaign) => campaign.batches, { nullable: false, onDelete: "RESTRICT" }) campaign!: SmsCampaign;
  @Column() sequence!: number;
  @Column({ type: "varchar", length: 20, default: SmsBatchStatus.PENDING }) status!: SmsBatchStatus;
  @Column() recipientCount!: number;
  @Column({ type: "varchar", length: 120, nullable: true }) providerPackId?: string | null;
  @Column({ type: "real", nullable: true }) cost?: number | null;
  @Column({ default: 0 }) attemptCount!: number;
  @Column({ type: "varchar", length: 80, nullable: true }) errorCode?: string | null;
  @Column({ type: "varchar", length: 300, nullable: true }) errorMessage?: string | null;
  @Column({ type: "datetime", nullable: true }) startedAt?: Date | null;
  @Column({ type: "datetime", nullable: true }) completedAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
