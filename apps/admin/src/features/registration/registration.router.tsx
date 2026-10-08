import { createBrowserRouter } from "react-router-dom";
import { RegistrationComingSoonPage } from "./pages/RegistrationComingSoonPage";

export const registrationRouter = createBrowserRouter([
  {
    path: "/admin/registration",
    element: <RegistrationComingSoonPage />,
  },
]);

// Export individual routes for use in main router
export const registrationRoutes = [
  {
    path: "/admin/registration",
    element: <RegistrationComingSoonPage />,
  },
];
