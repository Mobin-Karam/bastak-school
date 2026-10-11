import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { PublicOrganizationProfile } from "@moshaver/api-contract";
import { request } from "../../../shared/api/api";

const SchoolProfileContext = createContext<{
  schools: PublicOrganizationProfile[];
  selectedId: string;
  selectSchool: (id: string) => void;
  school: PublicOrganizationProfile | undefined;
}>({ schools: [], selectedId: "", selectSchool: () => {}, school: undefined });

export function PublicSchoolProfileProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<PublicOrganizationProfile[]>([]);
  const [selectedId, selectSchool] = useState(
    () => new URLSearchParams(window.location.search).get("organizationId") ?? "",
  );
  useEffect(() => {
    let active = true;
    void request<PublicOrganizationProfile[]>("GET", "/organizations/public-profiles", undefined, {
      suppressAuthFailure: true,
      timeoutMs: 5000,
    })
      .then((result) => {
        if (!active || !Array.isArray(result)) return;
        setSchools(result);
        selectSchool((current) => current || (result.length === 1 ? result[0].id : ""));
      })
      .catch(() => {
        /* Login remains available while public presentation data is unavailable. */
      });
    return () => {
      active = false;
    };
  }, []);
  const school = schools.find((item) => item.id === selectedId);
  return (
    <SchoolProfileContext.Provider value={{ schools, selectedId, selectSchool, school }}>
      {children}
    </SchoolProfileContext.Provider>
  );
}
export const usePublicSchoolProfile = () => useContext(SchoolProfileContext);

export function SchoolContactDetails() {
  const { school } = usePublicSchoolProfile();
  if (!school) return null;
  return (
    <div className="mt-4 grid gap-1 text-center text-xs leading-6 text-slate-500 dark:text-slate-400">
      {school.profile.description ? (
        <p className="break-words">{school.profile.description}</p>
      ) : null}
      {school.profile.address ? <p className="break-words">{school.profile.address}</p> : null}
      {school.profile.location ? <p className="break-words">{school.profile.location}</p> : null}
      {school.profile.phone ? <p dir="ltr">{school.profile.phone}</p> : null}
    </div>
  );
}
