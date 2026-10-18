import { useState, useEffect } from "react";
import { Card, Input, Button, Select, Badge } from "../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api";

export function EmergencyContactsSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [formData, setFormData] = useState({
    emergencyContact1Name: "",
    emergencyContact1Number: "",
    emergencyContact1Relationship: "",
    emergencyContact1Priority: "1",
    emergencyContact2Name: "",
    emergencyContact2Number: "",
    emergencyContact2Relationship: "",
    emergencyContact2Priority: "2",
    emergencyContact3Name: "",
    emergencyContact3Number: "",
    emergencyContact3Relationship: "",
    emergencyContact3Priority: "3",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        emergencyContact1Name: data.profile?.emergencyContact1Name || "",
        emergencyContact1Number: data.profile?.emergencyContact1Number || "",
        emergencyContact1Relationship: data.profile?.emergencyContact1Relationship || "",
        emergencyContact1Priority: data.profile?.emergencyContact1Priority || "1",
        emergencyContact2Name: data.profile?.emergencyContact2Name || "",
        emergencyContact2Number: data.profile?.emergencyContact2Number || "",
        emergencyContact2Relationship: data.profile?.emergencyContact2Relationship || "",
        emergencyContact2Priority: data.profile?.emergencyContact2Priority || "2",
        emergencyContact3Name: data.profile?.emergencyContact3Name || "",
        emergencyContact3Number: data.profile?.emergencyContact3Number || "",
        emergencyContact3Relationship: data.profile?.emergencyContact3Relationship || "",
        emergencyContact3Priority: data.profile?.emergencyContact3Priority || "3",
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
      <h2 className="text-xl font-bold text-ink mb-4">تماس‌های اضطراری</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">تماس اضطراری اول</h3>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              اولویت ۱
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">نام</label>
              <Input
                type="text"
                value={formData.emergencyContact1Name}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact1Name: e.target.value })
                }
                placeholder="نام تماس اول را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">شماره تماس</label>
              <Input
                type="tel"
                value={formData.emergencyContact1Number}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact1Number: e.target.value })
                }
                placeholder="شماره تماس اول را وارد کنید"
                maxLength={11}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">نسبت</label>
              <Select
                value={formData.emergencyContact1Relationship}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact1Relationship: e.target.value })
                }
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
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">تماس اضطراری دوم</h3>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              اولویت ۲
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">نام</label>
              <Input
                type="text"
                value={formData.emergencyContact2Name}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact2Name: e.target.value })
                }
                placeholder="نام تماس دوم را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">شماره تماس</label>
              <Input
                type="tel"
                value={formData.emergencyContact2Number}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact2Number: e.target.value })
                }
                placeholder="شماره تماس دوم را وارد کنید"
                maxLength={11}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">نسبت</label>
              <Select
                value={formData.emergencyContact2Relationship}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact2Relationship: e.target.value })
                }
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
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">تماس اضطراری سوم</h3>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              اولویت ۳
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">نام</label>
              <Input
                type="text"
                value={formData.emergencyContact3Name}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact3Name: e.target.value })
                }
                placeholder="نام تماس سوم را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">شماره تماس</label>
              <Input
                type="tel"
                value={formData.emergencyContact3Number}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact3Number: e.target.value })
                }
                placeholder="شماره تماس سوم را وارد کنید"
                maxLength={11}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">نسبت</label>
              <Select
                value={formData.emergencyContact3Relationship}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact3Relationship: e.target.value })
                }
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
