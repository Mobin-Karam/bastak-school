# Registration Feature Configuration Guide

## Overview

This document provides comprehensive configuration options for the Registration Feature, including environment variables, configuration files, and runtime settings.

## Environment Variables

### Required Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REGISTRATION_FEATURE_ENABLED` | Enable/disable the registration feature | `true` | ✅ |
| `API_BASE_URL` | Base URL for API requests | `https://api.bastak-school.com` | ✅ |
| `AUTH_TOKEN` | Authentication token for API requests | `null` | ✅ |

### Optional Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REGISTRATION_MAX_FILE_SIZE` | Maximum file size for document uploads (bytes) | `10485760` (10MB) | ❌ |
| `REGISTRATION_DOCUMENT_TYPES` | Comma-separated list of allowed document types | `SHENASNAME,ID_CARD,BIRTH_CERTIFICATE,PHOTO` | ❌ |
| `REGISTRATION_REQUIRE_CONSENTS` | Require all consent agreements to be accepted | `true` | ❌ |
| `REGISTRATION_AUTO_COMPLETE` | Auto-complete registration after final section | `true` | ❌ |
| `REGISTRATION_SECTION_ORDER` | Comma-separated list of section IDs in display order | `BASIC_INFORMATION,IDENTITY_INFORMATION,DOCUMENTS,CONTACT_INFORMATION,FAMILY_INFORMATION,EDUCATIONAL_BACKGROUND,HEALTH_INFORMATION,EXTRACURRICULAR_ACTIVITIES,ACADEMIC_INTERESTS,TRANSPORTATION,FINANCIAL_INFORMATION,CONSENT_AND_AGREEMENTS,EMERGENCY_CONTACTS,ACADEMIC_HISTORY,REGISTRATION_COMPLETION` | ❌ |
| `REGISTRATION_REQUIRED_SECTIONS` | Comma-separated list of required section IDs | `BASIC_INFORMATION,IDENTITY_INFORMATION,DOCUMENTS,CONTACT_INFORMATION,FAMILY_INFORMATION,EDUCATIONAL_BACKGROUND,HEALTH_INFORMATION,CONSENT_AND_AGREEMENTS,EMERGENCY_CONTACTS,REGISTRATION_COMPLETION` | ❌ |
| `REGISTRATION_PERSIAN_SUPPORT` | Enable Persian language and RTL support | `true` | ❌ |
| `REGISTRATION_ACCESSIBILITY_MODE` | Enable accessibility features | `true` | ❌ |
| `REGISTRATION_ANALYTICS_ENABLED` | Enable registration analytics tracking | `false` | ❌ |
| `REGISTRATION_NOTIFICATIONS_ENABLED` | Enable email/SMS notifications | `true` | ❌ |

## Configuration File

Create `config/registration.config.json` in your application root:

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
  },
  "uiSettings": {
    "rtlSupport": true,
    "persianLanguage": true,
    "accessibilityMode": true,
    "darkMode": false,
    "responsiveDesign": true
  },
  "analytics": {
    "enabled": false,
    "trackingId": "",
    "eventCategories": ["registration", "document_upload", "completion"]
  }
}
```

## Runtime Configuration

The Registration Feature supports dynamic configuration through the `RegistrationConfig` context:

```tsx
import { RegistrationConfigProvider, useRegistrationConfig } from './registration.config';

function App() {
  return (
    <RegistrationConfigProvider>
      <RegistrationEntry />
    </RegistrationConfigProvider>
  );
}

// In any component
function MyComponent() {
  const config = useRegistrationConfig();
  
  return (
    <div>
      <h2>Registration Settings</h2>
      <p>RTL Support: {config.uiSettings.rtlSupport ? 'Enabled' : 'Disabled'}</p>
      <p>Required Sections: {config.sections.basicInformation.required ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Configuration Management

### Loading Configuration

Configuration is loaded in this order (first found wins):

1. **Environment Variables**: Process environment variables
2. **Configuration File**: `config/registration.config.json`
3. **Runtime Props**: Props passed to `RegistrationConfigProvider`
4. **Default Values**: Built-in defaults

### Configuration Validation

The configuration system validates settings on startup:

- Required environment variables are checked
- Configuration file syntax is validated
- Document type configurations are verified
- Validation regex patterns are tested
- UI settings compatibility is checked

### Configuration Hot Reloading

The Registration Feature supports hot reloading of configuration changes:

```bash
# Watch configuration file for changes
npm run watch:config

# Or use development server with hot reload
npm run dev -- --watch-config
```

## Custom Configuration Examples

### School-Specific Configuration

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
    "extracurricularActivities": {"required": true, "enabled": true},
    "academicInterests": {"required": true, "enabled": true},
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
    {"id": "PHOTO", "name": "عکس شخصی", "maxSize": 2097152},
    {"id": "SCHOOL_TRANSCRIPT", "name": "سوابق تحصیلی", "maxSize": 10485760}
  ]
}
```

### Multi-School Configuration

```json
{
  "schools": {
    "bastak-school": {
      "sections": {"extracurricularActivities": {"required": true}},
      "documentTypes": [{"id": "SCHOOL_TRANSCRIPT", "name": "سوابق تحصیلی"}]
    },
    "shahid-school": {
      "sections": {"transportation": {"required": true}},
      "documentTypes": [{"id": "MEDICAL_CERTIFICATE", "name": "گواهینامه پزشکی"}]
    }
  }
}
```

## Configuration Best Practices

### Security Considerations

- Never store sensitive information (API keys, passwords) in configuration files
- Use environment variables for secrets in production
- Validate all configuration inputs to prevent injection attacks
- Encrypt sensitive configuration values in transit and at rest
- Implement proper access controls for configuration files

### Performance Optimization

- Cache configuration values to avoid repeated file reads
- Use efficient data structures for configuration lookups
- Implement lazy loading for optional configuration sections
- Optimize validation logic for performance-critical paths
- Monitor configuration loading times in production

### Maintenance Guidelines

- Document all configuration options with examples
- Provide default values for all optional settings
- Include version compatibility information
- Maintain backward compatibility for configuration changes
- Provide migration guides for breaking changes

## License

MIT License