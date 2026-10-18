import type {
  adminBreadcrumbs,
  localizedAdminCurrentNavigation,
} from "../navigation/config/admin-navigation";

export type AdminCurrentNavigation = ReturnType<typeof localizedAdminCurrentNavigation>;
export type AdminBreadcrumb = ReturnType<typeof adminBreadcrumbs>[number];
