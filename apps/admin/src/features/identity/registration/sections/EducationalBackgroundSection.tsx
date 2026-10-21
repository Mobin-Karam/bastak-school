import { useState, useEffect } from "react";
import { Card, Input, Button, Select } from "../../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api";

export function EducationalBackgroundSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [formData, setFormData] = useState({
    previousSchoolName: "",
    previousSchoolAddress: "",
    previousSchoolCity: "",
    previousSchoolProvince: "",
    previousSchoolType: "",
    previousSchoolGrade: "",
    previousSchoolYear: "",
    previousSchoolGPA: "",
    previousSchoolRank: "",
    previousSchoolAchievements: "",
    currentGradeLevel: "",
    currentClass: "",
    currentAcademicYear: "",
    currentGPA: "",
    currentRank: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        previousSchoolName: data.profile?.previousSchoolName || "",
        previousSchoolAddress: data.profile?.previousSchoolAddress || "",
        previousSchoolCity: data.profile?.previousSchoolCity || "",
        previousSchoolProvince: data.profile?.previousSchoolProvince || "",
        previousSchoolType: data.profile?.previousSchoolType || "",
        previousSchoolGrade: data.profile?.previousSchoolGrade || "",
        previousSchoolYear: data.profile?.previousSchoolYear || "",
        previousSchoolGPA: data.profile?.previousSchoolGPA || "",
        previousSchoolRank: data.profile?.previousSchoolRank || "",
        previousSchoolAchievements: data.profile?.previousSchoolAchievements || "",
        currentGradeLevel: data.profile?.currentGradeLevel || "",
        currentClass: data.profile?.currentClass || "",
        currentAcademicYear: data.profile?.currentAcademicYear || "",
        currentGPA: data.profile?.currentGPA || "",
        currentRank: data.profile?.currentRank || "",
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
      <h2 className="text-xl font-bold text-ink mb-4">سوابق تحصیلی</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نام مدرسه قبلی</label>
            <Input
              type="text"
              value={formData.previousSchoolName}
              onChange={(e) => setFormData({ ...formData, previousSchoolName: e.target.value })}
              placeholder="نام مدرسه قبلی را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">آدرس مدرسه قبلی</label>
            <Input
              type="text"
              value={formData.previousSchoolAddress}
              onChange={(e) => setFormData({ ...formData, previousSchoolAddress: e.target.value })}
              placeholder="آدرس مدرسه قبلی را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">شهر مدرسه قبلی</label>
            <Input
              type="text"
              value={formData.previousSchoolCity}
              onChange={(e) => setFormData({ ...formData, previousSchoolCity: e.target.value })}
              placeholder="شهر مدرسه قبلی را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">استان مدرسه قبلی</label>
            <Input
              type="text"
              value={formData.previousSchoolProvince}
              onChange={(e) => setFormData({ ...formData, previousSchoolProvince: e.target.value })}
              placeholder="استان مدرسه قبلی را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نوع مدرسه قبلی</label>
            <Select
              value={formData.previousSchoolType}
              onChange={(e) => setFormData({ ...formData, previousSchoolType: e.target.value })}
            >
              <option value="">انتخاب نوع مدرسه</option>
              <option value="public">دولتی</option>
              <option value="private">خصوصی</option>
              <option value="non_profit">غیرانتفاعی</option>
              <option value="religious">مذهبی</option>
              <option value="other">سایر</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              پایه تحصیلی در مدرسه قبلی
            </label>
            <Input
              type="text"
              value={formData.previousSchoolGrade}
              onChange={(e) => setFormData({ ...formData, previousSchoolGrade: e.target.value })}
              placeholder="پایه تحصیلی را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              سال تحصیلی در مدرسه قبلی
            </label>
            <Input
              type="text"
              value={formData.previousSchoolYear}
              onChange={(e) => setFormData({ ...formData, previousSchoolYear: e.target.value })}
              placeholder="سال تحصیلی را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">معدل در مدرسه قبلی</label>
            <Input
              type="text"
              value={formData.previousSchoolGPA}
              onChange={(e) => setFormData({ ...formData, previousSchoolGPA: e.target.value })}
              placeholder="معدل را وارد کنید"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">رتبه در مدرسه قبلی</label>
          <Input
            type="text"
            value={formData.previousSchoolRank}
            onChange={(e) => setFormData({ ...formData, previousSchoolRank: e.target.value })}
            placeholder="رتبه را وارد کنید"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            دستاوردهای تحصیلی در مدرسه قبلی
          </label>
          <Input
            type="text"
            value={formData.previousSchoolAchievements}
            onChange={(e) =>
              setFormData({ ...formData, previousSchoolAchievements: e.target.value })
            }
            placeholder="دستاوردها را وارد کنید"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">پایه تحصیلی فعلی</label>
            <Input
              type="text"
              value={formData.currentGradeLevel}
              onChange={(e) => setFormData({ ...formData, currentGradeLevel: e.target.value })}
              placeholder="پایه تحصیلی فعلی را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">کلاس فعلی</label>
            <Input
              type="text"
              value={formData.currentClass}
              onChange={(e) => setFormData({ ...formData, currentClass: e.target.value })}
              placeholder="کلاس فعلی را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">سال تحصیلی فعلی</label>
            <Input
              type="text"
              value={formData.currentAcademicYear}
              onChange={(e) => setFormData({ ...formData, currentAcademicYear: e.target.value })}
              placeholder="سال تحصیلی فعلی را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">معدل فعلی</label>
            <Input
              type="text"
              value={formData.currentGPA}
              onChange={(e) => setFormData({ ...formData, currentGPA: e.target.value })}
              placeholder="معدل فعلی را وارد کنید"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">رتبه فعلی</label>
          <Input
            type="text"
            value={formData.currentRank}
            onChange={(e) => setFormData({ ...formData, currentRank: e.target.value })}
            placeholder="رتبه فعلی را وارد کنید"
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
