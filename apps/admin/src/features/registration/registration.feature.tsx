import { RegistrationComingSoonPage } from "./pages/RegistrationComingSoonPage";

// Export for routing
export { RegistrationComingSoonPage };

// Feature metadata
export const registrationFeature = {
  name: "registration",
  title: "ثبت‌نام و پرونده",
  description: "این بخش به‌زودی در دسترس قرار می‌گیرد.",
  routes: [
    {
      path: "/admin/registration",
      element: <RegistrationComingSoonPage />,
    },
  ],
};

export default registrationFeature;
