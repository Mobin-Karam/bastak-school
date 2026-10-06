import { useState, useEffect } from "react";
import { Card, Input, Button, Select, Checkbox } from "../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api";

export function HealthInformationSection() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['registration-self'],
    queryFn: getRegistrationSelf,
  });
  
  const [formData, setFormData] = useState({
    bloodType: '',
    height: '',
    weight: '',
    visionStatus: '',
    hearingStatus: '',
    chronicDiseases: '',
    allergies: '',
    medications: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelationship: '',
    hasDisability: false,
    disabilityType: '',
    disabilityDescription: '',
  });
  
  useEffect(() => {
    if (data) {
      setFormData({
        bloodType: data.profile?.bloodType || '',
        height: data.profile?.height || '',
        weight: data.profile?.weight || '',
        visionStatus: data.profile?.visionStatus || '',
        hearingStatus: data.profile?.hearingStatus || '',
        chronicDiseases: data.profile?.chronicDiseases || '',
        allergies: data.profile?.allergies || '',
        medications: data.profile?.medications || '',
        emergencyContactName: data.profile?.emergencyContactName || '',
        emergencyContactNumber: data.profile?.emergencyContactNumber || '',
        emergencyContactRelationship: data.profile?.emergencyContactRelationship || '',
        hasDisability: data.profile?.hasDisability || false,
        disabilityType: data.profile?.disabilityType || '',
        disabilityDescription: data.profile?.disabilityDescription || '',
      });
    }
  }, [data]);
  
  const mutation = useMutation({
    mutationFn: updateRegistrationProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-self'] });
      alert('اطلاعات با موفقیت ذخیره شد');
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
    </div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4">خطا در بارگذاری اطلاعات</div>;
  }
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-ink mb-4">اطلاعات سلامت</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">گروه خونی</label>
            <Select 
              value={formData.bloodType}
              onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
            >
              <option value="">انتخاب گروه خونی</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-1">قد (سانتی‌متر)</label>
            <Input 
              type="number" 
              value={formData.height}
              onChange={(e) => setFormData({...formData, height: e.target.value})}
              placeholder="قد را وارد کنید"
              min="50"
              max="250"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-1">وزن (کیلوگرم)</label>
            <Input 
              type="number" 
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
              placeholder="وزن را وارد کنید"
              min="10"
              max="200"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">وضعیت بینایی</label>
            <Select 
              value={formData.visionStatus}
              onChange={(e) => setFormData({...formData, visionStatus: e.target.value})}
            >
              <option value="">انتخاب وضعیت</option>
              <option value="normal">طبیعی</option>
              <option value="glasses">عینک</option>
              <option value="contact_lenses">لنز</option>
              <option value="surgery">جراحی</option>
              <option value="other">سایر</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-1">وضعیت شنوایی</label>
            <Select 
              value={formData.hearingStatus}
              onChange={(e) => setFormData({...formData, hearingStatus: e.target.value})}
            >
              <option value="">انتخاب وضعیت</option>
              <option value="normal">طبیعی</option>
              <option value="hearing_aid">پوشش شنوایی</option>
              <option value="surgery">جراحی</option>
              <option value="other">سایر</option>
            </Select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">بیماری‌های مزمن</label>
          <Input 
            type="text" 
            value={formData.chronicDiseases}
            onChange={(e) => setFormData({...formData, chronicDiseases: e.target.value})}
            placeholder="بیماری‌های مزمن را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">حساسیت‌ها</label>
          <Input 
            type="text" 
            value={formData.allergies}
            onChange={(e) => setFormData({...formData, allergies: e.target.value})}
            placeholder="حساسیت‌ها را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">داروها</label>
          <Input 
            type="text" 
            value={formData.medications}
            onChange={(e) => setFormData({...formData, medications: e.target.value})}
            placeholder="داروها را وارد کنید"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نام تماس اضطراری</label>
            <Input 
              type="text" 
              value={formData.emergencyContactName}
              onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
              placeholder="نام تماس اضطراری را وارد کنید"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-1">شماره تماس اضطراری</label>
            <Input 
              type="tel" 
              value={formData.emergencyContactNumber}
              onChange={(e) => setFormData({...formData, emergencyContactNumber: e.target.value})}
              placeholder="شماره تماس اضطراری را وارد کنید"
              maxLength={11}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نسبت با دانش‌آموز</label>
            <Select 
              value={formData.emergencyContactRelationship}
              onChange={(e) => setFormData({...formData, emergencyContactRelationship: e.target.value})}
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
        
        <div className="flex items-center space-x-3">
          <Checkbox 
            id="hasDisability"
            checked={formData.hasDisability}
            onCheckedChange={(checked) => setFormData({...formData, hasDisability: checked as boolean})}
          />
          <label htmlFor="hasDisability" className="text-sm font-medium text-ink">
            دارای ناتوانی است
          </label>
        </div>
        
        {formData.hasDisability && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">نوع ناتوانی</label>
              <Select 
                value={formData.disabilityType}
                onChange={(e) => setFormData({...formData, disabilityType: e.target.value})}
              >
                <option value="">انتخاب نوع ناتوانی</option>
                <option value="physical">بدنی</option>
                <option value="visual">بینایی</option>
                <option value="hearing">شنوایی</option>
                <option value="speech">گفتاری</option>
                <option value="intellectual">ذهنی</option>
                <option value="learning">یادگیری</option>
                <option value="emotional">عاطفی</option>
                <option value="autism">توهمی</option>
                <option value="other">سایر</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-1">توضیحات ناتوانی</label>
              <Input 
                type="text" 
                value={formData.disabilityDescription}
                onChange={(e) => setFormData({...formData, disabilityDescription: e.target.value})}
                placeholder="توضیحات ناتوانی را وارد کنید"
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end pt-4">
          <Button type="submit" loading={mutation.isPending}>
            {mutation.isPending ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
          </Button>
        </div>
      </form>
    </Card>
  );
}