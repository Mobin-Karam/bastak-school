import { CanActivate, ExecutionContext } from "@nestjs/common";
import { AuthService } from "../../modules/auth/auth.service";
export declare class CsrfGuard implements CanActivate {
    private readonly auth;
    constructor(auth: AuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
