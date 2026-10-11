import { useState, useEffect } from "react";
import { Card, Input, Button, Select } from "../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api";

export function TransportationSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [formData, setFormData] = useState({
    transportationMethod: "",
    transportationDetails: "",
    pickupLocation: "",
    dropoffLocation: "",
    pickupTime: "",
    dropoffTime: "",
    driverName: "",
    driverPhoneNumber: "",
    vehicleType: "",
    vehicleLicensePlate: "",
    emergencyTransportContact: "",
    emergencyTransportNumber: "",
    specialTransportNeeds: "",
    transportProvider: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        transportationMethod: data.profile?.transportationMethod || "",
        transportationDetails: data.profile?.transportationDetails || "",
        pickupLocation: data.profile?.pickupLocation || "",
        dropoffLocation: data.profile?.dropoffLocation || "",
        pickupTime: data.profile?.pickupTime || "",
        dropoffTime: data.profile?.dropoffTime || "",
        driverName: data.profile?.driverName || "",
        driverPhoneNumber: data.profile?.driverPhoneNumber || "",
        vehicleType: data.profile?.vehicleType || "",
        vehicleLicensePlate: data.profile?.vehicleLicensePlate || "",
        emergencyTransportContact: data.profile?.emergencyTransportContact || "",
        emergencyTransportNumber: data.profile?.emergencyTransportNumber || "",
        specialTransportNeeds: data.profile?.specialTransportNeeds || "",
        transportProvider: data.profile?.transportProvider || "",
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
      <h2 className="text-xl font-bold text-ink mb-4">حمل و نقل</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">روش حمل و نقل</label>
            <Select
              value={formData.transportationMethod}
              onChange={(e) => setFormData({ ...formData, transportationMethod: e.target.value })}
            >
              <option value="">انتخاب روش حمل و نقل</option>
              <option value="school_bus">اتوبوس مدرسه</option>
              <option value="parent_transport">حمل و نقل توسط والدین</option>
              <option value="public_transport">حمل و نقل عمومی</option>
              <option value="walking">پیاده‌روی</option>
              <option value="bicycle">دوچرخه</option>
              <option value="private_transport">حمل و نقل خصوصی</option>
              <option value="other">سایر</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">جزئیات حمل و نقل</label>
            <Input
              type="text"
              value={formData.transportationDetails}
              onChange={(e) => setFormData({ ...formData, transportationDetails: e.target.value })}
              placeholder="جزئیات حمل و نقل را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">محل برداشت</label>
            <Input
              type="text"
              value={formData.pickupLocation}
              onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
              placeholder="محل برداشت را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">محل تحویل</label>
            <Input
              type="text"
              value={formData.dropoffLocation}
              onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
              placeholder="محل تحویل را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">زمان برداشت</label>
            <Input
              type="time"
              value={formData.pickupTime}
              onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">زمان تحویل</label>
            <Input
              type="time"
              value={formData.dropoffTime}
              onChange={(e) => setFormData({ ...formData, dropoffTime: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نام راننده</label>
            <Input
              type="text"
              value={formData.driverName}
              onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
              placeholder="نام راننده را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">شماره تماس راننده</label>
            <Input
              type="tel"
              value={formData.driverPhoneNumber}
              onChange={(e) => setFormData({ ...formData, driverPhoneNumber: e.target.value })}
              placeholder="شماره تماس راننده را وارد کنید"
              maxLength={11}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نوع وسیله نقلیه</label>
            <Input
              type="text"
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              placeholder="نوع وسیله نقلیه را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">پلاک وسیله نقلیه</label>
            <Input
              type="text"
              value={formData.vehicleLicensePlate}
              onChange={(e) => setFormData({ ...formData, vehicleLicensePlate: e.target.value })}
              placeholder="پلاک وسیله نقلیه را وارد کنید"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              تماس اضطراری حمل و نقل
            </label>
            <Input
              type="text"
              value={formData.emergencyTransportContact}
              onChange={(e) =>
                setFormData({ ...formData, emergencyTransportContact: e.target.value })
              }
              placeholder="نام تماس اضطراری را وارد کنید"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              شماره تماس اضطراری حمل و نقل
            </label>
            <Input
              type="tel"
              value={formData.emergencyTransportNumber}
              onChange={(e) =>
                setFormData({ ...formData, emergencyTransportNumber: e.target.value })
              }
              placeholder="شماره تماس اضطراری را وارد کنید"
              maxLength={11}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">نیازهای ویژه حمل و نقل</label>
          <Input
            type="text"
            value={formData.specialTransportNeeds}
            onChange={(e) => setFormData({ ...formData, specialTransportNeeds: e.target.value })}
            placeholder="نیازهای ویژه حمل و نقل را وارد کنید"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            ارائه‌دهنده خدمات حمل و نقل
          </label>
          <Input
            type="text"
            value={formData.transportProvider}
            onChange={(e) => setFormData({ ...formData, transportProvider: e.target.value })}
            placeholder="ارائه‌دهنده خدمات حمل و نقل را وارد کنید"
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
