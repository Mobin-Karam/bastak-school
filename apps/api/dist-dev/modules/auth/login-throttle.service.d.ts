import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { LoginThrottle } from "../../database/entities/login-throttle.entity";
export declare class LoginThrottleService {
    private repo;
    private config;
    private failureQueue;
    constructor(repo: Repository<LoginThrottle>, config: ConfigService);
    private keys;
    assertAllowed(ip: string, identifier: string): Promise<void>;
    failure(ip: string, identifier: string): Promise<void>;
    private recordFailure;
    success(ip: string, identifier: string): Promise<void>;
}
