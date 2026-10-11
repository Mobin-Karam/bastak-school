"use client";

const INSTALLED = "zanin:pwa:installed-version";
const DISMISSED = "zanin:pwa:dismissed-version";
const ACCEPTED = "zanin:pwa:accepted-version";
export type VersionCheckResult = {
  updateAvailable: boolean;
  dismissed: boolean;
  localVersion: string | null;
  remoteVersion: string | null;
};

export async function fetchRemoteVersion() {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.version === "string"
      ? (data as { version: string; releasedAt?: string })
      : null;
  } catch {
    return null;
  }
}
export async function checkForUpdate(): Promise<VersionCheckResult> {
  const localVersion = localStorage.getItem(INSTALLED);
  const remote = await fetchRemoteVersion();
  const remoteVersion = remote?.version ?? null;
  return {
    localVersion,
    remoteVersion,
    updateAvailable: Boolean(localVersion && remoteVersion && localVersion !== remoteVersion),
    dismissed: Boolean(remoteVersion && localStorage.getItem(DISMISSED) === remoteVersion),
  };
}
export const setInstalledVersion = (v: string) => localStorage.setItem(INSTALLED, v);
export const setDismissedVersion = (v: string) =>
  v ? localStorage.setItem(DISMISSED, v) : localStorage.removeItem(DISMISSED);
export const setAcceptedVersion = (v: string) => localStorage.setItem(ACCEPTED, v);
