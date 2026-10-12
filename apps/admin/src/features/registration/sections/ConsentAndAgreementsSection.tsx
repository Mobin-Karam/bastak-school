import { useState, useEffect } from "react";
import { Card, Button, Checkbox, Alert } from "../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api";

export function ConsentAndAgreementsSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [formData, setFormData] = useState({
    privacyPolicyConsent: false,
    termsOfServiceConsent: false,
    photoConsent: false,
    dataSharingConsent: false,
    emergencyConsent: false,
    medicalConsent: false,
    transportationConsent: false,
    disciplinaryConsent: false,
    academicConsent: false,
    financialConsent: false,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        privacyPolicyConsent: data.profile?.privacyPolicyConsent || false,
        termsOfServiceConsent: data.profile?.termsOfServiceConsent || false,
        photoConsent: data.profile?.photoConsent || false,
        dataSharingConsent: data.profile?.dataSharingConsent || false,
        emergencyConsent: data.profile?.emergencyConsent || false,
        medicalConsent: data.profile?.medicalConsent || false,
        transportationConsent: data.profile?.transportationConsent || false,
        disciplinaryConsent: data.profile?.disciplinaryConsent || false,
        academicConsent: data.profile?.academicConsent || false,
        financialConsent: data.profile?.financialConsent || false,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: updateRegistrationProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-self"] });
      alert("موافقت‌نامه‌ها با موفقیت ذخیره شد");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

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
    <Card className="p-6">
      <h2 className="text-xl font-bold text-ink mb-4">موافقت‌نامه‌ها و رضایت‌نامه‌ها</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacyPolicyConsent"
              checked={formData.privacyPolicyConsent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, privacyPolicyConsent: checked as boolean })
              }
            />
            <label htmlFor="privacyPolicyConsent" className="text-sm text-ink">
              <span className="font-medium">رضایت به سیاست حریم خصوصی</span>
              <p className="text-slate-600 mt-1 text-xs">
                من موافقم که اطلاعات شخصی من بر اساس سیاست حریم خصوصی مدرسه جمع‌آوری، ذخیره و
                استفاده شود.
              </p>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="termsOfServiceConsent"
              checked={formData.termsOfServiceConsent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, termsOfServiceConsent: checked as boolean })
              }
            />
            <label htmlFor="termsOfServiceConsent" className="text-sm text-ink">
              <span className="font-medium">رضایت به شرایط خدمات</span>
              <p className="text-slate-600 mt-1 text-xs">
                من موافقم که از خدمات مدرسه بر اساس شرایط و ضوابط تعیین شده استفاده کنم.
              </p>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="photoConsent"
              checked={formData.photoConsent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, photoConsent: checked as boolean })
              }
            />
            <label htmlFor="photoConsent" className="text-sm text-ink">
              <span className="font-medium">رضایت به استفاده از عکس</span>
              <p className="text-slate-600 mt-1 text-xs">
                من اجازه می‌دهم عکس دانش‌آموز در فعالیت‌های مدرسه، وب‌سایت و مواد تبلیغاتی استفاده
                شود.
              </p>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="dataSharingConsent"
              checked={formData.dataSharingConsent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, dataSharingConsent: checked as boolean })
              }
            />
            <label htmlFor="dataSharingConsent" className="text-sm text-ink">
              <span className="font-medium">رضایت به اشتراک‌گذاری داده‌ها</span>
              <p className="text-slate-600 mt-1 text-xs">
                من موافقم که اطلاعات دانش‌آموز با نهادهای آموزشی و سازمان‌های مرتبط برای اهداف
                آموزشی اشتراک گذاشته شود.
              </p>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="emergencyConsent"
              checked={formData.emergencyConsent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, emergencyConsent: checked as boolean })
              }
            />
            <label htmlFor="emergencyConsent" className="text-sm text-ink">
              <span className="font-medium">رضایت اضطراری</span>
              <p className="text-slate-600 mt-1 text-xs">
                من اجازه می‌دهم در مواقع اضطراری اقدامات لازم برای سلامت و امنیت دانش‌آموز انجام
                شود.
              </p>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="medicalConsent"
              checked={formData.medicalConsent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, medicalConsent: checked as boolean })
              }
            />
            <label htmlFor="medicalConsent" className="text-sm text-ink">
              <span className="font-medium">رضایت پزشکی</span>
              <p className="text-slate-600 mt-1 text-xs">
                من اجازه می‌دهم در صورت نیاز مراقبت‌های پزشکی اولیه برای دانش‌آموز انجام شود.
              </p>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="transportationConsent"
              checked={formData.transportationConsent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, transportationConsent: checked as boolean })
              }
            />
            <label htmlFor="transportationConsent" className="text-sm text-ink">
              <span className="font-medium">رضایت حمل و نقل</span>
              <p className="text-slate-600 mt-1 text-xs">
                من موافقم که دانش‌آموز در سرویس مدرسه حمل و نقل شود و از قوانین مربوطه پیروی کند.
              </p>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="disciplinaryConsent"
              checked={formData.disciplinaryConsent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, disciplinaryConsent: checked as boolean })
              }
            />
            <label htmlFor="disciplinaryConsent" className="text-sm text-ink">
              <span className="font-medium">رضایت انضباطی</span>
              <p className="text-slate-600 mt-1 text-xs">
                من موافقم که دانش‌آموز از قوانین انضباطی مدرسه پیروی کند و در صورت نقض، اقدامات
                مناسب انجام شود.
              </p>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="academicConsent"
              checked={formData.academicConsent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, academicConsent: checked as boolean })
              }
            />
            <label htmlFor="academicConsent" className="text-sm text-ink">
              <span className="font-medium">رضایت آکادمیک</span>
              <p className="text-slate-600 mt-1 text-xs">
                من موافقم که اطلاعات آکادمیک دانش‌آموز برای ارزیابی و برنامه‌ریزی آموزشی استفاده
                شود.
              </p>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="financialConsent"
              checked={formData.financialConsent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, financialConsent: checked as boolean })
              }
            />
            <label htmlFor="financialConsent" className="text-sm text-ink">
              <span className="font-medium">رضایت مالی</span>
              <p className="text-slate-600 mt-1 text-xs">
                من موافquam که اطلاعات مالی دانش‌آموز برای محاسبه شهریه و کمک‌های مالی استفاده شود.
              </p>
            </label>
          </div>
        </div>

        <Alert variant="info" className="mt-6">
          <span className="font-medium">توجه:</span> تمامی این رضایت‌نامه‌ها برای ثبت‌نام الزامی
          هستند. در صورت عدم موافقت با هر یک از آنها، ثبت‌نام امکان‌پذیر نخواهد بود.
        </Alert>

        <div className="flex justify-end pt-4">
          <Button type="submit" loading={mutation.isPending}>
            {mutation.isPending ? "در حال ذخیره..." : "ذخیره رضایت‌نامه‌ها"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
