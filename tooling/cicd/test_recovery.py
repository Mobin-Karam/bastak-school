"""Real SQLite recovery checks. Only test-owned temporary files are touched."""
import os
import contextlib
import pathlib
import shutil
import sqlite3
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class RecoveryTests(unittest.TestCase):
    def test_recovery_preservation_regressions(self):
        result=subprocess.run(['node','--test',str(ROOT/'scripts/deploy/database-recovery.test.cjs')],
            env=dict(os.environ,NODE_PATH=str(ROOT/'apps/api/node_modules')),capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def run_helper(self, command, source, restored, cwd=None):
        env=dict(os.environ, NODE_PATH=str(ROOT/'apps/api/node_modules'),DATABASE_PATH=str(restored),NODE_ENV='test')
        return subprocess.run(['node',str(ROOT/'scripts/deploy/database-recovery.cjs'),command,str(source),str(restored)],cwd=cwd or ROOT/'apps/api',env=env,capture_output=True,text=True)

    def test_stdin_invocation_executes_recovery_instead_of_silently_skipping(self):
        with tempfile.TemporaryDirectory() as d:
            source=pathlib.Path(d)/'source.sqlite';backup=pathlib.Path(d)/'backup.sqlite'
            with contextlib.closing(sqlite3.connect(source)) as db, db:
                db.executescript("CREATE TABLE records(value TEXT);INSERT INTO records VALUES('retained');")
            env=dict(os.environ, NODE_PATH=str(ROOT/'apps/api/node_modules'))
            result=subprocess.run(['node','-','backup',str(source),str(backup)],
                input=(ROOT/'scripts/deploy/database-recovery.cjs').read_text(),env=env,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertIn('Snapshot restoration verified',result.stdout)
            self.assertTrue(backup.exists())
            self.assertTrue(pathlib.Path(str(backup)+'.restored').exists())

    def test_restore_preserves_rows_custom_schema_and_refuses_corruption(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d);source=p/'source.sqlite';backup=p/'backup.sqlite'
            with contextlib.closing(sqlite3.connect(source)) as db, db:
                db.executescript('''PRAGMA foreign_keys=ON;
                  CREATE TABLE parent(id TEXT PRIMARY KEY, value TEXT NOT NULL);
                  CREATE TABLE child(id TEXT PRIMARY KEY,parentId TEXT REFERENCES parent(id));
                  CREATE INDEX custom_value ON parent(value);
                  CREATE TRIGGER keep_parent BEFORE DELETE ON parent BEGIN SELECT RAISE(ABORT,'retained'); END;
                  INSERT INTO parent VALUES('fixture','retained');INSERT INTO child VALUES('fixture','fixture');''')
            result=self.run_helper('backup',source,backup);self.assertEqual(result.returncode,0,result.stderr)
            restored=pathlib.Path(str(backup)+'.restored')
            self.assertEqual(self.run_helper('verify',backup,restored).returncode,0)
            self.assertEqual(backup.stat().st_mode&0o777,0o600)
            result=self.run_helper('backup',source,backup);self.assertNotEqual(result.returncode,0)
            with contextlib.closing(sqlite3.connect(restored)) as db, db:db.execute("UPDATE parent SET value='changed'")
            self.assertNotEqual(self.run_helper('verify',backup,restored).returncode,0)
            shutil.copyfile(backup,restored)
            with contextlib.closing(sqlite3.connect(restored)) as db, db:db.execute("UPDATE child SET parentId='missing'")
            self.assertNotEqual(self.run_helper('verify',backup,restored).returncode,0)
            with contextlib.closing(sqlite3.connect(source)) as db:self.assertEqual(db.execute('SELECT value FROM parent').fetchone()[0],'retained')

    def test_pending_candidate_migration_preserves_restored_records(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d);source=p/'source.sqlite';backup=p/'backup.sqlite';restored=pathlib.Path(str(backup)+'.restored')
            env=dict(os.environ,DATABASE_PATH=str(source),NODE_ENV='test')
            script='''(async()=>{const ds=require('./dist/database/data-source').default;ds.setOptions({migrationsRun:false});await ds.initialize();ds.migrations=ds.migrations.filter(m=>m.name!=='PersistenceUniquenessAndReadIndexes1730800000000');await ds.runMigrations();await ds.query("CREATE TABLE ci_saved (id TEXT PRIMARY KEY,value TEXT)");await ds.query("INSERT INTO ci_saved VALUES('fixture','retained')");await ds.destroy();})().catch(()=>process.exit(1));'''
            result=subprocess.run(['node','-e',script],cwd=ROOT/'apps/api',env=env,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertEqual(self.run_helper('backup',source,backup).returncode,0)
            result=self.run_helper('rehearse',backup,restored);self.assertEqual(result.returncode,0,result.stderr)
            with contextlib.closing(sqlite3.connect(restored)) as db:
                self.assertEqual(db.execute('SELECT value FROM ci_saved').fetchone()[0],'retained')
                self.assertEqual(db.execute("SELECT count(*) FROM sqlite_master WHERE name='UQ_attendance_record_session_student'").fetchone()[0],1)
            with contextlib.closing(sqlite3.connect(source)) as db:
                self.assertEqual(db.execute("SELECT count(*) FROM sqlite_master WHERE name='UQ_attendance_record_session_student'").fetchone()[0],0)

    def test_data_transform_is_refused_without_touching_source(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d);source=p/'source.sqlite';backup=p/'backup.sqlite';restored=pathlib.Path(str(backup)+'.restored')
            with contextlib.closing(sqlite3.connect(source)) as db, db:
                db.executescript("CREATE TABLE ci_saved (id TEXT PRIMARY KEY,value TEXT);INSERT INTO ci_saved VALUES('fixture','retained');")
            self.assertEqual(self.run_helper('backup',source,backup).returncode,0)
            adapter=p/'dist/database';adapter.mkdir(parents=True)
            (adapter/'data-source.js').write_text("exports.default={initialize:async()=>{const db=new(require('better-sqlite3'))(process.env.DATABASE_PATH);db.prepare(\"UPDATE ci_saved SET value='changed'\").run();db.close();},destroy:async()=>{}};")
            self.assertNotEqual(self.run_helper('rehearse',backup,restored,cwd=p).returncode,0)
            with contextlib.closing(sqlite3.connect(source)) as db:self.assertEqual(db.execute('SELECT value FROM ci_saved').fetchone()[0],'retained')

    def test_additive_migration_preserves_old_columns_and_checks_declared_defaults(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d);source=p/'source.sqlite';backup=p/'backup.sqlite';restored=pathlib.Path(str(backup)+'.restored')
            with contextlib.closing(sqlite3.connect(source)) as db, db:
                db.executescript("CREATE TABLE education_classes (id TEXT PRIMARY KEY,name TEXT);CREATE TABLE migrations (id INTEGER PRIMARY KEY,name TEXT);INSERT INTO education_classes VALUES('class-1','Retained');")
            self.assertEqual(self.run_helper('backup',source,backup).returncode,0)
            adapter=p/'dist/database';adapter.mkdir(parents=True)
            (adapter/'data-source.js').write_text("""exports.default={initialize:async()=>{const db=new(require('better-sqlite3'))(process.env.DATABASE_PATH);db.exec(\"ALTER TABLE education_classes ADD COLUMN academicYearId TEXT; INSERT INTO migrations(name) VALUES('AcademicSchedulingFoundation1730900000000')\");db.close();},destroy:async()=>{}};""")
            result=self.run_helper('rehearse',backup,restored,cwd=p);self.assertEqual(result.returncode,0,result.stderr)
            with contextlib.closing(sqlite3.connect(restored)) as db:self.assertEqual(db.execute("SELECT id,name,academicYearId FROM education_classes").fetchone(),('class-1','Retained',None))

    def test_unexpected_added_column_is_refused_without_touching_source(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d);source=p/'source.sqlite';backup=p/'backup.sqlite';restored=pathlib.Path(str(backup)+'.restored')
            with contextlib.closing(sqlite3.connect(source)) as db, db:db.executescript("CREATE TABLE ci_saved (id TEXT PRIMARY KEY,value TEXT);CREATE TABLE migrations (id INTEGER PRIMARY KEY,name TEXT);INSERT INTO ci_saved VALUES('fixture','retained');")
            self.assertEqual(self.run_helper('backup',source,backup).returncode,0)
            adapter=p/'dist/database';adapter.mkdir(parents=True)
            (adapter/'data-source.js').write_text("""exports.default={initialize:async()=>{const db=new(require('better-sqlite3'))(process.env.DATABASE_PATH);db.exec(\"ALTER TABLE ci_saved ADD COLUMN surprise TEXT; INSERT INTO migrations(name) VALUES('UnknownMigration')\");db.close();},destroy:async()=>{}};""")
            result=self.run_helper('rehearse',backup,restored,cwd=p);self.assertNotEqual(result.returncode,0);self.assertIn('table=ci_saved',result.stderr)
            with contextlib.closing(sqlite3.connect(source)) as db:self.assertEqual(db.execute('SELECT value FROM ci_saved').fetchone()[0],'retained')

    def test_duplicate_and_null_records_are_compared_as_a_multiset(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d);source=p/'source.sqlite';backup=p/'backup.sqlite';restored=pathlib.Path(str(backup)+'.restored')
            with contextlib.closing(sqlite3.connect(source)) as db, db:db.executescript("CREATE TABLE ci_saved (id TEXT PRIMARY KEY,value TEXT);INSERT INTO ci_saved VALUES('one',NULL),('two',NULL);")
            self.assertEqual(self.run_helper('backup',source,backup).returncode,0)
            adapter=p/'dist/database';adapter.mkdir(parents=True)
            (adapter/'data-source.js').write_text("""exports.default={initialize:async()=>{const db=new(require('better-sqlite3'))(process.env.DATABASE_PATH);db.prepare(\"DELETE FROM ci_saved WHERE id='two'\").run();db.close();},destroy:async()=>{}};""")
            self.assertNotEqual(self.run_helper('rehearse',backup,restored,cwd=p).returncode,0)


if __name__=='__main__':unittest.main()
