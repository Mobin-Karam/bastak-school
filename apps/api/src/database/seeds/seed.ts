import "reflect-metadata";
import dataSource from "../data-source";
import { seedSchool } from "./school-seed";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create development seed identities in production.");
  }

  // Use our new school seed instead of the old one
  await seedSchool();
}

main().catch((error) => {
  console.error(error);
  if (dataSource.isInitialized) void dataSource.destroy();
  process.exitCode = 1;
});
