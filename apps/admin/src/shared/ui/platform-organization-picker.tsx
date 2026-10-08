import { Building2 } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../features/auth";
import type { OrganizationSummary } from "../types/domain";
import { notify } from "./notifications";
import { Select } from "./ui";

/**
 * A platform-only tenant context picker. The selected id is sent as the
 * server-authorized X-Organization-Id work context for subsequent requests.
 */
export function PlatformOrganizationPicker() {
  const auth = useAuth();
  const [pending, setPending] = useState(false);

  if (!auth.hasRole("PLATFORM_ADMIN")) return null;

  const organizations = auth.context?.availableOrganizations ?? [];
  const selectedId = auth.context?.activeOrganization?.id ?? "";

  return (
    <label className="hidden min-w-0 items-center gap-1.5 rounded-lg border border-brand/20 bg-brand/5 px-2 py-1 text-xs text-slate-600 xl:flex dark:text-slate-300">
      <Building2 size={14} className="shrink-0 text-brand" aria-hidden="true" />
      <span className="sr-only">سازمان فعال</span>
      <Select
        aria-label="انتخاب سازمان فعال"
        value={selectedId}
        disabled={pending}
        className="h-7 min-w-40 border-0 bg-transparent px-1 py-0 text-xs font-bold shadow-none focus:ring-0"
        onChange={(event) => {
          const organization = organizations.find((item) => item.id === event.target.value) ?? null;
          setPending(true);
          void auth
            .setActiveOrganization(organization as OrganizationSummary | null)
            .catch((error) =>
              notify(error instanceof Error ? error.message : "تغییر سازمان انجام نشد.", "error"),
            )
            .finally(() => setPending(false));
        }}
      >
        <option value="">همه سازمان‌ها</option>
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name} · {organization.type}
          </option>
        ))}
      </Select>
    </label>
  );
}
