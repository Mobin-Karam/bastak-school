import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mountedControllers } from "./mounted-controllers.mjs";

test("parity follows mounted modules and exact controller registrations", () => {
  const directory = mkdtempSync(join(tmpdir(), "bastak-parity-"));
  try {
    writeFileSync(
      join(directory, "app.module.ts"),
      'import { FeatureModule } from "./feature.module"; @Module({imports: [FeatureModule]}) export class AppModule {}',
    );
    writeFileSync(
      join(directory, "feature.module.ts"),
      'import { LiveController as MountedController, DormantController } from "./controllers"; @Module({controllers: [MountedController]}) export class FeatureModule {}',
    );
    writeFileSync(
      join(directory, "controllers.ts"),
      "export class LiveController {} export class DormantController {}",
    );
    writeFileSync(
      join(directory, "legacy.module.ts"),
      'import { DormantController } from "./controllers"; @Module({controllers: [DormantController]}) export class LegacyModule {}',
    );
    const result = mountedControllers(join(directory, "app.module.ts"));
    assert.equal(result.size, 1);
    assert.deepEqual([...result.get(join(directory, "controllers.ts"))], ["LiveController"]);
    writeFileSync(
      join(directory, "feature.module.ts"),
      "@Module({controllers: discoverControllers()}) export class FeatureModule {}",
    );
    assert.throws(
      () => mountedControllers(join(directory, "app.module.ts")),
      /Unsupported dynamic/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
