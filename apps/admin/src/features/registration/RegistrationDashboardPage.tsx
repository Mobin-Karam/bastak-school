import { useState } from "react";
import { Card, Button, Badge } from "../../../shared/ui/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf } from "../api/registration.api";
import { BasicInformationSection } from "./sections/BasicInformationSection";
import { IdentityInformationSection } from "./sections/IdentityInformationSection";
import { DocumentsSection } from "./sections/DocumentsSection";
import { ContactInformationSection } from "./sections/ContactInformationSection";
import { FamilyInformationSection } from "./sections/FamilyInformationSection";
import { EducationalBackgroundSection } from "./sections/EducationalBackgroundSection";
import { HealthInformationSection } from "./sections/HealthInformationSection";
import { ExtracurricularActivitiesSection } from "./sections/ExtracurricularActivitiesSection";
import { AcademicInterestsSection } from "./sections/AcademicInterestsSection";
import { TransportationSection } from "./sections/TransportationSection";
import { FinancialInformationSection } from "./sections/FinancialInformationSection";
import { ConsentAndAgreementsSection } from "./sections/ConsentAndAgreementsSection";
import { EmergencyContactsSection } from "./sections/EmergencyContactsSection";
import { AcademicHistorySection } from "./sections/AcademicHistorySection";
import { RegistrationCompletionSection } from "./sections/RegistrationCompletionSection";

export function RegistrationDashboardPage() {
  useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [activeSection, setActiveSection] = useState("basic");

  const sections = [
    { id: "basic", name: "اطلاعات اولیه", component: <BasicInformationSection /> },
    { id: "identity", name: "اطلاعات شناسایی", component: <IdentityInformationSection /> },
    { id: "documents", name: "مدارک", component: <DocumentsSection /> },
    { id: "contact", name: "اطلاعات تماس", component: <ContactInformationSection /> },
    { id: "family", name: "اطلاعات خانواده", component: <FamilyInformationSection /> },
    { id: "education", name: "سوابق تحصیلی", component: <EducationalBackgroundSection /> },
    { id: "health", name: "اطلاعات سلامت", component: <HealthInformationSection /> },
    {
      id: "extracurricular",
      name: "فعالیت‌های فوق برنامه",
      component: <ExtracurricularActivitiesSection />,
    },
    {
      id: "academic-interests",
      name: "علاقه‌مندی‌های آکادمیک",
      component: <AcademicInterestsSection />,
    },
    { id: "transportation", name: "حمل و نقل", component: <TransportationSection /> },
    { id: "financial", name: "اطلاعات مالی", component: <FinancialInformationSection /> },
    { id: "consent", name: "موافقت‌نامه‌ها", component: <ConsentAndAgreementsSection /> },
    { id: "emergency", name: "تماس‌های اضطراری", component: <EmergencyContactsSection /> },
    { id: "academic-history", name: "سوابق آکادمیک", component: <AcademicHistorySection /> },
    { id: "completion", name: "تکمیل ثبت‌نام", component: <RegistrationCompletionSection /> },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">خطا در بارگذاری اطلاعات</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-ink">پنل ثبت‌نام دانش‌آموزان</h1>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {data?.status === "COMPLETED" ? "تکمیل شده" : "در حال انجام"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-4 h-full">
            <h2 className="font-semibold text-ink mb-4">بخش‌های ثبت‌نام</h2>

            <nav className="space-y-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "ghost"}
                  className={`w-full justify-start text-right ${activeSection === section.id ? "bg-blue-50 text-blue-700" : ""}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.name}
                </Button>
              ))}
            </nav>

            <div className="mt-8 pt-4 border-t border-slate-200">
              <h3 className="font-semibold text-ink mb-3">راهنمای ثبت‌نام</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p>• تمامی بخش‌ها را به ترتیب تکمیل کنید</p>
                <p>• برای هر بخش، اطلاعات دقیق و صحیح وارد کنید</p>
                <p>• مدارک را با کیفیت بالا آپلود کنید</p>
                <p>• قبل از تکمیل، تمامی اطلاعات را بررسی کنید</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">{sections.find((s) => s.id === activeSection)?.component}</Card>
        </div>
      </div>
    </div>
  );
}
