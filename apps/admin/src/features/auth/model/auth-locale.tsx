import { createContext, type ReactNode, useContext, useMemo } from "react";

export type AuthLanguage = "fa" | "en";

type AuthCopy = {
  brandName: string;
  productName: string;
  workspaceLogin: string;
  setupPlatform: string;
  welcome: string;
  createFirstAdmin: string;
  loginDescription: string;
  setupDescription: string;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordConfirmation: string;
  showPassword: string;
  hidePassword: string;
  signIn: string;
  signingIn: string;
  restoringSession: string;
  loginFailed: string;
  usernameRequired: string;
  passwordRequired: string;
  languageSwitch: string;
  securityNotice: string;
  connectionChecking: string;
  connectionUnavailable: string;
  connectionReady: (version: string) => string;
  retryConnection: string;
  bootstrapNoticeTitle: string;
  bootstrapNotice: string;
  passwordHelp: string;
  passwordsDoNotMatch: string;
  createAdminAndSignIn: string;
  creatingAccount: string;
  backToLogin: string;
  accountCreationFailed: string;
  createPlatformOwner: string;
  benefitRoleTitle: string;
  benefitRoleText: string;
  benefitSecureTitle: string;
  benefitSecureText: string;
  benefitUnifiedTitle: string;
  benefitUnifiedText: string;
  heroTitle: string;
  heroDescription: string;
  demoTitle: string;
  demoInstruction: string;
  demoInstructionSuffix: string;
  demoPasswordLabel: string;
  demoPasswordNotice: string;
  demoRoles: Record<DemoRole, { label: string; description: string }>;
  sessionChecking: string;
  nonAdminAccount: string;
  accessVerificationFailed: string;
  serverUnreachable: (attempt: number, maximum: number) => string;
  serverUnresponsive: string;
  restoreStopped: string;
  previousLogoutComplete: string;
  previousLogoutPending: string;
  sessionExpired: string;
  serverLogoutComplete: string;
  signedOut: string;
  localLogoutPending: string;
};

export type DemoRole =
  | "guardian"
  | "advisor"
  | "teacher"
  | "mentor"
  | "contentAdmin"
  | "organizationAdmin"
  | "platformAdmin"
  | "multiRole";

const copy: Record<AuthLanguage, AuthCopy> = {
  fa: {
    brandName: "MOSHAVER",
    productName: "سامانه یکپارچه آموزش",
    workspaceLogin: "ورود به میز کار",
    setupPlatform: "راه‌اندازی سامانه",
    welcome: "خوش آمدید",
    createFirstAdmin: "نخستین مدیر را بسازید",
    loginDescription:
      "با حساب سازمانی خود وارد شوید. منوها و امکانات بر اساس نقش فعال شما تنظیم می‌شوند.",
    setupDescription:
      "یک حساب مالک بسازید. پس از این مرحله، ساخت مدیر فقط از داخل سامانه و با دسترسی کنترل‌شده انجام می‌شود.",
    username: "نام کاربری",
    password: "رمز عبور",
    email: "ایمیل",
    firstName: "نام",
    lastName: "نام خانوادگی",
    passwordConfirmation: "تکرار رمز عبور",
    showPassword: "نمایش رمز عبور",
    hidePassword: "پنهان کردن رمز عبور",
    signIn: "ورود",
    signingIn: "در حال ورود…",
    restoringSession: "در حال بازیابی نشست…",
    loginFailed: "ورود ناموفق بود",
    usernameRequired: "نام کاربری لازم است",
    passwordRequired: "رمز عبور لازم است",
    languageSwitch: "English",
    securityNotice: "ورود شما به معنی پذیرش سیاست‌های امنیت و حریم خصوصی سامانه است.",
    connectionChecking: "در حال بررسی اتصال…",
    connectionUnavailable: "این بک‌اند در دسترس نیست.",
    connectionReady: (version) => `اتصال برقرار است • نسخه ${version}`,
    retryConnection: "بررسی دوباره اتصال",
    bootstrapNoticeTitle: "راه‌اندازی نخستین مدیر",
    bootstrapNotice:
      "این تنها ثبت‌نام عمومی مدیر است و فقط تا پیش از ایجاد نخستین مالک پلتفرم فعال می‌ماند. پس از ثبت، با همین حساب وارد می‌شوید و مدیران بعدی را از بخش کاربران با سطح دسترسی محدود می‌سازید.",
    passwordHelp:
      "رمز عبور باید دست‌کم ۱۲ نویسه باشد. آن را در محل امن نگه دارید؛ این اطلاعات فقط برای ساخت نخستین مالک استفاده می‌شود.",
    passwordsDoNotMatch: "تکرار رمز عبور با رمز انتخاب‌شده یکسان نیست.",
    createAdminAndSignIn: "ساخت مدیر و ورود",
    creatingAccount: "در حال ساخت حساب…",
    backToLogin: "بازگشت به ورود",
    accountCreationFailed: "ساخت حساب مدیر ناموفق بود.",
    createPlatformOwner: "ساخت نخستین مالک سامانه",
    benefitRoleTitle: "نقش‌محور",
    benefitRoleText: "دسترسی متناسب",
    benefitSecureTitle: "امن",
    benefitSecureText: "نشست محافظت‌شده",
    benefitUnifiedTitle: "یکپارچه",
    benefitUnifiedText: "آموزش و عملیات",
    heroTitle: "هر نقش، میز کار خودش؛ همه تیم، در یک مسیر روشن.",
    heroDescription:
      "از برنامه‌ریزی و یادگیری تا ارتباط، گزارش و مدیریت سازمان؛ ابزارهای مرتبط با نقش شما بعد از ورود در دسترس قرار می‌گیرند.",
    demoTitle: "ورود سریع نقش‌های آزمایشی",
    demoInstruction: "ابتدا در Backend v2 دستور",
    demoInstructionSuffix: "را روی پایگاه توسعه اجرا کنید.",
    demoPasswordLabel: "رمز مشترک همه حساب‌های آزمایشی",
    demoPasswordNotice: "فقط برای پایگاه توسعه؛ هرگز در محیط واقعی استفاده نکنید.",
    demoRoles: {
      guardian: { label: "سرپرست", description: "مشاهده فرزند، برنامه و گزارش" },
      advisor: { label: "مشاور", description: "برنامه‌ریزی و پیگیری دانش‌آموز" },
      teacher: { label: "دبیر", description: "آزمون، سؤال و عملکرد آموزشی" },
      mentor: { label: "منتور", description: "روند پیشرفت و گفت‌وگو" },
      contentAdmin: { label: "مدیر محتوا", description: "درس، سؤال و آزمونک" },
      organizationAdmin: { label: "مدیر سازمان", description: "اعضا، کاربران و سازمان" },
      platformAdmin: { label: "مدیر پلتفرم", description: "سامانه، امنیت و همه سازمان‌ها" },
      multiRole: { label: "چندنقشی", description: "تعویض زمینه مشاور و دبیر" },
    },
    sessionChecking: "در حال بررسی نشست امن…",
    nonAdminAccount: "این حساب مدیر نیست.",
    accessVerificationFailed: "تأیید دسترسی مدیریتی انجام نشد.",
    serverUnreachable: (attempt, maximum) =>
      `ارتباط با سرور برقرار نشد؛ تلاش ${attempt} از ${maximum} انجام شد و دوباره تلاش می‌کنیم…`,
    serverUnresponsive:
      "پس از ۳ تلاش، سرور پاسخ نداد. می‌توانید دوباره تلاش کنید یا وارد حساب شوید.",
    restoreStopped: "بازیابی نشست متوقف شد. برای ادامه وارد حساب شوید.",
    previousLogoutComplete: "خروج قبلی تکمیل شد.",
    previousLogoutPending: "خروج قبلی هنوز منتظر اتصال اینترنت است.",
    sessionExpired: "نشست پایان یافته است. دوباره وارد شوید.",
    serverLogoutComplete: "خروج سرور هم تکمیل شد.",
    signedOut: "با موفقیت خارج شدید.",
    localLogoutPending: "خروج محلی انجام شد؛ خروج سرور پس از اتصال تکمیل می‌شود.",
  },
  en: {
    brandName: "MOSHAVER",
    productName: "Unified education platform",
    workspaceLogin: "Workspace sign in",
    setupPlatform: "Set up platform",
    welcome: "Welcome back",
    createFirstAdmin: "Create the first administrator",
    loginDescription:
      "Sign in with your organization account. Your active role determines the tools and navigation you can access.",
    setupDescription:
      "Create the platform owner account. After this step, administrators can only be created from within the platform with controlled access.",
    username: "Username",
    password: "Password",
    email: "Email",
    firstName: "First name",
    lastName: "Last name",
    passwordConfirmation: "Confirm password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signIn: "Sign in",
    signingIn: "Signing in…",
    restoringSession: "Restoring session…",
    loginFailed: "Unable to sign in",
    usernameRequired: "Username is required",
    passwordRequired: "Password is required",
    languageSwitch: "فارسی",
    securityNotice: "By signing in, you agree to the platform security and privacy policies.",
    connectionChecking: "Checking connection…",
    connectionUnavailable: "The backend is unavailable.",
    connectionReady: (version) => `Connected • version ${version}`,
    retryConnection: "Check connection again",
    bootstrapNoticeTitle: "Set up the first administrator",
    bootstrapNotice:
      "This is the only public administrator registration and remains available only before the first platform owner exists. After setup, create other administrators from Users with restricted access.",
    passwordHelp:
      "Use at least 12 characters and store the password securely. These details are used only to create the first platform owner.",
    passwordsDoNotMatch: "Password confirmation does not match the selected password.",
    createAdminAndSignIn: "Create administrator and sign in",
    creatingAccount: "Creating account…",
    backToLogin: "Back to sign in",
    accountCreationFailed: "Unable to create the administrator account.",
    createPlatformOwner: "Create the first platform owner",
    benefitRoleTitle: "Role-aware",
    benefitRoleText: "Relevant access",
    benefitSecureTitle: "Secure",
    benefitSecureText: "Protected session",
    benefitUnifiedTitle: "Unified",
    benefitUnifiedText: "Learning and operations",
    heroTitle: "A clear workspace for every role, with the whole team moving together.",
    heroDescription:
      "Planning, learning, communication, reporting, and organization management are available after sign in according to your role.",
    demoTitle: "Quick demo role sign in",
    demoInstruction: "First run",
    demoInstructionSuffix: "in the Backend v2 development database.",
    demoPasswordLabel: "Shared password for every demo account",
    demoPasswordNotice: "Development database only; never use this in a real environment.",
    demoRoles: {
      guardian: { label: "Guardian", description: "View child, plan, and reports" },
      advisor: { label: "Advisor", description: "Plan and follow up with students" },
      teacher: {
        label: "Teacher",
        description: "Assessments, questions, and learning performance",
      },
      mentor: { label: "Mentor", description: "Progress and conversations" },
      contentAdmin: {
        label: "Content administrator",
        description: "Lessons, questions, and quizzes",
      },
      organizationAdmin: {
        label: "Organization administrator",
        description: "Members, users, and organization",
      },
      platformAdmin: {
        label: "Platform administrator",
        description: "Platform, security, and all organizations",
      },
      multiRole: {
        label: "Multi-role",
        description: "Switch between advisor and teacher contexts",
      },
    },
    sessionChecking: "Checking your secure session…",
    nonAdminAccount: "This account does not have administrator access.",
    accessVerificationFailed: "Administrator access could not be verified.",
    serverUnreachable: (attempt, maximum) =>
      `The server could not be reached. Attempt ${attempt} of ${maximum} completed; retrying…`,
    serverUnresponsive: "The server did not respond after 3 attempts. Try again or sign in.",
    restoreStopped: "Session recovery stopped. Sign in to continue.",
    previousLogoutComplete: "The previous sign out is complete.",
    previousLogoutPending: "The previous sign out will complete when you are back online.",
    sessionExpired: "Your session has ended. Sign in again.",
    serverLogoutComplete: "Server sign out is complete too.",
    signedOut: "You have signed out.",
    localLogoutPending: "You have signed out locally; server sign out will finish when online.",
  },
};

const AuthLocaleContext = createContext<{
  language: AuthLanguage;
  direction: "rtl" | "ltr";
  copy: AuthCopy;
  toggleLanguage: () => void;
} | null>(null);

export function resolveAuthLanguage(locale: string): AuthLanguage {
  return locale.toLowerCase().startsWith("en") ? "en" : "fa";
}

export function AuthLocaleProvider({
  language,
  onToggleLanguage,
  children,
}: {
  language: AuthLanguage;
  onToggleLanguage: () => void;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      language,
      direction: language === "fa" ? ("rtl" as const) : ("ltr" as const),
      copy: copy[language],
      toggleLanguage: onToggleLanguage,
    }),
    [language, onToggleLanguage],
  );

  return <AuthLocaleContext.Provider value={value}>{children}</AuthLocaleContext.Provider>;
}

export function useAuthLocale() {
  const context = useContext(AuthLocaleContext);
  if (!context) throw new Error("useAuthLocale must be used inside AuthLocaleProvider");
  return context;
}

export function authSessionCopy(language: AuthLanguage) {
  return copy[language];
}
