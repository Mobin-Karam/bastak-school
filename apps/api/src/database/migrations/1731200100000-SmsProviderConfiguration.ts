import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class SmsProviderConfiguration1731200100000 implements MigrationInterface {
  name = "SmsProviderConfiguration1731200100000";
  async up(q: QueryRunner) { const timestamp = q.connection.options.type === "postgres" ? "timestamp" : "datetime"; await q.createTable(new Table({ name: "sms_provider_configuration", columns: [{ name: "id", type: "varchar", length: "32", isPrimary: true }, { name: "encryptedApiKey", type: "text", isNullable: true }, { name: "lineNumber", type: "varchar", length: "32", isNullable: true }, { name: "enabled", type: "boolean", default: q.connection.options.type === "postgres" ? "false" : "0" }, { name: "dryRun", type: "boolean", default: q.connection.options.type === "postgres" ? "true" : "1" }, { name: "updatedAt", type: timestamp, default: "CURRENT_TIMESTAMP" }] })); }
  async down(): Promise<void> { throw new Error("Provider configuration is retained to prevent accidental credential loss."); }
}
