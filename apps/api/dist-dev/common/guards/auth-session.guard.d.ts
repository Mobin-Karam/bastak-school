import { CanActivate, ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../../modules/auth/auth.service";
export declare class AuthSessionGuard implements CanActivate {
    private readonly auth;
    private readonly config;
    constructor(auth: AuthService, config: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private singleHeader;
    private cookieFromHeader;
}
