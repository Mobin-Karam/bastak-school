export type AccessFlowScope = "users" | "organizations";
import type { AdminLanguage } from "../../../shared/ui/locale";

/**
 * Keeps the operational guidance on the two access pages consistent. Server
 * capabilities remain the source of authority; this text only makes the
 * resulting UI state understandable to the operator.
 */
export function accessFlowGuidance(
  scope: AccessFlowScope,
  canManage: boolean,
  language: AdminLanguage = "fa",
) {
  if (language === "en") {
    if (!canManage) {
      return scope === "users"
        ? {
            title: "View user access",
            description:
              "Review accounts and roles here. Creating accounts or changing access requires the user-management capability.",
          }
        : {
            title: "View organizations",
            description:
              "Review organization structure and status here. Changing organizations or features requires the organization-management capability.",
          };
    }

    return scope === "users"
      ? {
          title: "Manage accounts and access",
          description:
            "Select a user, review their role and scope, then save the change. Suspending and archiving access require confirmation.",
        }
      : {
          title: "Manage organizations and features",
          description:
            "Select an organization to review its members, roles, and features. Disabling it stops member access.",
        };
  }
  if (!canManage) {
    return scope === "users"
      ? {
          title: "دسترسی مشاهده کاربران",
          description:
            "می‌توانید حساب‌ها و نقش‌ها را بررسی کنید؛ ایجاد یا تغییر دسترسی به مجوز مدیریت کاربران نیاز دارد.",
        }
      : {
          title: "دسترسی مشاهده سازمان‌ها",
          description:
            "می‌توانید وضعیت و ساختار سازمان‌ها را بررسی کنید؛ تغییر سازمان و قابلیت‌ها به مجوز مدیریت سازمان نیاز دارد.",
        };
  }

  return scope === "users"
    ? {
        title: "مدیریت حساب و دسترسی",
        description:
          "کاربر را انتخاب کنید، نقش و محدوده او را بررسی کنید و سپس تغییر را ذخیره کنید. توقف و بایگانی دسترسی تأیید می‌خواهد.",
      }
    : {
        title: "مدیریت سازمان و قابلیت‌ها",
        description:
          "یک سازمان را انتخاب کنید تا اعضا، نقش‌ها و قابلیت‌های آن را بررسی کنید. غیرفعال‌سازی، دسترسی اعضا را متوقف می‌کند.",
      };
}

export function emptyAccessResult(
  scope: AccessFlowScope,
  hasFilters: boolean,
  language: AdminLanguage = "fa",
) {
  if (language === "en") {
    if (hasFilters) {
      return scope === "users"
        ? "No user matches the selected search or filter. Clear the filters or change the organization scope."
        : "No organization matches this search. Clear the search or enter another name.";
    }
    return scope === "users"
      ? "There are no accounts in this scope yet. Create the first account with the right role and organization."
      : "There are no organizations yet. Create the first organization to get started.";
  }
  if (hasFilters) {
    return scope === "users"
      ? "کاربری با جستجو یا فیلتر انتخاب‌شده یافت نشد. فیلترها را پاک کنید یا محدوده سازمان را تغییر دهید."
      : "سازمانی با جستجوی انتخاب‌شده یافت نشد. جستجو را پاک کنید یا نام دیگری وارد کنید.";
  }

  return scope === "users"
    ? "هنوز حسابی در این محدوده وجود ندارد. برای شروع، یک حساب با نقش و سازمان درست بسازید."
    : "هنوز سازمانی ثبت نشده است. برای شروع، نخستین سازمان را بسازید.";
}
