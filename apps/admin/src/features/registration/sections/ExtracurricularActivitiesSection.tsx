import { useState, useEffect } from "react";
import { Card, Input, Button, Select, Checkbox } from "../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api";

export function ExtracurricularActivitiesSection() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['registration-self'],
    queryFn: getRegistrationSelf,
  });
  
  const [formData, setFormData] = useState({
    sports: '',
    arts: '',
    music: '',
    scienceClubs: '',
    languageClubs: '',
    leadershipRoles: '',
    volunteerWork: '',
    competitions: '',
    awards: '',
    hobbies: '',
    yearsOfExperience: '',
    currentStatus: '',
  });
  
  useEffect(() => {
    if (data) {
      setFormData({
        sports: data.profile?.sports || '',
        arts: data.profile?.arts || '',
        music: data.profile?.music || '',
        scienceClubs: data.profile?.scienceClubs || '',
        languageClubs: data.profile?.languageClubs || '',
        leadershipRoles: data.profile?.leadershipRoles || '',
        volunteerWork: data.profile?.volunteerWork || '',
        competitions: data.profile?.competitions || '',
        awards: data.profile?.awards || '',
        hobbies: data.profile?.hobbies || '',
        yearsOfExperience: data.profile?.yearsOfExperience || '',
        currentStatus: data.profile?.currentStatus || '',
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
      <h2 className="text-xl font-bold text-ink mb-4">فعالیت‌های فوق برنامه</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">ورزش‌ها</label>
          <Input 
            type="text" 
            value={formData.sports}
            onChange={(e) => setFormData({...formData, sports: e.target.value})}
            placeholder="ورزش‌هایی که انجام می‌دهید را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">هنر</label>
          <Input 
            type="text" 
            value={formData.arts}
            onChange={(e) => setFormData({...formData, arts: e.target.value})}
            placeholder="فعالیت‌های هنری را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">موسیقی</label>
          <Input 
            type="text" 
            value={formData.music}
            onChange={(e) => setFormData({...formData, music: e.target.value})}
            placeholder="فعالیت‌های موسیقی را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">کلوب‌های علمی</label>
          <Input 
            type="text" 
            value={formData.scienceClubs}
            onChange={(e) => setFormData({...formData, scienceClubs: e.target.value})}
            placeholder="کلوب‌های علمی را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">کلوب‌های زبان</label>
          <Input 
            type="text" 
            value={formData.languageClubs}
            onChange={(e) => setFormData({...formData, languageClubs: e.target.value})}
            placeholder="کلوب‌های زبان را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">مقام‌های رهبری</label>
          <Input 
            type="text" 
            value={formData.leadershipRoles}
            onChange={(e) => setFormData({...formData, leadershipRoles: e.target.value})}
            placeholder="مقام‌های رهبری را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">کار داوطلبانه</label>
          <Input 
            type="text" 
            value={formData.volunteerWork}
            onChange={(e) => setFormData({...formData, volunteerWork: e.target.value})}
            placeholder="فعالیت‌های داوطلبانه را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">رقابت‌ها</label>
          <Input 
            type="text" 
            value={formData.competitions}
            onChange={(e) => setFormData({...formData, competitions: e.target.value})}
            placeholder="رقابت‌هایی که شرکت کرده‌اید را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">جوایز</label>
          <Input 
            type="text" 
            value={formData.awards}
            onChange={(e) => setFormData({...formData, awards: e.target.value})}
            placeholder="جوایزی که دریافت کرده‌اید را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">سرگرمی‌ها</label>
          <Input 
            type="text" 
            value={formData.hobbies}
            onChange={(e) => setFormData({...formData, hobbies: e.target.value})}
            placeholder="سرگرمی‌های خود را وارد کنید"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">سال‌های تجربه</label>
            <Input 
              type="number" 
              value={formData.yearsOfExperience}
              onChange={(e) => setFormData({...formData, yearsOfExperience: e.target.value})}
              placeholder="سال‌های تجربه را وارد کنید"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-1">وضعیت فعلی</label>
            <Select 
              value={formData.currentStatus}
              onChange={(e) => setFormData({...formData, currentStatus: e.target.value})}
            >
              <option value="">انتخاب وضعیت</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="on_leave">مرخصی</option>
              <option value="graduated">فارغ‌التحصیل</option>
              <option value="other">سایر</option>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button type="submit" loading={mutation.isPending}>
            {mutation.isPending ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
          </Button>
        </div>
      </form>
    </Card>
  );
}