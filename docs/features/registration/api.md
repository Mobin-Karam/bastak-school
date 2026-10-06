# Registration Feature API Documentation

## Overview

The Registration Feature API provides endpoints for managing student registration data. All endpoints follow REST conventions and use JSON for request/response bodies.

## Base URL

```
https://api.bastak-school.com/api/v2
```

## Authentication

All endpoints require Bearer token authentication in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

## Error Handling

### Common Error Responses

| Status Code | Description | Example Response |
|-------------|-------------|------------------|
| `400 Bad Request` | Invalid request data | `{"error": "VALIDATION_ERROR", "message": "Invalid national code format"}` |
| `401 Unauthorized` | Missing or invalid authentication token | `{"error": "UNAUTHORIZED", "message": "Authentication required"}` |
| `403 Forbidden` | Insufficient permissions | `{"error": "FORBIDDEN", "message": "Insufficient permissions"}` |
| `404 Not Found` | Resource not found | `{"error": "NOT_FOUND", "message": "Student not found"}` |
| `422 Unprocessable Entity` | Validation errors | `{"error": "VALIDATION_ERROR", "details": [{"field": "nationalCode", "message": "Must be 10 digits"}]}` |
| `500 Internal Server Error` | Server error | `{"error": "INTERNAL_ERROR", "message": "An unexpected error occurred"}` |

## Endpoints

### GET /registration/self

Get current user's registration status and profile information.

#### Request

```
GET /api/v2/registration/self
Authorization: Bearer <access_token>
```

#### Response (200 OK)

```json
{
  "student": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nationalCode": "1234567890",
    "shenasnameNumber": "123456789",
    "firstName": "علی",
    "lastName": "اصغری",
    "birthDate": "2005-01-01",
    "gender": "MALE",
    "educationLevel": "HIGH_SCHOOL",
    "status": "IN_PROGRESS",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "profile": {
    "nationalCode": "1234567890",
    "shenasnameNumber": "123456789",
    "birthDate": "2005-01-01",
    "mobileNumber": "09123456789",
    "email": "ali@example.com",
    "address": "تهران، خیابان ولیعصر، پلاک 123",
    "postalCode": "1234567890"
  },
  "documents": [
    {
      "id": "456f7890-g12h-34i5-j67k-890123456789",
      "type": "SHENASNAME",
      "originalFileName": "shenasname.jpg",
      "status": "SUBMITTED",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "fileUrl": "https://storage.bastak-school.com/documents/shenasname-123.jpg"
    }
  ],
  "status": "IN_PROGRESS",
  "progress": 50,
  "completedSections": ["BASIC_INFORMATION", "IDENTITY_INFORMATION"]
}
```

### PATCH /registration/profile

Update registration profile information.

#### Request

```
PATCH /api/v2/registration/profile
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "nationalCode": "1234567890",
  "shenasnameNumber": "123456789",
  "birthDate": "2005-01-01",
  "mobileNumber": "09123456789",
  "email": "ali@example.com",
  "address": "تهران، خیابان ولیعصر، پلاک 123",
  "postalCode": "1234567890"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "nationalCode": "1234567890",
    "shenasnameNumber": "123456789",
    "birthDate": "2005-01-01",
    "mobileNumber": "09123456789",
    "email": "ali@example.com",
    "address": "تهران، خیابان ولیعصر، پلاک 123",
    "postalCode": "1234567890"
  }
}
```

### POST /registration/documents

Upload student documents.

#### Request

```
POST /api/v2/registration/documents
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Form fields:
- `documentType`: Document type (SHENASNAME, ID_CARD, BIRTH_CERTIFICATE, PHOTO)
- `file`: File to upload

#### Response (201 Created)

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "456f7890-g12h-34i5-j67k-890123456789",
    "type": "SHENASNAME",
    "originalFileName": "shenasname.jpg",
    "status": "SUBMITTED",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "fileUrl": "https://storage.bastak-school.com/documents/shenasname-123.jpg"
  }
}
```

### POST /registration/complete

Complete the registration process.

#### Request

```
POST /api/v2/registration/complete
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "consentAgreements": {
    "privacyPolicy": true,
    "termsOfService": true,
    "photoConsent": false
  }
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "studentId": "123e4567-e89b-12d3-a456-426614174000",
    "registrationId": "789a0123-b45c-67d8-e9f0-1234567890ab",
    "completionDate": "2024-01-15T10:30:00Z",
    "status": "COMPLETED"
  }
}
```

## Document Types

| Type | Description | Required |
|------|-------------|----------|
| `SHENASNAME` | Birth certificate | ✅ |
| `ID_CARD` | National ID card | ✅ |
| `BIRTH_CERTIFICATE` | Birth certificate | ✅ |
| `PHOTO` | Personal photo | ✅ |
| `SCHOOL_TRANSCRIPT` | School transcript | ❌ |
| `RECOMMENDATION_LETTER` | Recommendation letter | ❌ |
| `CERTIFICATE_OF_ACHIEVEMENT` | Certificate of achievement | ❌ |

## Status Codes

| Status | Description |
|--------|-------------|
| `DRAFT` | Registration has been started but no data saved |
| `IN_PROGRESS` | Registration is in progress with some sections completed |
| `COMPLETED` | Registration is complete and approved |
| `REJECTED` | Registration was rejected by admin |
| `PENDING_REVIEW` | Registration is pending admin review |

## Rate Limiting

- **Requests per minute**: 60 requests per minute per API key
- **Burst limit**: 10 requests per second
- **Response headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## CORS Policy

- **Allowed Origins**: `https://admin.bastak-school.com`, `https://student.bastak-school.com`
- **Allowed Methods**: `GET`, `POST`, `PATCH`, `OPTIONS`
- **Allowed Headers**: `Authorization`, `Content-Type`, `X-Requested-With`
- **Credentials**: Supported

## Webhooks

The Registration API supports webhooks for event notifications:

| Event | Description |
|-------|-------------|
| `registration.created` | When a new registration is created |
| `registration.updated` | When registration data is updated |
| `document.uploaded` | When a document is uploaded |
| `registration.completed` | When registration is completed |
| `registration.rejected` | When registration is rejected |

## License

MIT License