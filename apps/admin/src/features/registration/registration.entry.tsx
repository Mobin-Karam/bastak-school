import { RegistrationFeatureProvider } from "./registration.provider";
import { RegistrationLayout } from "./RegistrationLayout";
import { RegistrationDashboardPage } from "./RegistrationDashboardPage";

// Main registration entry point
export function RegistrationEntry() {
  return (
    <RegistrationFeatureProvider>
      <RegistrationLayout>
        <RegistrationDashboardPage />
      </RegistrationLayout>
    </RegistrationFeatureProvider>
  );
}

// Export for routing
export { RegistrationLayout, RegistrationDashboardPage };

// Feature metadata
export const registrationFeature = {
  name: 'registration',
  title: 'ثبت‌نام دانش‌آموزان',
  description: 'سیستم کامل ثبت‌نام دانش‌آموزان با ۱۵ بخش مختلف',
  icon: '📝',
  routes: [
    {
      path: '/admin/registration',
      element: <RegistrationLayout />,
      children: [
        {
          index: true,
          element: <RegistrationDashboardPage />,
        },
        {
          path: 'dashboard',
          element: <RegistrationDashboardPage />,
        },
      ],
    },
  ],
};

export default registrationFeature;