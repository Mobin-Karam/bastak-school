import { transformSync } from "@babel/core";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

describe("Nest ESM test transform", () => {
  it("preserves package resolution relative to the ESM file without shadowing CJS require", () => {
    const filename = resolve(__dirname, "esm-fixture.js");
    const transformed = transformSync(
      `import { createRequire } from 'node:module';
       const require = createRequire(import.meta.url);
       export const resolved = require.resolve('reflect-metadata');`,
      {
        filename,
        plugins: [
          "@babel/plugin-transform-modules-commonjs",
          resolve(__dirname, "import-meta-url.cjs")
        ]
      }
    );
    const exports: { resolved?: string } = {};
    runInNewContext(transformed?.code ?? "", { exports, require, __filename: filename });
    expect(exports.resolved).toBe(require.resolve("reflect-metadata"));
  });
});
