import { useEffect, useState } from "react";
import { Card, Button, Badge } from "../../../shared/ui/ui";
import { useQuery } from "@tanstack/react-query";
import { getRegistrationStatus } from "../api/registration.api";

export function RegistrationDashboardPage() {
  const [status, setStatus] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-status"],
    queryFn: getRegistrationStatus,
  });

  useEffect(() => {
    if (data) {
      setStatus(data);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">خطا در بارگذاری وضعیت ثبت‌نام</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink mb-2">وضعیت ثبت‌نام</h2>
        <p className="text-slate-600 mb-4">
          پرونده شما در وضعیت{" "}
          <span className="font-semibold">{status?.student?.registrationStatus}</span> قرار دارد.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">مرحله فعلی</p>
                <p className="font-bold text-lg">
                  {status?.sections?.[0]?.sectionCode || "بدون مرحله"}
                </p>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {status?.sections?.[0]?.status || "در انتظار"}
              </Badge>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">مراحل تکمیل شده</p>
                <p className="font-bold text-lg">
                  {status?.sections?.filter((s: any) => s.status === "APPROVED").length || 0} از{" "}
                  {status?.sections?.length || 0}
                </p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {Math.round(
                  ((status?.sections?.filter((s: any) => s.status === "APPROVED").length || 0) /
                    (status?.sections?.length || 1)) *
                    100,
                )}
                %
              </Badge>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">بررسی توسط مدیریت</p>
                <p className="font-bold text-lg">
                  {status?.sections?.filter((s: any) => s.status === "WAITING_REVIEW").length || 0}
                </p>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                نیاز به بررسی
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-ink mb-4">مراحل ثبت‌نام</h2>

        <div className="space-y-3">
          {status?.sections?.map((section: any, index: number) => (
            <Card key={section.sectionCode} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">
                      {getSectionName(section.sectionCode)}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {section.announcement || "اطلاعات اضافی وجود ندارد"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    section.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : section.status === "SUBMITTED"
                        ? "bg-blue-100 text-blue-800"
                        : section.status === "WAITING_REVIEW"
                          ? "bg-yellow-100 text-yellow-800"
                          : section.status === "NEEDS_CORRECTION"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-800"
                  }
                >
                  {getSectionStatusText(section.status)}
                </Badge>

                {section.status !== "APPROVED" && (
                  <Button size="sm" variant="outline">
                    {section.status === "NOT_STARTED" ? "شروع" : "ویرایش"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function getSectionName(code: string): string {
  const names: Record<string, string> = {
    BASIC_INFORMATION: "اطلاعات اولیه",
    IDENTITY_INFORMATION: "اطلاعات شناسایی",
    ADDRESS_CONTACT: "آدرس و تماس",
    PARENTS: "والدین",
    PREVIOUS_EDUCATION: "تحصیلات قبلی",
    DOCUMENTS: "مدارک",
    HEALTH: "سلامت",
    VACCINATION: "واکسیناسیون",
    INSURANCE: "بیمه",
    CONSENTS: "رضایت‌نامه‌ها",
    TRANSPORT: "سرویس مدرسه",
    TUITION: "شهریه",
    LEGAL_GUARDIAN: "ولی قانونی",
    EMERGENCY_CONTACT: "تماس اضطراری",
    PHOTOGRAPHS: "عکس‌ها",
  };
  return names[code] || code;
}

function getSectionStatusText(status: string): string {
  const texts: Record<string, string> = {
    NOT_STARTED: "شروع نشده",
    IN_PROGRESS: "در حال انجام",
    SUBMITTED: "ارسال شده",
    APPROVED: "تایید شده",
    NEEDS_CORRECTION: "نیاز به اصلاح",
    WAITING_REVIEW: "در انتظار بررسی",
  };
  return texts[status] || status;
}
