# Registration Feature Deployment Guide

## Overview

This document provides comprehensive deployment instructions for the Registration Feature in the Bastak School platform. The feature is deployed as part of the admin application and follows the monorepo deployment strategy.

## Prerequisites

### Development Environment
- Node.js v18.17.0 or higher
- npm v9.6.7 or higher
- Git
- Docker (optional, for containerized deployment)

### Production Environment
- Linux server with Node.js v18.17.0+
- Nginx or similar reverse proxy
- PostgreSQL database (v14+ recommended)
- Redis cache (optional, for session management)
- SSL certificate for HTTPS

## Deployment Methods

### 1. Standard Monorepo Deployment

The Registration Feature is deployed as part of the main admin application:

```bash
# Build the admin application
npm run build:admin

# Deploy to production server
scp -r dist/admin/* user@production-server:/var/www/admin/
```

### 2. Containerized Deployment

Using Docker Compose:

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  admin-app:
    image: bastak/admin-app:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_BASE_URL=https://api.bastak-school.com
      - REGISTRATION_FEATURE_ENABLED=true
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=bastak_school
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=securepassword

  redis:
    image: redis:7-alpine
```

### 3. CI/CD Pipeline

GitHub Actions workflow for automated deployment:

```yaml
# .github/workflows/deploy-admin.yml
name: Deploy Admin Application

on:
  push:
    branches: [main]
    paths:
      - 'apps/admin/**'
      - 'packages/api-contract/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build admin application
      run: npm run build:admin
      
    - name: Deploy to production
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        source: "dist/admin/**"
        target: "/var/www/admin/"
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `REGISTRATION_FEATURE_ENABLED` | Enable/disable registration feature | Yes | `true` |
| `REGISTRATION_MAX_FILE_SIZE` | Maximum file size for document uploads (bytes) | No | `10485760` (10MB) |
| `REGISTRATION_DOCUMENT_TYPES` | Comma-separated list of allowed document types | No | `SHENASNAME,ID_CARD,BIRTH_CERTIFICATE,PHOTO` |
| `REGISTRATION_REQUIRE_CONSENTS` | Require all consent agreements to be accepted | No | `true` |
| `REGISTRATION_AUTO_COMPLETE` | Auto-complete registration after final section | No | `true` |

### Configuration File

Create `config/registration.config.json`:

```json
{
  "sections": {
    "basicInformation": {"required": true, "enabled": true},
    "identityInformation": {"required": true, "enabled": true},
    "documents": {"required": true, "enabled": true},
    "contactInformation": {"required": true, "enabled": true},
    "familyInformation": {"required": true, "enabled": true},
    "educationalBackground": {"required": true, "enabled": true},
    "healthInformation": {"required": true, "enabled": true},
    "extracurricularActivities": {"required": false, "enabled": true},
    "academicInterests": {"required": false, "enabled": true},
    "transportation": {"required": false, "enabled": true},
    "financialInformation": {"required": false, "enabled": true},
    "consentAndAgreements": {"required": true, "enabled": true},
    "emergencyContacts": {"required": true, "enabled": true},
    "academicHistory": {"required": false, "enabled": true},
    "registrationCompletion": {"required": true, "enabled": true}
  },
  "documentTypes": [
    {"id": "SHENASNAME", "name": "شناسنامه", "maxSize": 10485760},
    {"id": "ID_CARD", "name": "کارت ملی", "maxSize": 5242880},
    {"id": "BIRTH_CERTIFICATE", "name": "گواهینامه تولد", "maxSize": 5242880},
    {"id": "PHOTO", "name": "عکس شخصی", "maxSize": 2097152}
  ],
  "validationRules": {
    "nationalCode": "^[0-9]{10}$",
    "mobileNumber": "^09[0-9]{9}$",
    "email": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
  }
}
```

## Database Schema

The Registration Feature uses the following database tables:

### `students` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `national_code` | VARCHAR(10) | National identification code |
| `shenasname_number` | VARCHAR(10) | Birth certificate number |
| `first_name` | VARCHAR(100) | First name |
| `last_name` | VARCHAR(100) | Last name |
| `birth_date` | DATE | Date of birth |
| `gender` | ENUM | Gender (MALE, FEMALE, OTHER) |
| `education_level` | ENUM | Education level |
| `status` | ENUM | Registration status (DRAFT, IN_PROGRESS, COMPLETED, REJECTED) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `student_documents` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `student_id` | UUID | Foreign key to students table |
| `document_type` | VARCHAR(50) | Document type (SHENASNAME, ID_CARD, etc.) |
| `file_path` | VARCHAR(500) | Path to stored file |
| `original_file_name` | VARCHAR(255) | Original filename |
| `status` | ENUM | Document status (PENDING, SUBMITTED, APPROVED, REJECTED) |
| `uploaded_at` | TIMESTAMP | Upload timestamp |

## Monitoring and Logging

### Key Metrics to Monitor

- **Registration Completion Rate**: Percentage of started registrations that reach completion
- **Average Registration Time**: Time taken from start to completion
- **Section Drop-off Rates**: Which sections have highest abandonment rates
- **Document Upload Success Rate**: Percentage of successful document uploads
- **API Response Times**: For registration endpoints
- **Error Rates**: HTTP 5xx and client-side errors

### Log Levels

| Level | Purpose | Examples |
|-------|---------|----------|
| `INFO` | Normal operation | Registration started, section completed |
| `WARN` | Potential issues | Document upload warnings, validation warnings |
| `ERROR` | Critical failures | Database connection errors, API failures |
| `DEBUG` | Detailed debugging | Query execution details, state transitions |

## Rollback Procedure

In case of deployment issues:

1. **Immediate Rollback**: Restore previous version from backup
   ```bash
   # Restore from backup
   cp /backup/admin-v1.2.3/* /var/www/admin/
   systemctl restart nginx
   ```

2. **Database Rollback**: If schema changes were deployed
   ```sql
   -- Revert to previous schema
   ALTER TABLE students DROP COLUMN IF EXISTS new_column;
   ```

3. **Feature Flag Rollback**: Disable registration feature
   ```bash
   # Set environment variable
   export REGISTRATION_FEATURE_ENABLED=false
   systemctl restart admin-app
   ```

## Troubleshooting

### Common Issues

| Issue | Symptoms | Resolution |
|-------|----------|------------|
| **Slow Registration Load** | Long loading times for dashboard | Check database query performance, enable caching |
| **Document Upload Failures** | Files not uploading, 500 errors | Check file size limits, storage permissions, MIME type validation |
| **Form Validation Errors** | Unexpected validation failures | Verify regex patterns, check Persian character handling |
| **RTL Layout Issues** | Text alignment problems, mixed LTR/RTL | Check Tailwind RTL configuration, CSS direction properties |
| **Progress Calculation Errors** | Incorrect progress percentage | Verify section completion logic, check required field validation |

## License

MIT License