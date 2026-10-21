// Run inside the candidate image. Create a populated database at the schema
// immediately before the migrations guarded by database-recovery.cjs.
const pending = new Set([
  "AcademicSchedulingFoundation1730900000000",
  "TimetableImportIdempotency1731000000000",
  "TimetableImportSourceRows1731100000000",
  "AttendanceSubjectSnapshots1731200400000",
  "AttendanceCorrectionReview1731300000000",
  "AttendanceAcademicSnapshots1731300100000",
  "AttendanceCorrectionReviewIntegrity1731300300000",
]);

async function main() {
  const dataSource = require(
    process.cwd() + "/dist/database/data-source.js",
  ).default;
  dataSource.setOptions({ migrationsRun: false });
  await dataSource.initialize();
  const available = new Set(dataSource.migrations.map(({ name }) => name));
  for (const name of pending)
    if (!available.has(name))
      throw new Error(`Upgrade fixture migration missing: ${name}`);
  dataSource.migrations = dataSource.migrations.filter(
    ({ name }) => !pending.has(name),
  );
  await dataSource.runMigrations();
  // These rows model records already present on the released schema. The
  // academic migration must add a NULL foreign key without altering them.
  await dataSource.query(
    `INSERT INTO organizations (id,name,type) VALUES ('upgrade-org','Upgrade fixture','SCHOOL')`,
  );
  await dataSource.query(
    `INSERT INTO education_classes (id,code,name,schoolYear,gradeId,educationTypeId,trackId,organizationId)
     VALUES ('upgrade-class','upgrade-class','Upgrade fixture','1405',1,'general','general','upgrade-org')`,
  );
  await dataSource.destroy();
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
