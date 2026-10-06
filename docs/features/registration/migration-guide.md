# Registration Feature Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from previous registration systems to the new Registration Feature. It covers database migrations, data import, configuration updates, and testing procedures.

## Migration Strategy

### Phased Approach

The migration follows a phased approach to minimize disruption:

| Phase | Duration | Description | Risk Level |
|-------|----------|-------------|------------|
| **Phase 1: Assessment** | 1 week | System analysis, data mapping, and planning | Low |
| **Phase 2: Configuration** | 2 weeks | Environment setup and configuration | Medium |
| **Phase 3: Data Migration** | 3 weeks | Database migration and data validation | High |
| **Phase 4: Testing** | 2 weeks | Comprehensive testing and validation | Medium |
| **Phase 5: Deployment** | 1 week | Production deployment and monitoring | High |

### Migration Types

- **Database Migration**: Schema changes and data transformation
- **Data Migration**: Importing existing student data
- **Configuration Migration**: Updating settings and preferences
- **UI Migration**: Transitioning from old interface to new registration system
- **Process Migration**: Updating administrative workflows

## Pre-Migration Checklist

### Technical Requirements

- [ ] Verify system requirements (Node.js v18+, PostgreSQL v14+)
- [ ] Ensure sufficient disk space for migration operations
- [ ] Backup current production database and files
- [ ] Set up staging environment identical to production
- [ ] Install required migration tools and dependencies
- [ ] Verify network connectivity between systems

### Data Preparation

- [ ] Audit current registration data quality
- [ ] Identify data mapping requirements between old and new systems
- [ ] Cleanse and standardize existing data
- [ ] Resolve data inconsistencies and duplicates
- [ ] Document data transformation rules
- [ ] Prepare sample data for testing

### Team Preparation

- [ ] Assign migration team roles and responsibilities
- [ ] Schedule migration windows with stakeholders
- [ ] Prepare rollback plan and emergency contacts
- [ ] Train staff on new registration system
- [ ] Communicate migration timeline to users
- [ ] Prepare user documentation and training materials

## Database Migration

### Schema Changes

The new Registration Feature requires these database schema changes:

#### New Tables

| Table | Purpose | Columns |
|-------|---------|---------|
| `students` | Student master data | `id`, `national_code`, `shenasname_number`, `first_name`, `last_name`, `birth_date`, `gender`, `education_level`, `status`, `created_at`, `updated_at` |
| `student_documents` | Document storage | `id`, `student_id`, `document_type`, `file_path`, `original_file_name`, `status`, `uploaded_at` |
| `registration_sections` | Section configuration | `id`, `section_id`, `name`, `description`, `required`, `enabled`, `order`, `created_at` |
| `consent_agreements` | Consent tracking | `id`, `student_id`, `agreement_type`, `accepted`, `accepted_at`, `ip_address`, `user_agent` |

#### Modified Tables

| Table | Changes | Impact |
|-------|---------|--------|
| `users` | Added `registration_role` column | Medium |
| `organizations` | Added `registration_enabled` flag | Low |
| `settings` | Added registration-specific configuration | Low |

### Migration Scripts

Create migration scripts in `migrations/registration/`:

```sql
-- migrations/registration/001_create_students_table.sql
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  national_code VARCHAR(10) UNIQUE NOT NULL,
  shenasname_number VARCHAR(10),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE,
  gender VARCHAR(20),
  education_level VARCHAR(50),
  status VARCHAR(20) DEFAULT 'DRAFT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_national_code ON students(national_code);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
```

```sql
-- migrations/registration/002_create_student_documents_table.sql
CREATE TABLE IF NOT EXISTS student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_type ON student_documents(document_type);
```

### Data Transformation Rules

| Source Field | Target Field | Transformation Rule | Example |
|--------------|--------------|----------------------|---------|
| `old_system.student_id` | `students.id` | Generate UUID | `123e4567-e89b-12d3-a456-426614174000` |
| `old_system.national_id` | `students.national_code` | Pad with zeros if needed | `1234567890` |
| `old_system.birth_cert_no` | `students.shenasname_number` | Extract digits only | `123456789` |
| `old_system.full_name` | `students.first_name`, `students.last_name` | Split on space | `علی اصغری` → `علی`, `اصغری` |
| `old_system.dob` | `students.birth_date` | Convert to Jalali date | `1384/01/15` |
| `old_system.gender` | `students.gender` | Map values | `M` → `MALE`, `F` → `FEMALE` |

## Data Migration Process

### Export Data from Legacy System

```bash
# Export from legacy MySQL database
mysqldump -u username -p --databases legacy_registration > legacy_data.sql

# Export CSV data
mysql -u username -p -e "SELECT * FROM students INTO OUTFILE '/tmp/students.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n'" legacy_registration
```

### Import Data to New System

```bash
# Import using PostgreSQL COPY command
psql -U admin -d bastak_school -c "\COPY students FROM '/tmp/students.csv' WITH (FORMAT CSV, HEADER TRUE);"

# Or use Node.js migration script
node scripts/migrate-registration-data.js --source=/tmp/students.csv --target=postgresql://admin:password@localhost:5432/bastak_school
```

### Data Validation Script

```javascript
// scripts/validate-migration.js
const { validateStudents, validateDocuments } = require('./validation-rules');

async function runValidation() {
  console.log('Starting migration validation...');
  
  const studentErrors = await validateStudents();
  const documentErrors = await validateDocuments();
  
  console.log(`Student validation errors: ${studentErrors.length}`);
  console.log(`Document validation errors: ${documentErrors.length}`);
  
  if (studentErrors.length > 0 || documentErrors.length > 0) {
    console.error('Migration validation failed!');
    process.exit(1);
  }
  
  console.log('Migration validation passed!');
}

runValidation();
```

## Configuration Migration

### Configuration Mapping

| Legacy Setting | New Setting | Migration Rule |
|----------------|-------------|----------------|
| `legacy.registration.enabled` | `REGISTRATION_FEATURE_ENABLED` | Direct mapping |
| `legacy.upload.max_size` | `REGISTRATION_MAX_FILE_SIZE` | Convert to bytes |
| `legacy.sections.required` | `REGISTRATION_REQUIRED_SECTIONS` | Comma-separated list |
| `legacy.ui.rtl` | `REGISTRATION_PERSIAN_SUPPORT` | Boolean conversion |
| `legacy.notifications.email` | `REGISTRATION_NOTIFICATIONS_ENABLED` | Boolean conversion |

### Configuration Update Script

```bash
#!/bin/bash
# scripts/update-configuration.sh

# Update environment variables
sed -i 's/LEGACY_REGISTRATION_ENABLED/REGISTRATION_FEATURE_ENABLED/g' .env
sed -i 's/LEGACY_UPLOAD_MAX_SIZE/REGISTRATION_MAX_FILE_SIZE/g' .env

# Update configuration file
jq '.registration.feature.enabled = true | .registration.upload.maxSize = 10485760' config/legacy.config.json > config/registration.config.json

echo "Configuration migration completed!"
```

## Testing Strategy

### Test Categories

| Test Type | Description | Tools | Success Criteria |
|-----------|-------------|-------|------------------|
| **Unit Tests** | Individual component functionality | Jest, React Testing Library | 95%+ coverage, all tests pass |
| **Integration Tests** | Component interactions and API integration | MSW, Jest | All critical paths covered |
| **End-to-End Tests** | Complete registration flow | Playwright, Cypress | All 15 sections functional |
| **Data Migration Tests** | Data integrity and transformation accuracy | Custom scripts | 100% data accuracy |
| **Performance Tests** | Response times and scalability | Artillery, k6 | < 2s response time |
| **Security Tests** | Vulnerability scanning and penetration testing | OWASP ZAP, Nessus | No critical vulnerabilities |
| **Accessibility Tests** | WCAG compliance and usability | axe-core, Lighthouse | AA compliance achieved |
| **Localization Tests** | Persian language and RTL support | Manual testing | Full Persian support |

### Test Data Requirements

- **Positive Test Cases**: Valid data for all 15 sections
- **Negative Test Cases**: Invalid inputs, edge cases, error conditions
- **Boundary Test Cases**: Minimum/maximum values, empty strings, special characters
- **Performance Test Cases**: 100+ concurrent users, large document uploads
- **Security Test Cases**: SQL injection, XSS, CSRF, authentication bypass
- **Accessibility Test Cases**: Screen reader compatibility, keyboard navigation, color contrast

## Deployment Plan

### Pre-Deployment Steps

1. **Final Backup**: Take complete backup of production system
2. **Staging Validation**: Verify migration on staging environment
3. **User Acceptance Testing**: Get sign-off from key stakeholders
4. **Communication**: Notify users about maintenance window
5. **Monitoring Setup**: Configure alerts and dashboards

### Deployment Steps

1. **Maintenance Mode**: Enable maintenance mode on production
2. **Database Migration**: Run database migration scripts
3. **Data Migration**: Import transformed data
4. **Configuration Update**: Apply new configuration settings
5. **Application Deployment**: Deploy new Registration Feature
6. **Smoke Testing**: Verify basic functionality
7. **Monitoring**: Monitor logs, metrics, and error rates
8. **Disable Maintenance**: Remove maintenance mode

### Post-Deployment Steps

1. **Validation**: Verify all registrations are accessible
2. **User Training**: Conduct training sessions for staff
3. **Documentation**: Update user guides and help resources
4. **Feedback Collection**: Gather user feedback and issues
5. **Optimization**: Tune performance based on real usage
6. **Monitoring**: Continue monitoring for 72 hours

## Rollback Procedure

### Immediate Rollback (Within 1 hour)

1. **Restore Database**: Restore from pre-migration backup
2. **Revert Application**: Deploy previous version
3. **Update Configuration**: Restore previous configuration
4. **Verify**: Confirm system is operational
5. **Communicate**: Inform stakeholders of rollback

### Extended Rollback (1-24 hours)

1. **Data Recovery**: Recover migrated data from backup
2. **Schema Reversion**: Run reverse migration scripts
3. **Application Reversion**: Deploy stable version
4. **Configuration Reversion**: Restore previous settings
5. **Testing**: Perform comprehensive testing
6. **Communication**: Provide detailed rollback report

### Rollback Commands

```bash
# Restore database from backup
pg_restore -U admin -d bastak_school /backups/pre-migration-20240115.dump

# Revert database migrations
npm run migrate:rollback -- --steps=2

# Deploy previous application version
git checkout v1.2.3 && npm run build && npm run deploy

# Restore configuration
cp /backups/config-20240115/* config/
```

## Troubleshooting Common Issues

### Issue: Data Migration Failures

**Symptoms**: Missing records, data corruption, foreign key violations

**Solutions**:
- Check data transformation rules for edge cases
- Verify source data quality and completeness
- Review migration logs for specific error messages
- Test migration on subset of data first
- Use transactional migration scripts

### Issue: Performance Degradation

**Symptoms**: Slow page loads, API timeouts, high CPU usage

**Solutions**:
- Optimize database queries and add missing indexes
- Implement caching for frequently accessed data
- Review document storage configuration
- Monitor and optimize memory usage
- Scale infrastructure as needed

### Issue: UI Rendering Problems

**Symptoms**: Layout issues, text alignment problems, missing elements

**Solutions**:
- Verify RTL configuration and CSS direction properties
- Check Persian font loading and rendering
- Test on different browsers and devices
- Review Tailwind CSS configuration
- Validate accessibility attributes

### Issue: Authentication Problems

**Symptoms**: Login failures, session timeouts, permission errors

**Solutions**:
- Verify authentication token handling and expiration
- Check role-based access control configuration
- Review session management settings
- Test with different user roles and permissions
- Verify API gateway configuration

## License

MIT License