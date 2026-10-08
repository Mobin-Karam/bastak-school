import { RegistrationComingSoonPage } from "./pages/RegistrationComingSoonPage";

// Main registration entry point
export function RegistrationEntry() {
  return <RegistrationComingSoonPage />;
}

export { RegistrationComingSoonPage };

// Feature metadata
export const registrationFeature = {
  name: 'registration',
  title: "ثبت‌نام و پرونده",
  description: "این بخش به‌زودی در دسترس قرار می‌گیرد.",
  routes: [
    {
      path: '/admin/registration',
      element: <RegistrationComingSoonPage />,
    },
  ],
};

export default registrationFeature;
