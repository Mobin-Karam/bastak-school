import type { adminBreadcrumbs, localizedAdminCurrentNavigation } from "./admin-navigation";

export type AdminCurrentNavigation = ReturnType<typeof localizedAdminCurrentNavigation>;
export type AdminBreadcrumb = ReturnType<typeof adminBreadcrumbs>[number];
