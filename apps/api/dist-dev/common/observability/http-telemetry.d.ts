import type { FastifyInstance } from "fastify";
export declare function correlationId(value: unknown): string;
export declare function registerHttpTelemetry(server: FastifyInstance, emit: (entry: object) => void): void;
