import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

/** Singleton server-side provider configuration. The API key is AES-GCM encrypted. */
@Entity("sms_provider_configuration")
export class SmsProviderConfiguration {
  @PrimaryColumn({ length: 32 }) id!: string;
  @Column({ type: "text", nullable: true }) encryptedApiKey?: string | null;
  @Column({ type: "varchar", length: 32, nullable: true }) lineNumber?: string | null;
  @Column({ default: false }) enabled!: boolean;
  @Column({ default: true }) dryRun!: boolean;
  @UpdateDateColumn() updatedAt!: Date;
}
