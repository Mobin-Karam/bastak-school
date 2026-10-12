import { useState, useEffect } from "react";
import { Card, Input, Button, Select } from "../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api";

export function AcademicHistorySection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [formData, setFormData] = useState({
    previousSchools: [
      {
        name: "",
        address: "",
        city: "",
        province: "",
        type: "",
        grade: "",
        year: "",
        gpa: "",
        rank: "",
        achievements: "",
      },
    ],
  });

  useEffect(() => {
    if (data) {
      const schools = data.profile?.previousSchools || [];
      if (schools.length === 0) {
        setFormData({
          previousSchools: [
            {
              name: "",
              address: "",
              city: "",
              province: "",
              type: "",
              grade: "",
              year: "",
              gpa: "",
              rank: "",
              achievements: "",
            },
          ],
        });
      } else {
        setFormData({ previousSchools: schools });
      }
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

  const addSchool = () => {
    setFormData({
      ...formData,
      previousSchools: [
        ...formData.previousSchools,
        {
          name: "",
          address: "",
          city: "",
          province: "",
          type: "",
          grade: "",
          year: "",
          gpa: "",
          rank: "",
          achievements: "",
        },
      ],
    });
  };

  const removeSchool = (index: number) => {
    if (formData.previousSchools.length > 1) {
      const newSchools = [...formData.previousSchools];
      newSchools.splice(index, 1);
      setFormData({ ...formData, previousSchools: newSchools });
    }
  };

  const updateSchool = (index: number, field: string, value: string) => {
    const newSchools = [...formData.previousSchools];
    newSchools[index] = { ...newSchools[index], [field]: value };
    setFormData({ ...formData, previousSchools: newSchools });
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
      <h2 className="text-xl font-bold text-ink mb-4">سوابق آکادمیک</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-ink">مدارس قبلی</h3>
          <Button type="button" variant="outline" onClick={addSchool}>
            افزودن مدرسه
          </Button>
        </div>

        {formData.previousSchools.map((school, index) => (
          <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-ink">مدرسه {index + 1}</h4>
              {formData.previousSchools.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSchool(index)}>
                  حذف
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">نام مدرسه</label>
                <Input
                  type="text"
                  value={school.name}
                  onChange={(e) => updateSchool(index, "name", e.target.value)}
                  placeholder="نام مدرسه را وارد کنید"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">آدرس مدرسه</label>
                <Input
                  type="text"
                  value={school.address}
                  onChange={(e) => updateSchool(index, "address", e.target.value)}
                  placeholder="آدرس مدرسه را وارد کنید"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">شهر</label>
                <Input
                  type="text"
                  value={school.city}
                  onChange={(e) => updateSchool(index, "city", e.target.value)}
                  placeholder="شهر را وارد کنید"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">استان</label>
                <Input
                  type="text"
                  value={school.province}
                  onChange={(e) => updateSchool(index, "province", e.target.value)}
                  placeholder="استان را وارد کنید"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">نوع مدرسه</label>
                <Select
                  value={school.type}
                  onChange={(e) => updateSchool(index, "type", e.target.value)}
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
                <label className="block text-sm font-medium text-ink mb-1">پایه تحصیلی</label>
                <Input
                  type="text"
                  value={school.grade}
                  onChange={(e) => updateSchool(index, "grade", e.target.value)}
                  placeholder="پایه تحصیلی را وارد کنید"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">سال تحصیلی</label>
                <Input
                  type="text"
                  value={school.year}
                  onChange={(e) => updateSchool(index, "year", e.target.value)}
                  placeholder="سال تحصیلی را وارد کنید"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">معدل</label>
                <Input
                  type="text"
                  value={school.gpa}
                  onChange={(e) => updateSchool(index, "gpa", e.target.value)}
                  placeholder="معدل را وارد کنید"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">رتبه</label>
                <Input
                  type="text"
                  value={school.rank}
                  onChange={(e) => updateSchool(index, "rank", e.target.value)}
                  placeholder="رتبه را وارد کنید"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">دستاوردها</label>
                <Input
                  type="text"
                  value={school.achievements}
                  onChange={(e) => updateSchool(index, "achievements", e.target.value)}
                  placeholder="دستاوردها را وارد کنید"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <Button type="submit" loading={mutation.isPending}>
            {mutation.isPending ? "در حال ذخیره..." : "ذخیره اطلاعات"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
