import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type LocationId = "iran" | "afghanistan" | "international";
export type AdminLanguage = "fa" | "en";

export type AdminShellCopy = {
  appTitle: string;
  adminPortal: string;
  openNavigation: string;
  closeNavigation: string;
  primaryNavigation: string;
  sectionNavigation: (section: string) => string;
  activeSection: string;
  allRoutes: string;
  pageLocation: string;
  searchAndGo: string;
  openMainRail: string;
  closeMainRail: string;
  openSectionRail: string;
  closeSectionRail: string;
  accountMenu: string;
  workContext: string;
  platformLevel: string;
  activeStudent: string;
  returnToActiveStudent: string;
  switchRoleHint: string;
  display: string;
  signOut: string;
  signingOut: string;
  signOutConfirmTitle: string;
  signOutConfirmDescription: string;
  workContextLabel: string;
  activeOrganization: string;
  selectOrganization: string;
  languageSwitch: string;
  languageSwitchLabel: string;
  unreadNotifications: (count: number) => string;
  preparingPage: string;
  restoringSession: string;
  retry: string;
  goToLogin: string;
  capabilityUnavailableTitle: string;
  capabilityUnavailableDescription: string;
  returnToWorkspace: string;
};

export const adminShellCopy: Record<AdminLanguage, AdminShellCopy> = {
  fa: {
    appTitle: "Moshaver | مشاور",
    adminPortal: "پنل مدیریت",
    openNavigation: "بازکردن منوی مدیریت",
    closeNavigation: "بستن منوی مدیریت",
    primaryNavigation: "ناوبری اصلی مدیریت",
    sectionNavigation: (section) => `مسیرهای بخش ${section}`,
    activeSection: "بخش فعال",
    allRoutes: "همه مسیرهای مدیریت",
    pageLocation: "موقعیت صفحه",
    searchAndGo: "جستجو و رفتن سریع",
    openMainRail: "بازکردن نوار اصلی",
    closeMainRail: "بستن نوار اصلی",
    openSectionRail: "بازکردن مسیرهای بخش",
    closeSectionRail: "بستن مسیرهای بخش",
    accountMenu: "منوی حساب کاربری",
    workContext: "زمینه کاری فعال",
    platformLevel: "سطح پلتفرم",
    activeStudent: "دانش‌آموز فعال",
    returnToActiveStudent: "بازگشت به پرونده دانش‌آموز فعال",
    switchRoleHint: "برای تغییر نقش از منوی حساب استفاده کنید.",
    display: "نمایش",
    signOut: "خروج از پنل",
    signingOut: "در حال خروج…",
    signOutConfirmTitle: "خروج از پنل؟",
    signOutConfirmDescription: "نشست این دستگاه بسته می‌شود.",
    workContextLabel: "زمینه کاری",
    activeOrganization: "سازمان فعال",
    selectOrganization: "انتخاب سازمان",
    languageSwitch: "English",
    languageSwitchLabel: "تغییر زبان به انگلیسی",
    unreadNotifications: (count) => `${count.toLocaleString("fa-IR")} اعلان خوانده‌نشده`,
    preparingPage: "در حال آماده‌سازی صفحه",
    restoringSession: "در حال بازیابی نشست…",
    retry: "تلاش دوباره",
    goToLogin: "رفتن به صفحه ورود",
    capabilityUnavailableTitle: "این ابزار در نقش فعال شما نیست",
    capabilityUnavailableDescription:
      "از منوی حساب می‌توانید زمینه کاری را تغییر دهید یا به میز کار خود برگردید.",
    returnToWorkspace: "بازگشت به میز کار",
  },
  en: {
    appTitle: "Moshaver | Advisor",
    adminPortal: "Administration",
    openNavigation: "Open administration menu",
    closeNavigation: "Close administration menu",
    primaryNavigation: "Primary administration navigation",
    sectionNavigation: (section) => `${section} section navigation`,
    activeSection: "Active section",
    allRoutes: "All administration routes",
    pageLocation: "Page location",
    searchAndGo: "Search and go",
    openMainRail: "Expand primary navigation",
    closeMainRail: "Collapse primary navigation",
    openSectionRail: "Expand section navigation",
    closeSectionRail: "Collapse section navigation",
    accountMenu: "Account menu",
    workContext: "Active work context",
    platformLevel: "Platform level",
    activeStudent: "Active student",
    returnToActiveStudent: "Return to active student record",
    switchRoleHint: "Use the account menu to change your role.",
    display: "Display",
    signOut: "Sign out",
    signingOut: "Signing out…",
    signOutConfirmTitle: "Sign out of administration?",
    signOutConfirmDescription: "This device session will be closed.",
    workContextLabel: "Work context",
    activeOrganization: "Active organization",
    selectOrganization: "Select an organization",
    languageSwitch: "فارسی",
    languageSwitchLabel: "Switch language to Persian",
    unreadNotifications: (count) => `${count.toLocaleString("en-US")} unread notifications`,
    preparingPage: "Preparing page",
    restoringSession: "Restoring session…",
    retry: "Try again",
    goToLogin: "Go to sign in",
    capabilityUnavailableTitle: "This tool is unavailable in your active role",
    capabilityUnavailableDescription:
      "Use the account menu to change your work context or return to your workspace.",
    returnToWorkspace: "Return to workspace",
  },
};
export type SharedUiCopy = {
  locale: string;
  loading: (label: string) => string;
  loadFailed: (label: string) => string;
  retry: string;
  selected: (count: number) => string;
  clearSelection: string;
  selectRow: (id: string) => string;
  selectItem: string;
  selectAll: string;
  clearAllSelection: string;
  cardView: (label: string) => string;
  scrollableTable: (label: string) => string;
  sortBy: (label: string) => string;
  horizontalScrollHint: string;
  listFilters: string;
  clearFilters: string;
  management: string;
  summaryAndFilters: string;
  emptyList: (label: string) => string;
  emptyRecords: string;
  confirm: string;
  cancel: string;
  closeDialog: string;
  confirmationInstruction: (phrase: string) => string;
  confirmationPhrase: (phrase: string) => string;
  holdToConfirm: string;
  completed: string;
  operationFailed: string;
};
export type LocationProfile = {
  id: LocationId;
  label: string;
  locale: string;
  calendar: "persian" | "gregory";
  timeZone: string;
  direction: "rtl" | "ltr";
};

export const locations: LocationProfile[] = [
  {
    id: "iran",
    label: "ایران",
    locale: "fa-IR",
    calendar: "persian",
    timeZone: "Asia/Tehran",
    direction: "rtl",
  },
  {
    id: "afghanistan",
    label: "افغانستان",
    locale: "fa-AF",
    calendar: "persian",
    timeZone: "Asia/Kabul",
    direction: "rtl",
  },
  {
    id: "international",
    label: "بین‌المللی",
    locale: "en-US",
    calendar: "gregory",
    timeZone: "UTC",
    direction: "ltr",
  },
];

export function locationLabel(profile: LocationProfile, language: AdminLanguage) {
  if (language === "en") {
    return {
      iran: "Iran",
      afghanistan: "Afghanistan",
      international: "International",
    }[profile.id];
  }
  return profile.label;
}

const key = "moshaver-admin-location";
const sharedUiCopy: Record<AdminLanguage, SharedUiCopy> = {
  fa: {
    locale: "fa-IR",
    loading: (label) => `در حال دریافت ${label}…`,
    loadFailed: (label) => `دریافت ${label} ناموفق بود.`,
    retry: "تلاش دوباره",
    selected: (count) => `${count.toLocaleString("fa-IR")} انتخاب‌شده`,
    clearSelection: "لغو انتخاب",
    selectRow: (id) => `انتخاب ردیف ${id}`,
    selectItem: "انتخاب این مورد",
    selectAll: "انتخاب همه موارد این صفحه",
    clearAllSelection: "لغو انتخاب همه موارد این صفحه",
    cardView: (label) => `${label}، نمای کارت`,
    scrollableTable: (label) => `${label}، جدول قابل پیمایش افقی`,
    sortBy: (label) => `مرتب‌سازی بر اساس ${label}`,
    horizontalScrollHint: "برای دیدن همه ستون‌ها، جدول را به چپ و راست بکشید.",
    listFilters: "فیلترهای فهرست",
    clearFilters: "پاک کردن فیلترها",
    management: "مدیریت",
    summaryAndFilters: "خلاصه و فیلترها",
    emptyList: (label) => `${label} برای نمایش وجود ندارد.`,
    emptyRecords: "رکوردی وجود ندارد.",
    confirm: "تأیید",
    cancel: "انصراف",
    closeDialog: "بستن پنجره",
    confirmationInstruction: (phrase) => `برای تأیید، عبارت «${phrase}» را وارد کنید.`,
    confirmationPhrase: (phrase) => `عبارت تأیید ${phrase}`,
    holdToConfirm: "برای تأیید نگه دارید",
    completed: "انجام شد",
    operationFailed: "انجام عملیات ناموفق بود.",
  },
  en: {
    locale: "en-US",
    loading: (label) => `Loading ${label}…`,
    loadFailed: (label) => `Couldn’t load ${label}.`,
    retry: "Try again",
    selected: (count) => `${count.toLocaleString("en-US")} selected`,
    clearSelection: "Clear selection",
    selectRow: (id) => `Select row ${id}`,
    selectItem: "Select this item",
    selectAll: "Select all items on this page",
    clearAllSelection: "Clear selection for all items on this page",
    cardView: (label) => `${label}, card view`,
    scrollableTable: (label) => `${label}, horizontally scrollable table`,
    sortBy: (label) => `Sort by ${label}`,
    horizontalScrollHint: "Scroll horizontally to view every column.",
    listFilters: "List filters",
    clearFilters: "Clear filters",
    management: "Management",
    summaryAndFilters: "Summary and filters",
    emptyList: (label) => `There are no ${label} to display.`,
    emptyRecords: "There are no records to display.",
    confirm: "Confirm",
    cancel: "Cancel",
    closeDialog: "Close dialog",
    confirmationInstruction: (phrase) => `Enter “${phrase}” to confirm.`,
    confirmationPhrase: (phrase) => `Confirmation phrase ${phrase}`,
    holdToConfirm: "Hold to confirm",
    completed: "Completed",
    operationFailed: "The operation could not be completed.",
  },
};
const LocaleContext = createContext<{
  profile: LocationProfile;
  language: AdminLanguage;
  setLocation: (id: LocationId) => void;
  setLanguage: (language: AdminLanguage) => void;
  formatDate: (value?: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value?: string | Date) => string;
} | null>(null);

/**
 * `Intl.DateTimeFormat` does not permit component fields such as `year` with
 * `dateStyle` or `timeStyle`. Callers may intentionally choose a style, so
 * only add the Admin's readable date defaults when no style is supplied.
 */
export function getAdminDateFormatOptions(
  profile: LocationProfile,
  options: Intl.DateTimeFormatOptions = {},
): Intl.DateTimeFormatOptions {
  const hasStyle = options.dateStyle !== undefined || options.timeStyle !== undefined;

  return {
    timeZone: profile.timeZone,
    ...(hasStyle ? {} : { year: "numeric", month: "long", day: "numeric" }),
    ...options,
  };
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<LocationId>(
    () => (localStorage.getItem(key) as LocationId) || "iran",
  );
  const profile = locations.find((item) => item.id === location) || locations[0];
  const language: AdminLanguage = profile.locale.startsWith("en") ? "en" : "fa";
  useEffect(() => {
    document.documentElement.lang = profile.locale;
    document.documentElement.dir = profile.direction;
  }, [profile]);
  const value = useMemo(
    () => ({
      profile,
      language,
      setLocation(id: LocationId) {
        localStorage.setItem(key, id);
        setLocationState(id);
      },
      setLanguage(nextLanguage: AdminLanguage) {
        const nextLocation: LocationId = nextLanguage === "en" ? "international" : "iran";
        localStorage.setItem(key, nextLocation);
        setLocationState(nextLocation);
      },
      formatDate(value?: string | Date, options: Intl.DateTimeFormatOptions = {}) {
        if (!value) return "";
        return new Intl.DateTimeFormat(
          `${profile.locale}-u-ca-${profile.calendar}`,
          getAdminDateFormatOptions(profile, options),
        ).format(toDate(value));
      },
      formatDateTime(value?: string | Date) {
        if (!value) return "";
        return new Intl.DateTimeFormat(`${profile.locale}-u-ca-${profile.calendar}`, {
          timeZone: profile.timeZone,
          dateStyle: "medium",
          timeStyle: "short",
        }).format(toDate(value));
      },
    }),
    [language, profile],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function toDate(value: string | Date) {
  return value instanceof Date
    ? value
    : new Date(value.length === 10 ? `${value}T12:00:00` : value);
}
export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}

export function useAdminShellCopy() {
  const { language } = useLocale();
  return adminShellCopy[language];
}

export function useOptionalAdminLanguage(): AdminLanguage {
  return useContext(LocaleContext)?.language || "fa";
}

/**
 * Shared primitives can use this without forcing isolated stories/tests to
 * mount the app provider. Product screens still receive the active locale.
 */
export function useSharedUiCopy(): SharedUiCopy {
  return sharedUiCopy[useContext(LocaleContext)?.language || "fa"];
}
