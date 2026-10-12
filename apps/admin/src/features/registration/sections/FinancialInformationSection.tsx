import { useState, useEffect } from "react";
import { Card, Input, Button, Select } from "../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api";

export function FinancialInformationSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [formData, setFormData] = useState({
    tuitionPaymentMethod: "",
    tuitionAmount: "",
    paymentFrequency: "",
    scholarshipStatus: "",
    scholarshipType: "",
    scholarshipAmount: "",
    financialAidStatus: "",
    financialAidType: "",
    financialAidAmount: "",
    familyIncomeLevel: "",
    familyEmploymentStatus: "",
    parentOccupation: "",
    parentEducationLevel: "",
    bankAccountNumber: "",
    bankName: "",
    bankBranch: "",
    bankCardNumber: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        tuitionPaymentMethod: data.profile?.tuitionPaymentMethod || "",
        tuitionAmount: data.profile?.tuitionAmount || "",
        paymentFrequency: data.profile?.paymentFrequency || "",
        scholarshipStatus: data.profile?.scholarshipStatus || "",
        scholarshipType: data.profile?.scholarshipType || "",
        scholarshipAmount: data.profile?.scholarshipAmount || "",
        financialAidStatus: data.profile?.financialAidStatus || "",
        financialAidType: data.profile?.financialAidType || "",
        financialAidAmount: data.profile?.financialAidAmount || "",
        familyIncomeLevel: data.profile?.familyIncomeLevel || "",
        familyEmploymentStatus: data.profile?.familyEmploymentStatus || "",
        parentOccupation: data.profile?.parentOccupation || "",
        parentEducationLevel: data.profile?.parentEducationLevel || "",
        bankAccountNumber: data.profile?.bankAccountNumber || "",
        bankName: data.profile?.bankName || "",
        bankBranch: data.profile?.bankBranch || "",
        bankCardNumber: data.profile?.bankCardNumber || "",
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: updateRegistrationProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-self"] });
      alert("اطلاعات با موفقیت ذخیره شد");
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
      <h2 className="text-xl font-bold text-ink mb-4">اطلاعات مالی</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">روش پرداخت شهریه</label>
            <Select
              value={formData.tuitionPaymentMethod}
              onChange={(e) => setFormData({ ...formData, tuitionPaymentMethod: e.target.value })}
            >
              <option value="">انتخاب روش پرداخت</option>
              <option value="cash">نقدی</option>
              <option value="bank_transfer">انتقال بانکی</option>
              <option value="online_payment">پرداخت آنلاین</option>
              <option value="installments">قسطی</option>
              <option value="other">سایر</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">مبلغ شهریه</label>
            <Input
              type="number"
              value={formData.tuitionAmount}
              onChange={(e) => setFormData({ ...formData, tuitionAmount: e.target.value })}
              placeholder="مبلغ شهریه را وارد کنید"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">فراوانی پرداخت</label>
            <Select
              value={formData.paymentFrequency}
              onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value })}
            >
              <option value="">انتخاب فراوانی</option>
              <option value="monthly">ماهانه</option>
              <option value="quarterly">سه‌ماهانه</option>
              <option value="semi_annually">شش‌ماهانه</option>
              <option value="annually">سالانه</option>
              <option value="one_time">یک‌باره</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">وضعیت بورسیه</label>
            <Select
              value={formData.scholarshipStatus}
              onChange={(e) => setFormData({ ...formData, scholarshipStatus: e.target.value })}
            >
              <option value="">انتخاب وضعیت</option>
              <option value="none">بدون بورسیه</option>
              <option value="applied">درخواست داده شده</option>
              <option value="approved">تایید شده</option>
              <option value="rejected">رد شده</option>
              <option value="pending_review">در انتظار بررسی</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نوع بورسیه</label>
            <Select
              value={formData.scholarshipType}
              onChange={(e) => setFormData({ ...formData, scholarshipType: e.target.value })}
            >
              <option value="">انتخاب نوع</option>
              <option value="academic">تحصیلی</option>
              <option value="athletic">ورزشی</option>
              <option value="artistic">هنری</option>
              <option value="need_based">مبتنی بر نیاز</option>
              <option value="merit_based">مبتنی بر شایستگی</option>
              <option value="other">سایر</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">مبلغ بورسیه</label>
            <Input
              type="number"
              value={formData.scholarshipAmount}
              onChange={(e) => setFormData({ ...formData, scholarshipAmount: e.target.value })}
              placeholder="مبلغ بورسیه را وارد کنید"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">وضعیت کمک‌های مالی</label>
            <Select
              value={formData.financialAidStatus}
              onChange={(e) => setFormData({ ...formData, financialAidStatus: e.target.value })}
            >
              <option value="">انتخاب وضعیت</option>
              <option value="none">بدون کمک مالی</option>
              <option value="applied">درخواست داده شده</option>
              <option value="approved">تایید شده</option>
              <option value="rejected">رد شده</option>
              <option value="pending_review">در انتظار بررسی</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">نوع کمک مالی</label>
            <Select
              value={formData.financialAidType}
              onChange={(e) => setFormData({ ...formData, financialAidType: e.target.value })}
            >
              <option value="">انتخاب نوع</option>
              <option value="grant">کمک بلاعوض</option>
              <option value="loan">وام</option>
              <option value="work_study">کار و تحصیل</option>
              <option value="tuition_waiver">معافیت شهریه</option>
              <option value="other">سایر</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">مبلغ کمک مالی</label>
          <Input
            type="number"
            value={formData.financialAidAmount}
            onChange={(e) => setFormData({ ...formData, financialAidAmount: e.target.value })}
            placeholder="مبلغ کمک مالی را وارد کنید"
            min="0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">سطح درآمد خانواده</label>
            <Select
              value={formData.familyIncomeLevel}
              onChange={(e) => setFormData({ ...formData, familyIncomeLevel: e.target.value })}
            >
              <option value="">انتخاب سطح درآمد</option>
              <option value="low">پایین</option>
              <option value="medium">متوسط</option>
              <option value="high">بالا</option>
              <option value="very_high">خیلی بالا</option>
              <option value="unknown">ناشناخته</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">وضعیت اشتغال خانواده</label>
            <Select
              value={formData.familyEmploymentStatus}
              onChange={(e) => setFormData({ ...formData, familyEmploymentStatus: e.target.value })}
            >
              <option value="">انتخاب وضعیت</option>
              <option value="employed">مشغول به کار</option>
              <option value="unemployed">بیکار</option>
              <option value="self_employed">خوداشتغال</option>
              <option value="retired">بازنشسته</option>
              <option value="student">دانشجو</option>
              <option value="other">سایر</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">شغل والدین</label>
          <Input
            type="text"
            value={formData.parentOccupation}
            onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
            placeholder="شغل والدین را وارد کنید"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">سطح تحصیلات والدین</label>
          <Select
            value={formData.parentEducationLevel}
            onChange={(e) => setFormData({ ...formData, parentEducationLevel: e.target.value })}
          >
            <option value="">انتخاب سطح تحصیلات</option>
            <option value="primary">ابتدایی</option>
            <option value="secondary">راهنمایی</option>
            <option value="high_school">دبیرستان</option>
            <option value="associate_degree">کاردانی</option>
            <option value="bachelor_degree">کارشناسی</option>
            <option value="master_degree">کارشناسی ارشد</option>
            <option value="doctorate">دکتری</option>
            <option value="other">سایر</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">شماره حساب بانکی</label>
            <Input
              type="text"
              value={formData.bankAccountNumber}
              onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
              placeholder="شماره حساب بانکی را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">نام بانک</label>
            <Input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="نام بانک را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">شعبه بانک</label>
            <Input
              type="text"
              value={formData.bankBranch}
              onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
              placeholder="شعبه بانک را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">شماره کارت بانکی</label>
            <Input
              type="text"
              value={formData.bankCardNumber}
              onChange={(e) => setFormData({ ...formData, bankCardNumber: e.target.value })}
              placeholder="شماره کارت بانکی را وارد کنید"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" loading={mutation.isPending}>
            {mutation.isPending ? "در حال ذخیره..." : "ذخیره اطلاعات"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
