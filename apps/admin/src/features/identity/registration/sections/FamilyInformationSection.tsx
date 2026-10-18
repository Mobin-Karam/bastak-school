import { useState, useEffect } from "react";
import { Card, Input, Button, Select } from "../../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api.ts";

export function FamilyInformationSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [formData, setFormData] = useState({
    fatherName: "",
    fatherNationalCode: "",
    fatherMobileNumber: "",
    fatherOccupation: "",
    motherName: "",
    motherNationalCode: "",
    motherMobileNumber: "",
    motherOccupation: "",
    guardianName: "",
    guardianNationalCode: "",
    guardianMobileNumber: "",
    guardianRelationship: "",
    familySize: "",
    siblingsCount: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        fatherName: data.profile?.fatherName || "",
        fatherNationalCode: data.profile?.fatherNationalCode || "",
        fatherMobileNumber: data.profile?.fatherMobileNumber || "",
        fatherOccupation: data.profile?.fatherOccupation || "",
        motherName: data.profile?.motherName || "",
        motherNationalCode: data.profile?.motherNationalCode || "",
        motherMobileNumber: data.profile?.motherMobileNumber || "",
        motherOccupation: data.profile?.motherOccupation || "",
        guardianName: data.profile?.guardianName || "",
        guardianNationalCode: data.profile?.guardianNationalCode || "",
        guardianMobileNumber: data.profile?.guardianMobileNumber || "",
        guardianRelationship: data.profile?.guardianRelationship || "",
        familySize: data.profile?.familySize || "",
        siblingsCount: data.profile?.siblingsCount || "",
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
      <h2 className="text-xl font-bold text-ink mb-4">اطلاعات خانواده</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نام پدر</label>
            <Input
              type="text"
              value={formData.fatherName}
              onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              placeholder="نام پدر را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">کد ملی پدر</label>
            <Input
              type="text"
              value={formData.fatherNationalCode}
              onChange={(e) => setFormData({ ...formData, fatherNationalCode: e.target.value })}
              placeholder="کد ملی پدر را وارد کنید"
              maxLength={10}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">شماره موبایل پدر</label>
            <Input
              type="tel"
              value={formData.fatherMobileNumber}
              onChange={(e) => setFormData({ ...formData, fatherMobileNumber: e.target.value })}
              placeholder="شماره موبایل پدر را وارد کنید"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">شغل پدر</label>
            <Input
              type="text"
              value={formData.fatherOccupation}
              onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
              placeholder="شغل پدر را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نام مادر</label>
            <Input
              type="text"
              value={formData.motherName}
              onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
              placeholder="نام مادر را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">کد ملی مادر</label>
            <Input
              type="text"
              value={formData.motherNationalCode}
              onChange={(e) => setFormData({ ...formData, motherNationalCode: e.target.value })}
              placeholder="کد ملی مادر را وارد کنید"
              maxLength={10}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">شماره موبایل مادر</label>
            <Input
              type="tel"
              value={formData.motherMobileNumber}
              onChange={(e) => setFormData({ ...formData, motherMobileNumber: e.target.value })}
              placeholder="شماره موبایل مادر را وارد کنید"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">شغل مادر</label>
            <Input
              type="text"
              value={formData.motherOccupation}
              onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
              placeholder="شغل مادر را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نام سرپرست قانونی</label>
            <Input
              type="text"
              value={formData.guardianName}
              onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
              placeholder="نام سرپرست قانونی را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">کد ملی سرپرست</label>
            <Input
              type="text"
              value={formData.guardianNationalCode}
              onChange={(e) => setFormData({ ...formData, guardianNationalCode: e.target.value })}
              placeholder="کد ملی سرپرست را وارد کنید"
              maxLength={10}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">شماره موبایل سرپرست</label>
            <Input
              type="tel"
              value={formData.guardianMobileNumber}
              onChange={(e) => setFormData({ ...formData, guardianMobileNumber: e.target.value })}
              placeholder="شماره موبایل سرپرست را وارد کنید"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">نسبت با دانش‌آموز</label>
            <Select
              value={formData.guardianRelationship}
              onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
            >
              <option value="">انتخاب نسبت</option>
              <option value="father">پدر</option>
              <option value="mother">مادر</option>
              <option value="brother">برادر</option>
              <option value="sister">خواهر</option>
              <option value="uncle">عمو</option>
              <option value="aunt">خاله</option>
              <option value="grandfather">پدربزرگ</option>
              <option value="grandmother">مادربزرگ</option>
              <option value="other">سایر</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">تعداد اعضای خانواده</label>
            <Input
              type="number"
              value={formData.familySize}
              onChange={(e) => setFormData({ ...formData, familySize: e.target.value })}
              placeholder="تعداد اعضای خانواده را وارد کنید"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              تعداد برادران و خواهران
            </label>
            <Input
              type="number"
              value={formData.siblingsCount}
              onChange={(e) => setFormData({ ...formData, siblingsCount: e.target.value })}
              placeholder="تعداد برادران و خواهران را وارد کنید"
              min="0"
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
