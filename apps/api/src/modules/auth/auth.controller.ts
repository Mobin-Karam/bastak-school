import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FastifyReply, FastifyRequest } from "fastify";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ApiException } from "../../common/exceptions/api.exception";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser, AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CheckPhoneDto } from "./dto/check-phone.dto";
import { LoginDto } from "./dto/login.dto";
import {
  CreatePhoneNumberChangeRequestDto,
  ChangeOwnPhoneNumberDto,
  ReviewPhoneNumberChangeRequestDto,
} from "./dto/phone-number-change.dto";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";

type LoginPortal = "student" | "admin";

/** Only browser origins identify a portal. Native clients have no such host. */
export function loginPortalFromOrigin(
  origin: string | string[] | undefined,
): LoginPortal | undefined {
  if (typeof origin !== "string") return undefined;
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    if (hostname === "stud.sultano.ir" || hostname === "stud.localhost")
      return "student";
    if (hostname === "app.sultano.ir" || hostname === "app.localhost")
      return "admin";
  } catch {
    // CORS rejects malformed browser origins. Keep native API clients unaffected.
  }
  return undefined;
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("check-phone")
  async checkPhone(@Body() dto: CheckPhoneDto, @Req() req: FastifyRequest) {
    return ok(await this.auth.checkPhone(dto.phoneNumber, req.ip));
  }

  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.auth.login(
      dto.phoneNumber,
      dto.password,
      req.ip,
      loginPortalFromOrigin(req.headers?.origin),
    );
    this.setAuthCookies(res, result);
    return ok({
      user: {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
      },
      csrfToken: result.csrfToken,
      expiresAt: result.expiresAt,
      refreshExpiresAt: result.refreshExpiresAt,
    });
  }

  @Post("refresh")
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const refreshCookieName = this.config.get<string>(
      "refreshCookieName",
      "moshaver_v2_refresh",
    );
    const csrfToken = req.headers["x-csrf-token"];
    const result = await this.auth.refresh(
      req.cookies?.[refreshCookieName],
      typeof csrfToken === "string" ? csrfToken : undefined,
    );
    this.setAuthCookies(res, result);
    return ok({
      csrfToken: result.csrfToken,
      expiresAt: result.expiresAt,
      refreshExpiresAt: result.refreshExpiresAt,
    });
  }

  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user)
      throw new ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
    return ok(await this.auth.me(user));
  }

  @Post("change-password")
  async changePassword(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() dto: ChangePasswordDto,
  ) {
    if (!user)
      throw new ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
    return this.auth
      .changePassword(user, dto.currentPassword, dto.newPassword)
      .then(ok);
  }

  @Post("profile/phone")
  async changeOwnPhoneNumber(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() dto: ChangeOwnPhoneNumberDto,
  ) {
    if (!user)
      throw new ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
    return this.auth.changeOwnPhoneNumber(user, dto.phoneNumber).then(ok);
  }

  @Post("profile/phone-requests")
  async requestPhoneNumberChange(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() dto: CreatePhoneNumberChangeRequestDto,
  ) {
    if (!user)
      throw new ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
    return this.auth
      .createPhoneNumberChangeRequest(
        user,
        dto.organizationId,
        dto.phoneNumber,
        dto.reason,
      )
      .then(ok);
  }

  @Get("phone-change-requests")
  @RequireCapabilities("account_change_requests.read")
  phoneChangeRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    const organizationId = req.headers["x-organization-id"];
    return this.auth
      .listPhoneNumberChangeRequests(
        user,
        typeof organizationId === "string" ? organizationId : undefined,
      )
      .then(ok);
  }

  @Post("phone-change-requests/:id/approve")
  @RequireCapabilities("account_change_requests.manage")
  approvePhoneChange(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ReviewPhoneNumberChangeRequestDto,
  ) {
    return this.auth
      .reviewPhoneNumberChangeRequest(user, id, true, dto.reviewNote)
      .then(ok);
  }

  @Post("phone-change-requests/:id/reject")
  @RequireCapabilities("account_change_requests.manage")
  rejectPhoneChange(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ReviewPhoneNumberChangeRequestDto,
  ) {
    return this.auth
      .reviewPhoneNumberChangeRequest(user, id, false, dto.reviewNote)
      .then(ok);
  }

  @Post("logout")
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const cookieName = this.config.get<string>(
      "cookieName",
      "moshaver_v2_session",
    );
    const refreshCookieName = this.config.get<string>(
      "refreshCookieName",
      "moshaver_v2_refresh",
    );
    await this.auth.logout(
      req.cookies?.[cookieName],
      req.cookies?.[refreshCookieName],
      typeof req.headers["x-csrf-token"] === "string"
        ? req.headers["x-csrf-token"]
        : undefined,
    );
    res.clearCookie(cookieName, this.cookieOptions());
    res.clearCookie(refreshCookieName, this.cookieOptions());
    return ok({ loggedOut: true });
  }

  @Get("sessions")
  async sessions(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user)
      throw new ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
    return this.auth.listSessions(user).then(ok);
  }

  @Delete("sessions/:id")
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser | null,
    @Param("id") id: string,
  ) {
    if (!user)
      throw new ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
    return this.auth.revokeSession(user, id).then(ok);
  }

  private setAuthCookies(
    res: FastifyReply,
    result: {
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
      refreshExpiresAt: Date;
    },
  ) {
    const options = this.cookieOptions();
    res.setCookie(
      this.config.get<string>("cookieName", "moshaver_v2_session"),
      result.accessToken,
      { ...options, expires: result.expiresAt },
    );
    res.setCookie(
      this.config.get<string>("refreshCookieName", "moshaver_v2_refresh"),
      result.refreshToken,
      { ...options, expires: result.refreshExpiresAt },
    );
  }

  private cookieOptions() {
    const domain = this.config.get<string | undefined>("cookieDomain");
    return {
      path: "/",
      httpOnly: true,
      secure: this.config.get<boolean>("cookieSecure", false),
      sameSite: this.config.get<"lax" | "strict" | "none">(
        "cookieSameSite",
        "lax",
      ),
      ...(domain ? { domain } : {}),
    } as const;
  }
}
