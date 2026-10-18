import { useState, useEffect } from "react";
import { Card, Input, Button } from "../../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api.ts";

export function ContactInformationSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [formData, setFormData] = useState({
    mobileNumber: "",
    phoneNumber: "",
    email: "",
    address: "",
    postalCode: "",
    city: "",
    province: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        mobileNumber: data.profile?.mobileNumber || "",
        phoneNumber: data.profile?.phoneNumber || "",
        email: data.profile?.email || "",
        address: data.profile?.address || "",
        postalCode: data.profile?.postalCode || "",
        city: data.profile?.city || "",
        province: data.profile?.province || "",
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
      <h2 className="text-xl font-bold text-ink mb-4">اطلاعات تماس</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">شماره موبایل</label>
            <Input
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
              placeholder="شماره موبایل را وارد کنید"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">شماره تلفن ثابت</label>
            <Input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="شماره تلفن ثابت را وارد کنید"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">آدرس ایمیل</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="آدرس ایمیل را وارد کنید"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">آدرس دقیق</label>
          <Input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="آدرس دقیق را وارد کنید"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">کد پستی</label>
            <Input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="کد پستی را وارد کنید"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">شهر</label>
            <Input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="نام شهر را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">استان</label>
            <Input
              type="text"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              placeholder="نام استان را وارد کنید"
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
