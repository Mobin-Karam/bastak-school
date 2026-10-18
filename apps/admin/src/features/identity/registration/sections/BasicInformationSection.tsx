import { useState, useEffect } from "react";
import { Card, Input, Button, Select } from "../../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api";

export function BasicInformationSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [formData, setFormData] = useState({
    nationalCode: "",
    shenasnameNumber: "",
    birthDate: "",
    birthPlace: "",
    certificateIssuePlace: "",
    gender: "unspecified",
    educationLevel: "",
    previousSchoolInfo: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        nationalCode: data.profile?.nationalCode || "",
        shenasnameNumber: data.profile?.shenasnameNumber || "",
        birthDate: data.profile?.birthDate
          ? new Date(data.profile.birthDate).toISOString().split("T")[0]
          : "",
        birthPlace: data.profile?.birthPlace || "",
        certificateIssuePlace: data.profile?.certificateIssuePlace || "",
        gender: data.profile?.gender || "unspecified",
        educationLevel: data.profile?.educationLevel || "",
        previousSchoolInfo: data.profile?.previousSchoolInfo || "",
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
      <h2 className="text-xl font-bold text-ink mb-4">اطلاعات اولیه</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">کد ملی</label>
            <Input
              type="text"
              value={formData.nationalCode}
              onChange={(e) => setFormData({ ...formData, nationalCode: e.target.value })}
              placeholder="کد ملی را وارد کنید"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">شماره شناسنامه</label>
            <Input
              type="text"
              value={formData.shenasnameNumber}
              onChange={(e) => setFormData({ ...formData, shenasnameNumber: e.target.value })}
              placeholder="شماره شناسنامه را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">تاریخ تولد</label>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">محل تولد</label>
            <Input
              type="text"
              value={formData.birthPlace}
              onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
              placeholder="محل تولد را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">محل صدور شناسنامه</label>
            <Input
              type="text"
              value={formData.certificateIssuePlace}
              onChange={(e) => setFormData({ ...formData, certificateIssuePlace: e.target.value })}
              placeholder="محل صدور شناسنامه را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">جنسیت</label>
            <Select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="unspecified">انتخاب کنید</option>
              <option value="male">مرد</option>
              <option value="female">زن</option>
              <option value="other">سایر</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">پایه و مقطع تحصیلی</label>
          <Input
            type="text"
            value={formData.educationLevel}
            onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
            placeholder="پایه و مقطع تحصیلی را وارد کنید"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">اطلاعات مدرسه قبلی</label>
          <Input
            type="text"
            value={formData.previousSchoolInfo}
            onChange={(e) => setFormData({ ...formData, previousSchoolInfo: e.target.value })}
            placeholder="اطلاعات مدرسه قبلی را وارد کنید"
          />
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
