import { Injectable } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { SmsBatchStatus, SmsCampaign, SmsCampaignBatch, SmsCampaignRecipient, SmsCampaignStatus, SmsRecipientStatus } from "../../database/entities/sms-campaign.entity";
import { User } from "../../database/entities/user.entity";
import { AuthorizationService, UserContext } from "../authorization";
import { AudienceCriteria, SmsAudienceService } from "./sms-audience.service";
import { SMS_PROVIDER, SmsProvider } from "./sms-provider";
import { Inject } from "@nestjs/common";
import { assertSmsManagementAuthority } from "./sms-access";

const MAX_MESSAGE_LENGTH = 2000;
const chunk = <T>(items: T[], size: number) => items.reduce<T[][]>((all, item, index) => { if (index % size === 0) all.push([]); all[all.length - 1].push(item); return all; }, []);
@Injectable()
export class SmsService {
  private readonly batchSize: number;
  constructor(private readonly db: DataSource, private readonly authorization: AuthorizationService, private readonly audience: SmsAudienceService, @Inject(SMS_PROVIDER) private readonly provider: SmsProvider) { this.batchSize = Math.max(1, Math.min(100, Number(process.env.SMSIR_MAX_BATCH_SIZE || 100))); }
  private require(context: UserContext, capability: string) { this.authorization.requireCapability(context, capability); assertSmsManagementAuthority(context); }
  async create(context: UserContext, actorId: string, body: { title?: unknown; messageText?: unknown; scheduledAt?: unknown; criteria?: AudienceCriteria }) {
    this.require(context, "sms.send"); const title = String(body.title || "").trim(); const messageText = String(body.messageText || "").trim();
    if (!title || !messageText || messageText.length > MAX_MESSAGE_LENGTH) throw new ApiException(400, "SMS_INVALID_MESSAGE", "عنوان و متن پیام معتبر نیست.");
    const scheduledAt = body.scheduledAt ? new Date(String(body.scheduledAt)) : null;
    if (scheduledAt && (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date())) throw new ApiException(400, "SMS_SCHEDULE_INVALID", "زمان ارسال باید در آینده باشد.");
    const criteria = body.criteria || {}; const audience = await this.audience.resolve(context, criteria); if (!audience.length) throw new ApiException(400, "SMS_AUDIENCE_EMPTY", "مخاطب واجد شرایطی یافت نشد.");
    const result = await this.db.transaction(async (manager) => {
      const actor = await manager.findOneByOrFail(User, { id: actorId });
      const campaign = await manager.save(SmsCampaign, manager.create(SmsCampaign, { createdBy: actor, title, messageText, criteria, scheduledAt, organization: criteria.organizationId ? ({ id: criteria.organizationId } as any) : null, totalRecipients: audience.length }));
      await manager.save(SmsCampaignRecipient, audience.map((item) => manager.create(SmsCampaignRecipient, { campaign, user: { id: item.userId } as User, mobileSnapshot: item.mobile, displayNameSnapshot: item.displayName, roleCodesSnapshot: item.roles, organizationIdSnapshot: item.organizationId })));
      await manager.save(AuditLog, manager.create(AuditLog, { user: actor, action: "SMS_CAMPAIGN_CREATED", entity: "sms_campaign", organizationId: criteria.organizationId || null, metadata: { campaignId: campaign.id, recipientCount: audience.length, roleCodes: criteria.roleCodes || [] } })); return campaign;
    }); return this.detail(context, result.id);
  }
  async detail(context: UserContext, id: string) { this.require(context, "sms.read"); const campaign = await this.db.getRepository(SmsCampaign).findOne({ where: { id }, relations: { organization: true, createdBy: true, recipients: true, batches: true } }); if (!campaign) throw new ApiException(404, "SMS_CAMPAIGN_NOT_FOUND", "کمپین یافت نشد."); if (campaign.organization?.id && !this.authorization.canAccessOrganization(context, campaign.organization.id, "sms.read")) throw new ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید."); return campaign; }
  async list(context: UserContext) { this.require(context, "sms.read"); const where = context.activeOrganizationId ? { organization: { id: context.activeOrganizationId } } : {}; return this.db.getRepository(SmsCampaign).find({ where, relations: { organization: true, createdBy: true }, order: { createdAt: "DESC" }, take: 50 }); }
  async send(context: UserContext, actorId: string, id: string, retryFailed = false) {
    this.require(context, retryFailed ? "sms.manage" : "sms.send"); const campaign = await this.detail(context, id);
    if ([SmsCampaignStatus.SENDING, SmsCampaignStatus.SENT, SmsCampaignStatus.CANCELLED].includes(campaign.status)) throw new ApiException(409, "SMS_CAMPAIGN_NOT_SENDABLE", "این کمپین قابل ارسال نیست.");
    const statuses = retryFailed ? [SmsRecipientStatus.FAILED] : [SmsRecipientStatus.PENDING]; const recipients = await this.db.getRepository(SmsCampaignRecipient).find({ where: { campaign: { id }, status: In(statuses) }, relations: { campaign: true } });
    if (!recipients.length) throw new ApiException(409, "SMS_NO_PENDING_RECIPIENT", "گیرنده‌ای برای ارسال مجدد وجود ندارد.");
    const scheduled = Boolean(campaign.scheduledAt && campaign.scheduledAt > new Date());
    await this.db.getRepository(SmsCampaign).update(id, { status: SmsCampaignStatus.SENDING, startedAt: new Date() });
    for (const [index, items] of chunk(recipients, this.batchSize).entries()) {
      const batch = await this.db.getRepository(SmsCampaignBatch).save({ campaign, sequence: campaign.batches.length + index + 1, recipientCount: items.length, status: SmsBatchStatus.PENDING, attemptCount: 1, startedAt: new Date() });
      try { const result = await this.provider.sendBulk(campaign.messageText, items.map((item) => item.mobileSnapshot), scheduled ? campaign.scheduledAt : null); await this.db.transaction(async (manager) => { await manager.update(SmsCampaignBatch, batch.id, { status: SmsBatchStatus.SUBMITTED, providerPackId: result.packId, cost: result.cost, completedAt: new Date() }); for (const [recipientIndex, recipient] of items.entries()) await manager.update(SmsCampaignRecipient, recipient.id, { status: SmsRecipientStatus.SUBMITTED, providerPackId: result.packId, providerMessageId: result.messageIds[recipientIndex] || null, submittedAt: new Date(), failureCode: null, failureMessage: null }); }); }
      catch (error) { const message = error instanceof Error ? error.message : "ارسال ناموفق بود."; await this.db.transaction(async (manager) => { await manager.update(SmsCampaignBatch, batch.id, { status: SmsBatchStatus.FAILED, errorCode: "SMS_PROVIDER_UNAVAILABLE", errorMessage: message, completedAt: new Date() }); await manager.update(SmsCampaignRecipient, { id: In(items.map((item) => item.id)) }, { status: SmsRecipientStatus.FAILED, failureCode: "SMS_PROVIDER_UNAVAILABLE", failureMessage: message }); }); }
    }
    const counts = await this.db.getRepository(SmsCampaignRecipient).createQueryBuilder("recipient").select("recipient.status", "status").addSelect("COUNT(*)", "count").where("recipient.campaignId = :id", { id }).groupBy("recipient.status").getRawMany<{ status: SmsRecipientStatus; count: string }>(); const submitted = Number(counts.find((item) => item.status === SmsRecipientStatus.SUBMITTED)?.count || 0); const failed = Number(counts.find((item) => item.status === SmsRecipientStatus.FAILED)?.count || 0); const status = scheduled ? SmsCampaignStatus.SCHEDULED : failed ? (submitted ? SmsCampaignStatus.PARTIAL : SmsCampaignStatus.FAILED) : SmsCampaignStatus.SENT;
    await this.db.getRepository(SmsCampaign).update(id, { status, submittedRecipients: submitted, failedRecipients: failed, completedAt: new Date() }); const actor = await this.db.getRepository(User).findOneByOrFail({ id: actorId }); await this.db.getRepository(AuditLog).save({ user: actor, action: retryFailed ? "SMS_CAMPAIGN_RETRIED" : "SMS_CAMPAIGN_SENT", entity: "sms_campaign", organizationId: campaign.organization?.id || null, metadata: { campaignId: id, submitted, failed } }); return this.detail(context, id);
  }
  status(context: UserContext) { this.require(context, "sms.manage"); return this.provider.status(); }
  async configureProvider(context: UserContext, actorId: string, input: { apiKey?: unknown; lineNumber?: unknown; enabled?: unknown; dryRun?: unknown }) {
    this.require(context, "sms.manage"); if (!context.roles.includes("PLATFORM_ADMIN")) throw new ApiException(403, "SMS_PROVIDER_CONFIGURATION_FORBIDDEN", "تنظیم ارائه‌دهنده فقط برای مدیر پلتفرم مجاز است.");
    const result = await (this.provider as any).configure(input); const actor = await this.db.getRepository(User).findOneByOrFail({ id: actorId }); await this.db.getRepository(AuditLog).save({ user: actor, action: "SMS_PROVIDER_CONFIGURED", entity: "sms_provider", metadata: { enabled: result.enabled, dryRun: result.dryRun, lineNumber: result.lineNumber } }); return result;
  }
  async cancel(context: UserContext, actorId: string, id: string) {
    this.require(context, "sms.manage"); const campaign = await this.detail(context, id); if (campaign.status !== SmsCampaignStatus.SCHEDULED) throw new ApiException(409, "SMS_CAMPAIGN_NOT_SCHEDULED", "فقط کمپین زمان‌بندی‌شده قابل لغو است.");
    const batches = await this.db.getRepository(SmsCampaignBatch).find({ where: { campaign: { id }, status: SmsBatchStatus.SUBMITTED } });
    for (const batch of batches) if (batch.providerPackId) await this.provider.cancelScheduled(batch.providerPackId);
    await this.db.transaction(async (manager) => { await manager.update(SmsCampaignBatch, { campaign: { id } }, { status: SmsBatchStatus.CANCELLED, completedAt: new Date() }); await manager.update(SmsCampaignRecipient, { campaign: { id }, status: SmsRecipientStatus.SUBMITTED }, { status: SmsRecipientStatus.CANCELLED }); await manager.update(SmsCampaign, id, { status: SmsCampaignStatus.CANCELLED, completedAt: new Date() }); });
    const actor = await this.db.getRepository(User).findOneByOrFail({ id: actorId }); await this.db.getRepository(AuditLog).save({ user: actor, action: "SMS_CAMPAIGN_CANCELLED", entity: "sms_campaign", organizationId: campaign.organization?.id || null, metadata: { campaignId: id } }); return this.detail(context, id);
  }
  async refreshStatus(context: UserContext, actorId: string, id: string) {
    this.require(context, "sms.manage"); const campaign = await this.detail(context, id); const batches = await this.db.getRepository(SmsCampaignBatch).find({ where: { campaign: { id }, status: SmsBatchStatus.SUBMITTED } });
    for (const batch of batches) { if (!batch.providerPackId) continue; const reports = await this.provider.reportPack(batch.providerPackId); for (const report of reports) await this.db.getRepository(SmsCampaignRecipient).update({ campaign: { id }, providerMessageId: report.messageId }, { providerDeliveryState: report.deliveryState, deliveredAt: report.deliveryDateTime ? new Date(report.deliveryDateTime) : null }); }
    const actor = await this.db.getRepository(User).findOneByOrFail({ id: actorId }); await this.db.getRepository(AuditLog).save({ user: actor, action: "SMS_DELIVERY_REFRESHED", entity: "sms_campaign", organizationId: campaign.organization?.id || null, metadata: { campaignId: id } }); return this.detail(context, id);
  }
}
