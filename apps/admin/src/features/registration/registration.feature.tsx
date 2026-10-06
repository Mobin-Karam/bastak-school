import { RegistrationDashboardPage } from "./RegistrationDashboardPage";
import { RegistrationLayout } from "./RegistrationLayout";

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