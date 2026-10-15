import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { SmsCampaign, SmsCampaignBatch, SmsCampaignRecipient } from "../../database/entities/sms-campaign.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { User } from "../../database/entities/user.entity";
import { SmsProviderConfiguration } from "../../database/entities/sms-provider-configuration.entity";
import { AuthorizationModule } from "../authorization/authorization.module";
import { SmsAudienceService } from "./sms-audience.service";
import { SmsController } from "./sms.controller";
import { SmsIrProvider, SMS_PROVIDER } from "./sms-provider";
import { SmsService } from "./sms.service";
@Module({ imports: [TypeOrmModule.forFeature([SmsCampaign, SmsCampaignRecipient, SmsCampaignBatch, SmsProviderConfiguration, AuditLog, User, UserRoleAssignment, OrganizationMembership]), AuthorizationModule], controllers: [SmsController], providers: [SmsAudienceService, SmsService, SmsIrProvider, { provide: SMS_PROVIDER, useExisting: SmsIrProvider }] }) export class SmsModule {}
