import { createBrowserRouter, Outlet } from "react-router-dom";
import { RegistrationLayout } from "./RegistrationLayout";
import { RegistrationDashboardPage } from "./RegistrationDashboardPage";

export const registrationRouter = createBrowserRouter([
  {
    path: "/admin/registration",
    element: <RegistrationLayout />,
    children: [
      {
        index: true,
        element: <RegistrationDashboardPage />,
      },
      {
        path: "dashboard",
        element: <RegistrationDashboardPage />,
      },
      // Add more routes for individual sections if needed
      // {
      //   path: "basic-information",
      //   element: <BasicInformationSection />,
      // },
    ],
  },
]);

// Export individual routes for use in main router
export const registrationRoutes = [
  {
    path: "/admin/registration",
    element: <RegistrationLayout />,
    children: [
      {
        index: true,
        element: <RegistrationDashboardPage />,
      },
      {
        path: "dashboard",
        element: <RegistrationDashboardPage />,
      },
    ],
  },
];