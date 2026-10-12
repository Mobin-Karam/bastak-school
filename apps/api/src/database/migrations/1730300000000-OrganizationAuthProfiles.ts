import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";
export class OrganizationAuthProfiles1730300000000 implements MigrationInterface {
  name = "OrganizationAuthProfiles1730300000000";
  async up(q: QueryRunner): Promise<void> {
    await q.addColumn(
      "organizations",
      new TableColumn({ name: "authProfile", type: "text", isNullable: true }),
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.dropColumn("organizations", "authProfile");
  }
}
