#!/usr/bin/env bash

set -euo pipefail

ROOT="postman"

echo "Creating Postman workspace structure in ./${ROOT} ..."

mkdir -p \
  "$ROOT/collections/00-health" \
  "$ROOT/collections/01-auth" \
  "$ROOT/collections/02-organizations" \
  "$ROOT/collections/03-users" \
  "$ROOT/collections/04-registration" \
  "$ROOT/collections/05-onboarding" \
  "$ROOT/collections/06-students" \
  "$ROOT/collections/07-attendance/class" \
  "$ROOT/collections/07-attendance/dormitory" \
  "$ROOT/collections/07-attendance/study-group" \
  "$ROOT/collections/08-roles-permissions" \
  "$ROOT/collections/09-notifications" \
  "$ROOT/collections/10-reports" \
  "$ROOT/collections/99-admin-system" \
  "$ROOT/documents" \
  "$ROOT/environments" \
  "$ROOT/flows/student-registration" \
  "$ROOT/flows/student-login" \
  "$ROOT/flows/attendance-flow" \
  "$ROOT/globals" \
  "$ROOT/mocks" \
  "$ROOT/scripts" \
  "$ROOT/specs"

cat > "$ROOT/environments/local.yaml" <<'EOF'
name: Local
values:
  baseUrl: http://localhost:4000

  organizationId: ""
  userId: ""
  studentId: ""
  membershipId: ""
  roleId: ""

  attendanceSessionId: ""
  classId: ""
  dormitoryRoomId: ""
  studyGroupId: ""

  phone: "09123456789"
  password: "test-password"

  accessToken: ""
  refreshToken: ""
  csrfToken: ""
EOF

cat > "$ROOT/environments/staging.yaml" <<'EOF'
name: Staging
values:
  baseUrl: https://staging.example.com

  organizationId: ""
  userId: ""
  studentId: ""
  membershipId: ""
  roleId: ""

  attendanceSessionId: ""
  classId: ""
  dormitoryRoomId: ""
  studyGroupId: ""

  accessToken: ""
  refreshToken: ""
  csrfToken: ""
EOF

cat > "$ROOT/environments/production.yaml" <<'EOF'
name: Production
values:
  baseUrl: https://api.example.com

  organizationId: ""
  userId: ""
  studentId: ""
  membershipId: ""
  roleId: ""

  attendanceSessionId: ""
  classId: ""
  dormitoryRoomId: ""
  studyGroupId: ""

  accessToken: ""
  refreshToken: ""
  csrfToken: ""
EOF

cat > "$ROOT/globals/workspace.globals.yaml" <<'EOF'
name: Workspace Globals
values:
  apiVersion: v1
  locale: fa
  timezone: Asia/Tehran
EOF

cat > "$ROOT/documents/api-notes.md" <<'EOF'
# API Notes

## Base URL

Local:

```text
{{baseUrl}}
```

Example:

```text
http://localhost:4000
```

## Authentication

Authentication may use cookies/session or bearer tokens depending on the backend configuration.

Common variables:

```text
{{accessToken}}
{{refreshToken}}
{{csrfToken}}
{{userId}}
{{organizationId}}
```

## Recommended request naming

```text
GET    List Students
GET    Get Student
POST   Create Student
PATCH  Update Student
DELETE Delete Student
```

## Main API Domains

- Health
- Authentication
- Organizations
- Users
- Registration
- Onboarding
- Students
- Attendance
- Roles and Permissions
- Notifications
- Reports
- Admin/System
EOF

cat > "$ROOT/specs/openapi.yaml" <<'EOF'
openapi: 3.0.3

info:
  title: School Platform API
  version: 1.0.0
  description: API specification for the school management platform.

servers:
  - url: http://localhost:4000
    description: Local development

paths: {}
EOF

cat > "$ROOT/collections/00-health/README.md" <<'EOF'
# Health

Requests:

- Health Check
- Readiness Check
- Liveness Check
EOF

cat > "$ROOT/collections/01-auth/README.md" <<'EOF'
# Authentication

Requests:

- Login
- Logout
- Get Current User
- Refresh Session
- Change Password
- CSRF Token
EOF

cat > "$ROOT/collections/02-organizations/README.md" <<'EOF'
# Organizations

Requests:

- List Organizations
- Get Organization
- Create Organization
- Update Organization
- List Organization Members
EOF

cat > "$ROOT/collections/03-users/README.md" <<'EOF'
# Users

Requests:

- List Users
- Get User
- Create User
- Update User
- Disable User
EOF

cat > "$ROOT/collections/04-registration/README.md" <<'EOF'
# Registration

Requests:

- Register Student Account
- Verify Phone
- Complete Registration
- Registration Status
EOF

cat > "$ROOT/collections/05-onboarding/README.md" <<'EOF'
# Onboarding

Requests:

- Start Onboarding
- Save Student Details
- Upload Documents
- Complete Onboarding
EOF

cat > "$ROOT/collections/06-students/README.md" <<'EOF'
# Students

Requests:

- List Students
- Get Student
- Create Student
- Update Student
- Delete Student
- Student Profile
- Student Documents
EOF

cat > "$ROOT/collections/07-attendance/README.md" <<'EOF'
# Attendance

Attendance types:

- Class Attendance
- Dormitory Attendance
- Study Group Attendance
EOF

cat > "$ROOT/collections/07-attendance/class/README.md" <<'EOF'
# Class Attendance

Requests:

- Create Attendance Session
- Mark Attendance
- Update Attendance
- Get Session Attendance
- Get Student Attendance History
EOF

cat > "$ROOT/collections/07-attendance/dormitory/README.md" <<'EOF'
# Dormitory Attendance

Requests:

- Create Room Check
- Mark Room Attendance
- Update Room Attendance
- Get Room Attendance
EOF

cat > "$ROOT/collections/07-attendance/study-group/README.md" <<'EOF'
# Study Group Attendance

Requests:

- Create Study Group Session
- Mark Attendance
- Update Attendance
- Get Attendance
EOF

cat > "$ROOT/collections/08-roles-permissions/README.md" <<'EOF'
# Roles and Permissions

Requests:

- List Roles
- Get Role
- Assign Role
- Remove Role
- List Permissions
- List Capabilities
EOF

cat > "$ROOT/collections/09-notifications/README.md" <<'EOF'
# Notifications

Requests:

- List Notifications
- Get Notification
- Mark As Read
- Send Notification
EOF

cat > "$ROOT/collections/10-reports/README.md" <<'EOF'
# Reports

Requests:

- Student Reports
- Attendance Reports
- Organization Reports
EOF

cat > "$ROOT/collections/99-admin-system/README.md" <<'EOF'
# Admin / System

Requests:

- System Information
- System Status
- Admin Operations
EOF

cat > "$ROOT/flows/student-registration/README.md" <<'EOF'
# Student Registration Flow

1. Register with phone number
2. Create password
3. Authenticate
4. Create student profile
5. Add personal information
6. Add parent information
7. Add education information
8. Upload documents
9. Complete onboarding
EOF

cat > "$ROOT/flows/student-login/README.md" <<'EOF'
# Student Login Flow

1. Login with phone and password
2. Store authentication session/token
3. Get current user
4. Load organization membership
5. Load student profile
EOF

cat > "$ROOT/flows/attendance-flow/README.md" <<'EOF'
# Attendance Flow

1. Login
2. Select organization
3. Select attendance context
4. Create attendance session
5. Mark students
6. Submit attendance
7. Retrieve attendance report
EOF

cat > "$ROOT/scripts/save-auth-token.js" <<'EOF'
const body = pm.response.json();

if (body.accessToken) {
  pm.environment.set("accessToken", body.accessToken);
}

if (body.refreshToken) {
  pm.environment.set("refreshToken", body.refreshToken);
}

if (body.csrfToken) {
  pm.environment.set("csrfToken", body.csrfToken);
}

if (body.user?.id) {
  pm.environment.set("userId", body.user.id);
}
EOF

cat > "$ROOT/scripts/save-student-id.js" <<'EOF'
const body = pm.response.json();

const studentId =
  body.id ||
  body.student?.id ||
  body.data?.id ||
  body.data?.student?.id;

if (studentId) {
  pm.environment.set("studentId", studentId);
}
EOF

cat > "$ROOT/scripts/basic-tests.js" <<'EOF'
pm.test("Status code is successful", function () {
  pm.expect(pm.response.code).to.be.within(200, 299);
});

pm.test("Response time is acceptable", function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});
EOF

cat > "$ROOT/README.md" <<'EOF'
# Postman Workspace

This folder contains the API testing structure for the school platform.

## Structure

- `collections/` API domains
- `environments/` local, staging, and production variables
- `globals/` workspace-wide variables
- `flows/` end-to-end API workflows
- `scripts/` reusable Postman test scripts
- `specs/` OpenAPI specification
- `documents/` API documentation and notes
- `mocks/` mock-related files

## Main API Domains

1. Health
2. Authentication
3. Organizations
4. Users
5. Registration
6. Onboarding
7. Students
8. Attendance
9. Roles and Permissions
10. Notifications
11. Reports
12. Admin/System

## Local API

Default local backend:

```text
http://localhost:4000
```
EOF

find "$ROOT" -type d -empty -exec touch {}/.gitkeep \;

echo
echo "Done."
echo
echo "Created structure:"
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -print | sort
fi

echo
echo "Postman workspace files were created successfully."
