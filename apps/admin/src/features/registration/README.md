# Registration Feature

This feature implements the complete student registration system for schools with 15 different sections.

## Features

- **15 Comprehensive Sections**: Basic information, identity, documents, contact, family, educational background, health, extracurricular activities, academic interests, transportation, financial information, consent agreements, emergency contacts, academic history, and registration completion
- **Progress Tracking**: Visual progress bar showing completion status
- **Document Management**: Upload and management of required documents
- **Responsive Design**: Works on desktop and mobile devices
- **Persian RTL Support**: Full right-to-left layout support
- **Form Validation**: Client-side validation for all fields
- **State Management**: React Query for data fetching and caching
- **Type Safety**: TypeScript interfaces for all data structures

## Sections

| Section | Description | Required |
|---------|-------------|----------|
| Basic Information | National code, birth date, gender, education level | ✅ |
| Identity Information | National ID, birth certificate, personal identification | ✅ |
| Documents | Upload of required documents (ID, certificates, photos) | ✅ |
| Contact Information | Phone numbers, email, address, postal code | ✅ |
| Family Information | Parent/guardian details, family size, siblings | ✅ |
| Educational Background | Previous school info, GPA, academic achievements | ✅ |
| Health Information | Medical history, blood type, emergency contacts | ✅ |
| Extracurricular Activities | Sports, arts, music, clubs, competitions | ❌ |
| Academic Interests | Favorite subjects, learning style, career goals | ❌ |
| Transportation | School bus, pickup/dropoff locations, driver info | ❌ |
| Financial Information | Tuition payment, scholarships, financial aid | ❌ |
| Consent Agreements | Privacy policy, terms of service, photo consent | ✅ |
| Emergency Contacts | Primary, secondary, and tertiary emergency contacts | ✅ |
| Academic History | Detailed academic history across multiple schools | ❌ |
| Registration Completion | Final review and submission confirmation | ✅ |

## API Integration

The registration feature integrates with the following API endpoints:

- `GET /api/v2/registration/self` - Get current registration status and profile
- `PATCH /api/v2/registration/profile` - Update registration profile
- `POST /api/v2/registration/documents` - Upload student documents
- `POST /api/v2/registration/complete` - Complete registration process

## Usage

To use the registration feature in your application:

```tsx
import { RegistrationEntry } from './features/registration';

function App() {
  return (
    <RegistrationEntry />
  );
}
```

## Development

To run the registration feature locally:

```bash
npm run dev
# or
yarn dev
```

Then navigate to `http://localhost:3000/admin/registration`

## License

MIT License