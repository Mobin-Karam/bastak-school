import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { SignupThrottle } from "../../database/entities/signup-throttle.entity";
export declare class SignupThrottleService {
    private repo;
    private config;
    private queue;
    constructor(repo: Repository<SignupThrottle>, config: ConfigService);
    record(ip: string): Promise<void>;
    private recordAttempt;
}
