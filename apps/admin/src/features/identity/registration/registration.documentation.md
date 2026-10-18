# Registration Feature Documentation

## Overview

The Registration Feature is a comprehensive student registration system designed for schools. It provides a 15-section registration process that collects all necessary information about students, their families, academic background, health, and other important details.

## Architecture

The registration feature follows a modular architecture with:

- **Layout Component**: `RegistrationLayout.tsx` - Provides the main layout with header, progress bar, and outlet
- **Dashboard Page**: `RegistrationDashboardPage.tsx` - Main dashboard with sidebar navigation and content area
- **Section Components**: Individual components for each of the 15 registration sections
- **API Service**: `api/registration.api.ts` - Handles all API calls to the backend
- **Configuration**: `registration.config.ts` - Defines section configuration and document types
- **Types**: `registration.types.ts` - TypeScript interfaces for data structures
- **Constants**: `registration.constants.ts` - Route definitions and status constants
- **Hooks**: `registration.hooks.ts` - Custom React Query hooks for data fetching
- **Utils**: `registration.utils.ts` - Helper functions for validation and formatting
- **Context**: `registration.context.tsx` - React context for global registration state
- **Provider**: `registration.provider.tsx` - Context provider wrapper
- **Router**: `registration.router.tsx` - React Router configuration
- **Entry Point**: `registration.entry.tsx` - Main entry point for the feature

## Data Flow

1. **Initial Load**: `RegistrationLayout` renders and fetches registration data via `getRegistrationSelf`
2. **State Management**: Data is stored in React Query cache and accessible via custom hooks
3. **Form Submission**: Each section uses `updateRegistrationProfile` to save data
4. **Document Upload**: `uploadStudentDocument` handles file uploads
5. **Completion**: `completeRegistration` finalizes the registration process

## Styling

The registration feature uses Tailwind CSS with the following design principles:

- **RTL Support**: Full right-to-left layout support for Persian language
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Consistent UI**: Uses shared UI components from `../../../shared/ui/ui`
- **Accessibility**: Proper ARIA attributes and keyboard navigation support
- **Loading States**: Spinners and skeleton loaders for async operations
- **Error Handling**: User-friendly error messages and validation feedback

## Internationalization

The feature supports Persian (Farsi) as the primary language with RTL layout. All text is written in Persian and the UI is optimized for RTL reading direction.

## Testing

The feature includes comprehensive tests:

- **Unit Tests**: `registration.test.tsx` - Tests component rendering and behavior
- **Storybook**: `registration.stories.tsx` - Visual component testing and documentation
- **Integration Tests**: End-to-end testing of the complete registration flow

## Deployment

The registration feature is deployed as part of the admin application and is accessible at `/admin/registration`.

## Future Enhancements

- **Multi-language Support**: Add English and other language support
- **Offline Mode**: Cache registration data for offline completion
- **AI Assistance**: Add AI-powered form suggestions and auto-completion
- **Analytics**: Track registration completion rates and drop-off points
- **Mobile App Integration**: Native mobile app integration
- **Biometric Verification**: Add fingerprint or facial recognition for identity verification
- **Blockchain Verification**: Use blockchain for tamper-proof document verification
- **Real-time Collaboration**: Allow multiple staff members to work on the same registration simultaneously

## Dependencies

- `@tanstack/react-query`: For data fetching and caching
- `react-router-dom`: For routing and navigation
- `../../../shared/ui/ui`: Shared UI components
- `../../../shared/api/api-client`: API client for backend communication

## License

MIT License
