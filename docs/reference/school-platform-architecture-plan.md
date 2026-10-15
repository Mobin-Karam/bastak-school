# School Platform Architecture Plan

## Executive Summary

This document outlines the architecture plan for implementing a multi-school educational platform based on the existing Moshaver codebase. The plan leverages the current CMB (Composable Modular Backend) architecture while extending it to support your specific requirements for school management, student registration, attendance tracking, and role-based access control.

## Current State Assessment

### Existing Foundation

The current Moshaver platform already has a solid foundation for your requirements:

- **Multi-school architecture**: Organization entities with tenant isolation are already implemented
- **Student registration flow**: Configurable registration sections with status tracking
- **Role-based authorization**: Capability-based permissions system with role assignments
- **Attendance system**: Attendance sessions and records for class, group, and dorm contexts
- **Class and group structure**: Education classes and study groups entities exist
- **Dormitory management**: Dorm rooms and assignments are implemented
- **Import/export**: Basic import/export functionality is available

### Gaps and Opportunities

| Area | Current State | Required Enhancement |
|------|---------------|---------------------|
| **Student Registration** | Basic registration with 11 sections | Extend to support all 31 fields you specified, with configurable step-by-step workflow |
| **User Roles** | Predefined roles exist | Add specific roles: مدیریت، ناظم، مشاور، مسئول آموزش دینی، مسئول آموزش دولتی، مربی تربیتی |
| **Attendance Contexts** | CLASS, CLASS_GROUP, DORM_ROOM supported | Add NIGHT_ATTENDANCE context with 22:30 time constraint |
| **Document Management** | Basic file handling | Implement robust document upload, storage, and verification system |
| **Excel Import/Export** | Basic import/export exists | Enhance with validation, preview, and filtering capabilities |
| **Registration Status Flow** | Basic statuses exist | Extend to support your complete status workflow |

## Architecture Plan

### Core Principles

1. **Multi-school First**: All entities will be organization-scoped with proper tenant isolation
2. **Capability-Based Authorization**: Use the existing capability system rather than role-based checks
3. **Configurable Registration**: Registration steps will be dynamically configurable by school management
4. **Progressive Enhancement**: Start with core functionality and incrementally add features
5. **Persian/RTL First**: All UI components will support Persian language and RTL layout

### Data Model Extensions

#### Student Entity Enhancements

Add the following fields to the `Student` entity:

```typescript
@Column({ type: "varchar", length: 20, nullable: true })
shenasnameNumber?: string | null;

@Column({ type: "datetime", nullable: true })
birthDate?: Date | null;

@Column({ length: 120, nullable: true })
birthPlace?: string | null;

@Column({ length: 120, nullable: true })
certificateIssuePlace?: string | null;

@Column({ length: 24, nullable: true })
gender?: string | null;

@Column({ length: 40, nullable: true })
educationLevel?: string | null; // پایه و مقطع تحصیلی

@Column({ length: 240, nullable: true })
previousSchoolInfo?: string | null; // اطلاعات مدرسه قبلی

@Column({ type: "text", nullable: true })
schoolReport?: string | null; // کارنامه یا پرونده تحصیلی سال قبل

@Column({ length: 240, nullable: true })
residenceAddress?: string | null; // آدرس محل سکونت

@Column({ length: 10, nullable: true })
postalCode?: string | null; // کد پستی

@Column({ length: 24, nullable: true })
homePhone?: string | null; // شماره تلفن منزل

@Column({ length: 24, nullable: true })
mobileNumber?: string | null; // شماره موبایل دانش‌آموز

@Column({ length: 160, nullable: true })
fatherName?: string | null; // نام و نام خانوادگی پدر

@Column({ type: "varchar", length: 10, nullable: true })
fatherNationalCode?: string | null; // کد ملی پدر

@Column({ length: 160, nullable: true })
fatherOccupation?: string | null; // شغل و شماره تماس پدر

@Column({ length: 160, nullable: true })
motherName?: string | null; // نام و نام خانوادگی مادر

@Column({ type: "varchar", length: 10, nullable: true })
motherNationalCode?: string | null; // کد ملی مادر

@Column({ length: 160, nullable: true })
motherOccupation?: string | null; // شغل و شماره تماس مادر

@Column({ length: 240, nullable: true })
legalGuardianInfo?: string | null; // اطلاعات ولی یا سرپرست قانونی

@Column({ length: 24, nullable: true })
emergencyContact?: string | null; // شماره تماس اضطراری

@Column({ type: "boolean", default: false })
hasShenasnameImage?: boolean; // تصویر شناسنامه دانش‌آموز

@Column({ type: "boolean", default: false })
hasNationalCardImage?: boolean; // تصویر کارت ملی دانش‌آموز

@Column({ type: "boolean", default: false })
hasParentDocuments?: boolean; // تصویر شناسنامه یا کارت ملی والدین

@Column({ type: "boolean", default: false })
hasPersonalPhoto?: boolean; // عکس پرسنلی

@Column({ type: "boolean", default: false })
hasHealthRecord?: boolean; // پرونده سلامت / اطلاعات پزشکی

@Column({ type: "boolean", default: false })
hasVaccinationRecord?: boolean; // وضعیت واکسیناسیون

@Column({ type: "boolean", default: false })
hasInsuranceInfo?: boolean; // اطلاعات بیمه

@Column({ type: "boolean", default: false })
hasConsentForms?: boolean; // رضایت‌نامه‌ها و تعهدنامه‌ها

@Column({ type: "boolean", default: false })
hasTransportInfo?: boolean; // اطلاعات سرویس مدرسه

@Column({ type: "boolean", default: false })
hasTuitionInfo?: boolean; // اطلاعات پرداخت شهریه

@Column({ type: "boolean", default: false })
hasLegalGuardianSignature?: boolean; // امضای ولی یا سرپرست قانونی
```

#### Document Management System

Create new entities for document management:

- `StudentDocument`: Stores document metadata (type, status, verification info)
- `DocumentType`: Configuration for document types (شناسنامه، کارت ملی، etc.)
- `DocumentVerification`: Tracks verification status and notes

#### Enhanced Registration Steps

Extend the current `REGISTRATION_SECTIONS` to support all 31 fields:

```typescript
export const REGISTRATION_SECTIONS = [
  "BASIC_INFORMATION",
  "IDENTITY_INFORMATION",
  "ADDRESS_CONTACT",
  "PARENTS",
  "PREVIOUS_EDUCATION",
  "DOCUMENTS",
  "HEALTH",
  "VACCINATION",
  "INSURANCE",
  "CONSENTS",
  "TRANSPORT",
  "TUITION",
  "LEGAL_GUARDIAN",
  "EMERGENCY_CONTACT",
  "PHOTOGRAPHS",
] as const;
```

### Module Architecture

The platform will be organized into the following modules:

```
CmbPlatformModule
    ↓
App features

StudentsModule
├── StudentProfileModule
├── StudentRegistrationModule
├── StudentDocumentModule
└── StudentStatusModule

RegistrationModule
├── RegistrationConfigurationModule
├── RegistrationWorkflowModule
└── RegistrationVerificationModule

EducationModule
├── ClassModule
├── GroupModule
├── CurriculumModule
└── AcademicRecordsModule

AttendanceModule
├── ClassAttendanceModule
├── GroupAttendanceModule
├── DormAttendanceModule
└── NightAttendanceModule

DormitoryModule
├── DormRoomModule
├── DormAssignmentModule
└── DormManagementModule

RelationshipsModule
├── CounselorRelationshipModule
├── ReligiousEducationRelationshipModule
├── GovernmentEducationRelationshipModule
└── MentorRelationshipModule

ImportExportModule
├── ExcelImportModule
├── ExcelExportModule
└── DataValidationModule
```

### Role and Capability Mapping

#### New Roles

| Role | Code | Description |
|------|------|-------------|
| مدیریت | SCHOOL_ADMIN | Full access to everything in the school |
| ناظم | SCHOOL_SUPERVISOR | Almost full operational access |
| مشاور | COUNSELOR | View assigned students, manage counseling relationships |
| مسئول آموزش دینی | RELIGIOUS_EDUCATION_MANAGER | Access students/classes/groups related to آموزش دینی |
| مسئول آموزش دولتی | GOVERNMENT_EDUCATION_MANAGER | Access students/classes/groups related to آموزش دولتی |
| مربی تربیتی | STUDENT_AFFAIRS_MENTOR | Access assigned students/groups and future تربیتی features |
| اساتید | TEACHER | View assigned classes/groups and record attendance |
| طلبه | STUDENT | Register/login, view own profile, complete registration steps |
| اولیاء | GUARDIAN | Later: access linked children and permitted school information |

#### Capability Matrix

| Capability | مدیریت | ناظم | مشاور | مسئول آموزش دینی | مسئول آموزش دولتی | مربی تربیتی | اساتید | طلبه |
|------------|--------|------|--------|-------------------|---------------------|----------------|--------|--------|
| students.read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| students.create | ✓ | ✓ | | | | | | |
| students.update | ✓ | ✓ | | ✓ | ✓ | ✓ | | ✓ |
| students.delete | ✓ | ✓ | | | | | | |
| students.import | ✓ | ✓ | | | | | | |
| students.export | ✓ | ✓ | | | | | | |
| registration.read | ✓ | ✓ | | ✓ | ✓ | ✓ | | ✓ |
| registration.manage | ✓ | ✓ | | ✓ | ✓ | ✓ | | |
| registration.review | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| registration.approve | ✓ | ✓ | | ✓ | ✓ | ✓ | | |
| attendance.read | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ |
| attendance.create | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | |
| attendance.update | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | |
| attendance.delete | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | |
| attendance.class.manage | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | |
| attendance.group.manage | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | |
| attendance.dorm.manage | ✓ | ✓ | | ✓ | ✓ | ✓ | | |
| attendance.night.manage | ✓ | ✓ | | ✓ | ✓ | ✓ | | |
| classes.read | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | |
| classes.manage | ✓ | ✓ | | ✓ | ✓ | ✓ | | |
| groups.read | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | |
| groups.manage | ✓ | ✓ | | ✓ | ✓ | ✓ | | |
| dorms.read | ✓ | ✓ | | ✓ | ✓ | ✓ | | |
| dorms.manage | ✓ | ✓ | | ✓ | ✓ | ✓ | | |
| relationships.read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| relationships.manage | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| documents.read | ✓ | ✓ | | ✓ | ✓ | ✓ | | ✓ |
| documents.manage | ✓ | ✓ | | ✓ | ✓ | ✓ | | |
| school.settings.manage | ✓ | ✓ | | | | | | |
| users.manage | ✓ | ✓ | | | | | | |
| roles.manage | ✓ | ✓ | | | | | | |

### User Flow Design

#### Student Registration Flow

```
Phone number
    ↓
SMS Verification
    ↓
Create password
    ↓
Enter name + family name
    ↓
Student account created
    ↓
Registration status: PENDING_PROFILE
    ↓
School management announces next steps
    ↓
Step-by-step completion
    ↓
Registration status: IN_PROGRESS → WAITING_REVIEW → APPROVED → ACTIVE
```

#### Night Attendance Flow

```
Dorm room
    ↓
Attendance session creation
    ↓
Expected time: 22:30
    ↓
Student check-in
    ↓
Status: PRESENT / ABSENT / EXCUSED / LATE
    ↓
Management review and correction
```

## Implementation Roadmap

### Phase 1: Foundation (2 weeks)

- [ ] Extend Student entity with required fields
- [ ] Implement document management system
- [ ] Configure registration sections for all 31 fields
- [ ] Create new roles and capabilities
- [ ] Update frontend signup flow

### Phase 2: Core Functionality (3 weeks)

- [ ] Implement night attendance system
- [ ] Build enhanced registration workflow UI
- [ ] Develop document upload and verification interface
- [ ] Create student status dashboard
- [ ] Implement Excel import/export enhancements

### Phase 3: Advanced Features (2 weeks)

- [ ] Build counselor relationship management
- [ ] Implement religious/government education tracking
- [ ] Add student mentorship features
- [ ] Develop comprehensive reporting
- [ ] Implement guardian portal foundation

### Phase 4: Multi-school Expansion (1 week)

- [ ] Test multi-school isolation
- [ ] Implement school-specific configuration
- [ ] Build school management dashboard
- [ ] Create migration tools for existing schools

## Technical Recommendations

### Backend

- Use the existing CMB architecture and follow the dependency boundaries
- Leverage TypeORM migrations for database changes
- Implement proper validation and sanitization for all user inputs
- Use bcrypt for password hashing with appropriate salt rounds
- Implement rate limiting for registration endpoints
- Add comprehensive logging for security and debugging

### Frontend

- Use React with TypeScript and Tailwind CSS
- Implement RTL support using CSS logical properties
- Use Persian date formatting and localization
- Implement responsive design for all devices
- Add accessibility features (ARIA labels, keyboard navigation)
- Use progressive enhancement for document uploads

### Security

- Implement proper CSRF protection
- Use HTTPS for all communications
- Store sensitive documents in secure storage with access controls
- Implement proper input validation and output encoding
- Add rate limiting for authentication endpoints
- Implement proper session management

### Performance

- Use database indexing for frequently queried fields
- Implement caching for static configuration data
- Optimize queries with proper joins and pagination
- Use lazy loading for large datasets
- Implement background processing for Excel imports

## Conclusion

The existing Moshaver platform provides an excellent foundation for your school management system. By leveraging the current architecture and extending it with the planned enhancements, you can build a robust, scalable, and maintainable platform that meets all your requirements while supporting future growth to multiple schools.

The implementation approach focuses on incremental delivery, starting with core functionality and progressively adding advanced features. This ensures you get working software quickly while maintaining flexibility for future requirements.