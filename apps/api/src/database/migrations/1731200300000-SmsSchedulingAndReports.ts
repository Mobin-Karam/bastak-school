import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive reporting facts; provider report values are retained without guessing vendor delivery-state semantics. */
export class SmsSchedulingAndReports1731200300000 implements MigrationInterface {
  name = "SmsSchedulingAndReports1731200300000";
  async up(q: QueryRunner) {
    await q.query('ALTER TABLE "sms_campaigns" ADD COLUMN "scheduledAt" datetime');
    await q.query('ALTER TABLE "sms_campaign_recipients" ADD COLUMN "providerDeliveryState" integer');
    await q.query('ALTER TABLE "sms_campaign_recipients" ADD COLUMN "deliveredAt" datetime');
  }
  async down(): Promise<void> { throw new Error("SMS scheduling and delivery report history is retained on rollback."); }
}
