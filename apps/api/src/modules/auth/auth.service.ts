import { SessionCredentialService } from "@moshaver/cmb-auth";
import bcrypt from "bcryptjs";
import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, LessThan, Not, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { Session } from "../../database/entities/session.entity";
import { User, UserRole } from "../../database/entities/user.entity";
import { Student } from "../../database/entities/student.entity";
import { UserStatus } from "../../database/entities/user.entity";
import { AuthorizationService } from "../authorization";
import {
  MembershipStatus,
  OrganizationMembership,
} from "../../database/entities/organization-membership.entity";
import { OrganizationStatus } from "../../database/entities/organization.entity";
import { Organization } from "../../database/entities/organization.entity";
import { AccountChangeRequest } from "../../database/entities/account-change-request.entity";
import { LoginThrottleService } from "./login-throttle.service";
import {
  isIranianMobile,
  normalizeIranianMobile,
} from "../../common/utils/phone-number";

export type AuthenticatedUser = {
  id: string;
  username: string;
  role: string;
  sessionId: string;
  roles?: string[];
  capabilities?: string[];
  membershipIds?: string[];
  organizationIds?: string[];
  /** Explicit tenant selected through the Admin work-context header. */
  activeOrganizationId?: string;
};

export type LoginPortal = "student" | "admin";

@Injectable()
export class AuthService {
  private static readonly SELF_ACCOUNT_CHANGE_LIMIT = 3;
  private readonly credentials: SessionCredentialService;
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    private readonly config: ConfigService,
    @Optional()
    @InjectRepository(OrganizationMembership)
    private readonly memberships?: Repository<OrganizationMembership>,
    @Optional() private readonly authorization?: AuthorizationService,
    @Optional() private readonly throttle?: LoginThrottleService,
    @Optional()
    @InjectRepository(Organization)
    private readonly organizations?: Repository<Organization>,
    @Optional()
    @InjectRepository(AccountChangeRequest)
    private readonly accountChangeRequests?: Repository<AccountChangeRequest>,
  ) {
    this.credentials = new SessionCredentialService({
      accessTokenTtlMinutes: this.config.get<number>(
        "accessTokenTtlMinutes",
        15,
      ),
      refreshTokenTtlDays: this.config.get<number>("refreshTokenTtlDays", 30),
    });
  }

  async checkPhone(phoneNumber: string, ip = "unknown") {
    const normalized = normalizeIranianMobile(phoneNumber);
    if (!isIranianMobile(normalized))
      throw new ApiException(
        422,
        "INVALID_PHONE_NUMBER",
        "شماره همراه معتبر نیست.",
      );
    // Count every lookup, including matches, in a separate per-IP budget.
    // Do not allow phone discovery to consume or reset password-attempt limits.
    const lookupKey = `phone-lookup:${ip}`;
    await this.throttle?.assertAllowed(lookupKey, lookupKey);
    await this.throttle?.failure(lookupKey, lookupKey);
    const exists = await this.users.existsBy({ phoneNumber: normalized });
    return { exists };
  }

  async login(
    phoneNumber: string,
    password: string,
    ip = "unknown",
    portal?: LoginPortal,
  ) {
    const normalizedPhoneNumber = normalizeIranianMobile(phoneNumber);
    if (!isIranianMobile(normalizedPhoneNumber))
      throw new ApiException(
        422,
        "INVALID_PHONE_NUMBER",
        "شماره همراه معتبر نیست.",
      );
    await this.throttle?.assertAllowed(ip, normalizedPhoneNumber);
    const user = await this.users.findOne({
      where: { phoneNumber: normalizedPhoneNumber },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      await this.throttle?.failure(ip, normalizedPhoneNumber);
      throw new ApiException(
        401,
        "UNAUTHORIZED",
        "نام کاربری یا رمز عبور نادرست است.",
      );
    }
    const expectedPortal = portal ? await this.loginPortalFor(user) : undefined;
    if (portal && expectedPortal !== portal) {
      const destination =
        expectedPortal === "student"
          ? "https://stud.sultano.ir"
          : "https://app.sultano.ir";
      throw new ApiException(
        403,
        "PORTAL_DOMAIN_MISMATCH",
        `این حساب باید از طریق ${destination} وارد شود.`,
        { portalUrl: destination },
      );
    }
    if (user.status && user.status !== UserStatus.ACTIVE)
      throw new ApiException(
        403,
        "ACCOUNT_INACTIVE",
        "حساب کاربری غیرفعال یا بایگانی شده است.",
      );
    if (!(await this.hasUsableWorkContext(user)))
      throw new ApiException(
        403,
        "ACCOUNT_INACTIVE",
        "هیچ زمینه کاری فعال و معتبر برای این حساب وجود ندارد.",
      );

    const credentials = this.newCredentials();
    const session = await this.sessions.save(
      this.sessions.create({
        user,
        tokenHash: this.credentials.hash(credentials.accessToken),
        refreshTokenHash: this.credentials.hash(credentials.refreshToken),
        csrfToken: credentials.csrfToken,
        expiresAt: credentials.expiresAt,
        refreshExpiresAt: credentials.refreshExpiresAt,
      }),
    );
    await this.throttle?.success(ip, normalizedPhoneNumber);
    const now = new Date();
    await this.sessions.delete([
      { refreshExpiresAt: LessThan(now) },
      { refreshExpiresAt: IsNull(), expiresAt: LessThan(now) },
    ]);
    return { ...credentials, session, user };
  }

  private async loginPortalFor(
    user: Pick<User, "id" | "username" | "role">,
  ): Promise<LoginPortal> {
    const context = this.authorization
      ? await this.authorization.enrich({
          id: user.id,
          username: user.username,
          role: user.role,
          sessionId: "login-portal-check",
        })
      : null;
    const roles = context?.roles.length ? context.roles : [user.role];
    return roles.some((role) => role !== "STUDENT" && role !== "GUARDIAN")
      ? "admin"
      : "student";
  }

  async refresh(refreshToken?: string, csrfToken?: string) {
    return this.rotateRefreshSession(refreshToken, csrfToken, true);
  }

  /**
   * Restores a browser session after its short-lived access cookie has expired.
   * The controller limits this path to trusted browser origins and a preflighted
   * custom header; ordinary refreshes remain protected by the per-session CSRF token.
   */
  async bootstrapSession(refreshToken?: string) {
    return this.rotateRefreshSession(refreshToken, undefined, false);
  }

  private async rotateRefreshSession(
    refreshToken: string | undefined,
    csrfToken: string | undefined,
    requireCsrf: boolean,
  ) {
    if (!refreshToken || (requireCsrf && !csrfToken))
      throw new ApiException(
        401,
        "REFRESH_REQUIRED",
        "نشست شما منقضی شده است. دوباره وارد شوید.",
      );
    const session = await this.sessions.findOne({
      where: { refreshTokenHash: this.credentials.hash(refreshToken) },
      relations: { user: true },
    });
    if (
      !session ||
      !session.refreshExpiresAt ||
      session.refreshExpiresAt.getTime() <= Date.now()
    ) {
      throw new ApiException(
        401,
        "REFRESH_EXPIRED",
        "نشست شما منقضی شده است. دوباره وارد شوید.",
      );
    }
    if (
      requireCsrf &&
      !this.credentials.safeEqual(session.csrfToken, csrfToken!)
    )
      throw new ApiException(403, "CSRF", "نشست امنیتی نامعتبر است.");
    if (session.user.status && session.user.status !== UserStatus.ACTIVE) {
      await this.sessions.delete({ id: session.id });
      throw new ApiException(
        403,
        "ACCOUNT_INACTIVE",
        "حساب کاربری غیرفعال یا بایگانی شده است.",
      );
    }
    if (!(await this.hasUsableWorkContext(session.user))) {
      await this.sessions.delete({ id: session.id });
      throw new ApiException(
        403,
        "ACCOUNT_INACTIVE",
        "حساب دانش‌آموز غیرفعال یا بایگانی شده است.",
      );
    }
    const credentials = this.newCredentials();
    const oldRefreshTokenHash = session.refreshTokenHash;
    session.tokenHash = this.credentials.hash(credentials.accessToken);
    session.refreshTokenHash = this.credentials.hash(credentials.refreshToken);
    session.csrfToken = credentials.csrfToken;
    session.expiresAt = credentials.expiresAt;
    session.refreshExpiresAt = credentials.refreshExpiresAt;
    // Compare-and-swap consumes the old credential exactly once, including
    // concurrent callers that loaded it before the first rotation completed.
    const rotation = await this.sessions.update(
      { id: session.id, refreshTokenHash: oldRefreshTokenHash! },
      {
        tokenHash: session.tokenHash,
        refreshTokenHash: session.refreshTokenHash,
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt,
        refreshExpiresAt: session.refreshExpiresAt,
      },
    );
    if (rotation.affected !== 1)
      throw new ApiException(
        401,
        "REFRESH_EXPIRED",
        "نشست شما منقضی شده است. دوباره وارد شوید.",
      );
    return { ...credentials, session, user: session.user };
  }

  async userFromToken(
    token?: string,
    requestedRole?: string,
    requestedOrganizationId?: string,
  ): Promise<AuthenticatedUser | null> {
    if (!token) return null;
    const session = await this.sessions.findOne({
      where: { tokenHash: this.credentials.hash(token) },
      relations: { user: true },
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) return null;
    if (session.user.status && session.user.status !== UserStatus.ACTIVE)
      return null;
    if (!(await this.hasUsableWorkContext(session.user))) {
      await this.sessions.delete({ id: session.id });
      return null;
    }
    const base = {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      sessionId: session.id,
    };
    return this.authorization
      ? this.authorization.enrich(base, requestedRole, requestedOrganizationId)
      : {
          ...base,
          roles: [session.user.role],
          capabilities: [],
          membershipIds: [],
          organizationIds: [],
        };
  }

  async logout(token?: string, refreshToken?: string, csrfToken?: string) {
    const where = [
      ...(token ? [{ tokenHash: this.credentials.hash(token) }] : []),
      ...(refreshToken
        ? [{ refreshTokenHash: this.credentials.hash(refreshToken) }]
        : []),
    ];
    if (!where.length) return;
    const sessions = await this.sessions.find({ where });
    if (
      sessions.some(
        (session) =>
          !csrfToken ||
          !this.credentials.safeEqual(session.csrfToken, csrfToken),
      )
    )
      throw new ApiException(403, "CSRF", "نشست امنیتی نامعتبر است.");
    // Delete the verified rows only; a concurrent refresh must not make a new
    // credential eligible for deletion without its corresponding CSRF token.
    for (const session of sessions)
      await this.sessions.delete({
        id: session.id,
        tokenHash: session.tokenHash,
      });
  }

  async me(user: AuthenticatedUser) {
    const [session, account] = await Promise.all([
      this.sessions.findOne({ where: { id: user.sessionId } }),
      this.users.findOneBy({ id: user.id }),
    ]);
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      roles: user.roles,
      capabilities: user.capabilities,
      csrfToken: session?.csrfToken,
      phoneNumber: account?.phoneNumber ?? null,
      phoneNumberSelfServiceAvailable:
        user.capabilities?.includes("platform.phone.self.manage") ||
        this.isSelfServiceAccount(user),
      phoneNumberChangeAvailable:
        user.capabilities?.includes("platform.phone.self.manage") ||
        (account?.phoneNumberChangeCount ?? 0) < 3,
      phoneNumberChangeUnlimited: Boolean(
        user.capabilities?.includes("platform.phone.self.manage"),
      ),
      phoneNumberChangeCount: account?.phoneNumberChangeCount ?? 0,
      passwordChangeAvailable:
        user.capabilities?.includes("platform.phone.self.manage") ||
        !this.isSelfServiceAccount(user) ||
        (account?.passwordChangeCount ?? 0) < 3,
      passwordChangeCount: account?.passwordChangeCount ?? 0,
    };
  }

  async context(user: AuthenticatedUser, activeOrganizationId?: string) {
    const catalog = this.authorization
      ? await this.authorization.enrich(
          user as Required<AuthenticatedUser>,
          undefined,
          activeOrganizationId,
        )
      : null;
    const organizationIds =
      catalog?.organizationIds ?? user.organizationIds ?? [];
    const isPlatformAdmin = (catalog?.roles ?? user.roles ?? []).includes(
      "PLATFORM_ADMIN",
    );
    if (
      activeOrganizationId &&
      !organizationIds.includes(activeOrganizationId) &&
      !isPlatformAdmin
    )
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "به این سازمان دسترسی ندارید.",
      );
    const account = await this.users.findOne({ where: { id: user.id } });
    if (!this.authorization || !this.memberships)
      throw new ApiException(
        503,
        "CONTEXT_UNAVAILABLE",
        "اطلاعات دسترسی در دسترس نیست.",
      );
    const memberships = await this.memberships.find({
      where: {
        user: { id: user.id },
        status: MembershipStatus.ACTIVE,
        organization: { status: OrganizationStatus.ACTIVE },
      },
      relations: { organization: true },
      order: { joinedAt: "ASC", id: "ASC" },
    });
    const membershipsForContext = memberships.map((membership) => ({
      membershipId: membership.id,
      id: membership.organization.id,
      name: membership.organization.name,
      type: membership.organization.type,
    }));
    // A platform administrator may deliberately enter any active tenant
    // context. This is still authorized again by the request guard; exposing
    // the list here only powers the explicit tenant picker in Admin.
    const selectableOrganizations = isPlatformAdmin
      ? ((
          await this.organizations?.find({
            where: { status: OrganizationStatus.ACTIVE },
            order: { name: "ASC" },
          })
        )?.map((organization) => ({
          membershipId:
            membershipsForContext.find((item) => item.id === organization.id)
              ?.membershipId ?? "",
          id: organization.id,
          name: organization.name,
          type: organization.type,
        })) ?? [])
      : membershipsForContext;
    if (
      activeOrganizationId &&
      !selectableOrganizations.some((item) => item.id === activeOrganizationId)
    )
      throw new ApiException(
        404,
        "ORGANIZATION_NOT_FOUND",
        "سازمان فعال پیدا نشد.",
      );
    // A regular member must always receive a usable organization work context.
    // Without this fallback, members of more than one organization authenticate
    // successfully but make every scoped request without X-Organization-Id.
    const effectiveOrganizationId =
      activeOrganizationId ??
      (isPlatformAdmin
        ? undefined
        : (catalog?.activeOrganizationId ?? selectableOrganizations[0]?.id));
    const assignments = await this.authorization.enrich(
      user as Required<AuthenticatedUser>,
      undefined,
      effectiveOrganizationId,
    );
    const workContexts = await Promise.all(
      assignments.roles.map(async (role) => {
        const scoped = await this.authorization!.enrich(
          user as Required<AuthenticatedUser>,
          role,
          effectiveOrganizationId,
        );
        return { role, capabilities: scoped.capabilities };
      }),
    );
    return {
      user: {
        id: account!.id,
        username: account!.username,
        firstName: account!.firstName,
        lastName: account!.lastName,
        status: account!.status,
        isPlatformOwner: account!.isPlatformOwner,
        locale: account!.locale,
        timezone: account!.timezone,
      },
      roles: assignments.roles,
      capabilities: assignments.capabilities,
      workContexts,
      memberships: membershipsForContext,
      activeOrganization:
        selectableOrganizations.find(
          (item) => item.id === effectiveOrganizationId,
        ) ?? null,
      availableOrganizations: selectableOrganizations,
    };
  }

  async changePassword(
    user: AuthenticatedUser,
    currentPassword: string,
    newPassword: string,
  ) {
    this.assertEnglishPassword(newPassword);
    const account = await this.users.findOne({
      where: { id: user.id },
      select: { id: true, passwordHash: true, passwordChangeCount: true },
    });
    if (
      !account ||
      !(await bcrypt.compare(currentPassword, account.passwordHash))
    ) {
      throw new ApiException(401, "INVALID_CREDENTIALS", "رمز فعلی درست نیست.");
    }
    const passwordChangeCount = account.passwordChangeCount ?? 0;
    if (
      this.isSelfServiceAccount(user) &&
      passwordChangeCount >= AuthService.SELF_ACCOUNT_CHANGE_LIMIT
    )
      throw new ApiException(
        409,
        "PASSWORD_CHANGE_REQUEST_REQUIRED",
        "سقف تغییر مستقیم رمز تکمیل شده است؛ درخواست بررسی ثبت کنید.",
      );

    account.passwordHash = await bcrypt.hash(newPassword, 12);
    if (this.isSelfServiceAccount(user))
      account.passwordChangeCount = passwordChangeCount + 1;
    await this.users.save(account);
    await this.sessions.delete({
      user: { id: user.id },
      id: Not(user.sessionId),
    });
    return { changed: true, otherSessionsRevoked: true };
  }

  async changeOwnPhoneNumber(user: AuthenticatedUser, phoneNumber: string) {
    const account = await this.users.findOneBy({ id: user.id });
    if (!account)
      throw new ApiException(404, "USER_NOT_FOUND", "حساب کاربری پیدا نشد.");
    const canChangeAnyTime = user.capabilities?.includes(
      "platform.phone.self.manage",
    );
    if (!canChangeAnyTime && !this.isSelfServiceAccount(user))
      throw new ApiException(
        403,
        "PHONE_CHANGE_REVIEW_REQUIRED",
        "تغییر شماره این حساب باید توسط مدرسه بررسی شود.",
      );
    if (
      !canChangeAnyTime &&
      (account.phoneNumberChangeCount ?? 0) >=
        AuthService.SELF_ACCOUNT_CHANGE_LIMIT
    )
      throw new ApiException(
        409,
        "PHONE_CHANGE_REQUEST_REQUIRED",
        "برای تغییر دوباره شماره، درخواست ثبت کنید.",
      );
    const normalized = normalizeIranianMobile(phoneNumber);
    if (!isIranianMobile(normalized))
      throw new ApiException(
        422,
        "INVALID_PHONE_NUMBER",
        "شماره همراه معتبر نیست.",
      );
    const existing = await this.users.findOne({
      where: { phoneNumber: normalized },
    });
    if (existing && existing.id !== account.id)
      throw new ApiException(
        409,
        "PHONE_NUMBER_TAKEN",
        "این شماره همراه قبلاً استفاده شده است.",
      );
    account.phoneNumber = normalized;
    account.username = normalized;
    if (!canChangeAnyTime)
      account.phoneNumberChangeCount =
        (account.phoneNumberChangeCount ?? 0) + 1;
    await this.users.save(account);
    await this.sessions.delete({
      user: { id: user.id },
      id: Not(user.sessionId),
    });
    return {
      phoneNumber: account.phoneNumber,
      changed: true,
      otherSessionsRevoked: true,
      requiresReviewForNextChange:
        !canChangeAnyTime &&
        (account.phoneNumberChangeCount ?? 0) >=
          AuthService.SELF_ACCOUNT_CHANGE_LIMIT,
    };
  }

  async createPhoneNumberChangeRequest(
    user: AuthenticatedUser,
    organizationId: string,
    phoneNumber: string,
    reason?: string,
  ) {
    if (!this.accountChangeRequests || !this.organizations)
      throw new ApiException(
        503,
        "ACCOUNT_CHANGE_UNAVAILABLE",
        "سامانه درخواست تغییر در دسترس نیست.",
      );
    if (!this.isSelfServiceAccount(user))
      throw new ApiException(
        403,
        "FORBIDDEN",
        "این درخواست فقط برای دانش‌آموز، سرپرست و استاد است.",
      );
    if (!(user.organizationIds ?? []).includes(organizationId))
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "به این مدرسه دسترسی ندارید.",
      );
    const account = await this.users.findOneBy({ id: user.id });
    if (!account)
      throw new ApiException(404, "USER_NOT_FOUND", "حساب کاربری پیدا نشد.");
    if (
      (account.phoneNumberChangeCount ?? 0) <
      AuthService.SELF_ACCOUNT_CHANGE_LIMIT
    )
      throw new ApiException(
        409,
        "PHONE_CHANGE_DIRECT_AVAILABLE",
        "تا پیش از رسیدن به سقف تغییر مستقیم، شماره را مستقیماً تغییر دهید.",
      );
    const normalized = normalizeIranianMobile(phoneNumber);
    if (!isIranianMobile(normalized))
      throw new ApiException(
        422,
        "INVALID_PHONE_NUMBER",
        "شماره همراه معتبر نیست.",
      );
    const existing = await this.users.findOne({
      where: { phoneNumber: normalized },
    });
    if (existing && existing.id !== user.id)
      throw new ApiException(
        409,
        "PHONE_NUMBER_TAKEN",
        "این شماره همراه قبلاً استفاده شده است.",
      );
    const pending = await this.accountChangeRequests.findOne({
      where: {
        organization: { id: organizationId },
        user: { id: user.id },
        kind: "PHONE_NUMBER",
        status: "PENDING",
      },
    });
    if (pending)
      throw new ApiException(
        409,
        "PHONE_CHANGE_REQUEST_PENDING",
        "یک درخواست در انتظار بررسی دارید.",
      );
    const organization = await this.organizations.findOneBy({
      id: organizationId,
    });
    if (!organization)
      throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "مدرسه پیدا نشد.");
    const request = await this.accountChangeRequests.save(
      this.accountChangeRequests.create({
        organization,
        user: { id: user.id } as User,
        kind: "PHONE_NUMBER",
        requestedValue: normalized,
        reason: reason?.trim() || "",
      }),
    );
    return {
      id: request.id,
      status: request.status,
      requestedValue: request.requestedValue,
      createdAt: request.createdAt,
    };
  }

  async createPasswordChangeRequest(
    user: AuthenticatedUser,
    organizationId: string,
    currentPassword: string,
    newPassword: string,
    reason?: string,
  ) {
    this.assertEnglishPassword(newPassword);
    if (!this.accountChangeRequests || !this.organizations)
      throw new ApiException(
        503,
        "ACCOUNT_CHANGE_UNAVAILABLE",
        "سامانه درخواست تغییر در دسترس نیست.",
      );
    if (!this.isSelfServiceAccount(user))
      throw new ApiException(
        403,
        "FORBIDDEN",
        "این درخواست فقط برای دانش‌آموز، سرپرست و استاد است.",
      );
    if (!(user.organizationIds ?? []).includes(organizationId))
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "به این مدرسه دسترسی ندارید.",
      );
    const account = await this.users.findOne({
      where: { id: user.id },
      select: { id: true, passwordHash: true, passwordChangeCount: true },
    });
    if (
      !account ||
      !(await bcrypt.compare(currentPassword, account.passwordHash))
    )
      throw new ApiException(401, "INVALID_CREDENTIALS", "رمز فعلی درست نیست.");
    if (
      (account.passwordChangeCount ?? 0) < AuthService.SELF_ACCOUNT_CHANGE_LIMIT
    )
      throw new ApiException(
        409,
        "PASSWORD_CHANGE_DIRECT_AVAILABLE",
        "تا پیش از رسیدن به سقف تغییر مستقیم، رمز را مستقیماً تغییر دهید.",
      );
    const pending = await this.accountChangeRequests.findOne({
      where: {
        organization: { id: organizationId },
        user: { id: user.id },
        kind: "PASSWORD",
        status: "PENDING",
      },
    });
    if (pending)
      throw new ApiException(
        409,
        "PASSWORD_CHANGE_REQUEST_PENDING",
        "یک درخواست تغییر رمز در انتظار بررسی دارید.",
      );
    const organization = await this.organizations.findOneBy({
      id: organizationId,
    });
    if (!organization)
      throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "مدرسه پیدا نشد.");
    const request = await this.accountChangeRequests.save(
      this.accountChangeRequests.create({
        organization,
        user: { id: user.id } as User,
        kind: "PASSWORD",
        requestedValue: "",
        requestedSecretHash: await bcrypt.hash(newPassword, 12),
        reason: reason?.trim() || "",
      }),
    );
    return {
      id: request.id,
      status: request.status,
      createdAt: request.createdAt,
    };
  }

  async listPhoneNumberChangeRequests(
    user: AuthenticatedUser,
    organizationId?: string,
  ) {
    if (!this.accountChangeRequests || !this.authorization)
      throw new ApiException(
        503,
        "ACCOUNT_CHANGE_UNAVAILABLE",
        "سامانه درخواست تغییر در دسترس نیست.",
      );
    const context = await this.authorization.enrich(
      user,
      undefined,
      organizationId,
    );
    this.authorization.requireCapability(
      context,
      "account_change_requests.read",
    );
    const scope = organizationId ?? context.organizationIds[0];
    if (!scope)
      throw new ApiException(
        422,
        "ORGANIZATION_REQUIRED",
        "مدرسه فعال را انتخاب کنید.",
      );
    const requests = await this.accountChangeRequests.find({
      where: { organization: { id: scope } },
      relations: { user: true, organization: true },
      order: { createdAt: "DESC" },
    });
    return requests.map((request) => ({
      id: request.id,
      kind: request.kind,
      status: request.status,
      requestedValue: request.requestedValue,
      reason: request.reason,
      reviewNote: request.reviewNote,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      reviewedAt: request.reviewedAt,
      organization: {
        id: request.organization.id,
        name: request.organization.name,
      },
      user: {
        id: request.user.id,
        username: request.user.username,
        firstName: request.user.firstName,
        lastName: request.user.lastName,
      },
    }));
  }

  private assertEnglishPassword(password: string) {
    if (!/^[\x21-\x7E]+$/.test(password))
      throw new ApiException(
        422,
        "PASSWORD_ENGLISH_CHARACTERS_REQUIRED",
        "رمز جدید فقط باید از نویسه‌های انگلیسی تشکیل شود.",
      );
  }

  async reviewPhoneNumberChangeRequest(
    user: AuthenticatedUser,
    id: string,
    approved: boolean,
    reviewNote?: string,
  ) {
    if (!this.accountChangeRequests || !this.authorization)
      throw new ApiException(
        503,
        "ACCOUNT_CHANGE_UNAVAILABLE",
        "سامانه درخواست تغییر در دسترس نیست.",
      );
    const request = await this.accountChangeRequests.findOne({
      where: { id },
      relations: { organization: true, user: true },
      select: {
        id: true,
        kind: true,
        requestedValue: true,
        requestedSecretHash: true,
        status: true,
        reason: true,
        reviewNote: true,
        organization: { id: true, name: true },
        user: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          phoneNumberChangeCount: true,
          passwordChangeCount: true,
        },
      },
    });
    if (!request)
      throw new ApiException(
        404,
        "ACCOUNT_CHANGE_REQUEST_NOT_FOUND",
        "درخواست پیدا نشد.",
      );
    const context = await this.authorization.enrich(
      user,
      undefined,
      request.organization.id,
    );
    this.authorization.requireCapability(
      context,
      "account_change_requests.manage",
    );
    if (request.status !== "PENDING")
      throw new ApiException(
        409,
        "ACCOUNT_CHANGE_REQUEST_REVIEWED",
        "این درخواست قبلاً بررسی شده است.",
      );
    if (approved && request.kind === "PHONE_NUMBER") {
      const existing = await this.users.findOne({
        where: { phoneNumber: request.requestedValue },
      });
      if (existing && existing.id !== request.user.id)
        throw new ApiException(
          409,
          "PHONE_NUMBER_TAKEN",
          "این شماره همراه قبلاً استفاده شده است.",
        );
      request.user.phoneNumber = request.requestedValue;
      request.user.username = request.requestedValue;
      request.user.phoneNumberChangeCount =
        (request.user.phoneNumberChangeCount ?? 0) + 1;
      await this.users.save(request.user);
      await this.sessions.delete({ user: { id: request.user.id } });
    }
    if (approved && request.kind === "PASSWORD") {
      if (!request.requestedSecretHash)
        throw new ApiException(
          422,
          "PASSWORD_CHANGE_REQUEST_INVALID",
          "رمز درخواست‌شده معتبر نیست.",
        );
      request.user.passwordHash = request.requestedSecretHash;
      request.user.passwordChangeCount =
        (request.user.passwordChangeCount ?? 0) + 1;
      await this.users.save(request.user);
      await this.sessions.delete({ user: { id: request.user.id } });
    }
    request.status = approved ? "APPROVED" : "REJECTED";
    request.reviewNote = reviewNote?.trim() || "";
    request.reviewedBy = { id: user.id } as User;
    request.reviewedAt = new Date();
    await this.accountChangeRequests.save(request);
    return {
      id: request.id,
      status: request.status,
      reviewedAt: request.reviewedAt,
    };
  }

  async listSessions(user: AuthenticatedUser) {
    const sessions = await this.sessions.find({
      where: { user: { id: user.id } },
      order: { createdAt: "DESC" },
    });
    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.refreshExpiresAt ?? session.expiresAt,
      current: session.id === user.sessionId,
    }));
  }

  async revokeSession(user: AuthenticatedUser, id: string) {
    if (id === user.sessionId) {
      throw new ApiException(
        400,
        "CURRENT_SESSION",
        "برای خروج از نشست فعلی از دکمه خروج استفاده کنید.",
      );
    }
    const result = await this.sessions.delete({ id, user: { id: user.id } });
    return { id, revoked: Boolean(result.affected) };
  }

  async verifyCsrf(sessionId: string, csrfToken: string) {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session) return false;
    return this.credentials.safeEqual(session.csrfToken, csrfToken);
  }

  private newCredentials() {
    return this.credentials.issue();
  }

  private async hasUsableWorkContext(user: User) {
    if (this.authorization) {
      const context = await this.authorization.enrich({
        id: user.id,
        username: user.username,
        role: user.role,
        sessionId: "",
      });
      return context.roles.length > 0;
    }
    if (user.role !== UserRole.STUDENT) return true;
    const student = await this.students.findOne({
      where: { user: { id: user.id } },
    });
    return student?.accountStatus === "active";
  }

  /** Student, guardian, and teacher accounts can maintain their own sign-in details. */
  private isSelfServiceAccount(user: AuthenticatedUser) {
    return (user.roles ?? [user.role]).some(
      (role) => role === "STUDENT" || role === "GUARDIAN" || role === "TEACHER",
    );
  }
}
