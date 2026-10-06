import { useState, useEffect } from "react";
import { Card, Input, Button, Select, Checkbox } from "../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, updateRegistrationProfile } from "../api/registration.api";

export function AcademicInterestsSection() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['registration-self'],
    queryFn: getRegistrationSelf,
  });
  
  const [formData, setFormData] = useState({
    favoriteSubjects: '',
    leastFavoriteSubjects: '',
    academicStrengths: '',
    academicChallenges: '',
    learningStyle: '',
    preferredLearningMethods: '',
    careerInterests: '',
    universityInterests: '',
    researchInterests: '',
    academicGoals: '',
    studyHabits: '',
  });
  
  useEffect(() => {
    if (data) {
      setFormData({
        favoriteSubjects: data.profile?.favoriteSubjects || '',
        leastFavoriteSubjects: data.profile?.leastFavoriteSubjects || '',
        academicStrengths: data.profile?.academicStrengths || '',
        academicChallenges: data.profile?.academicChallenges || '',
        learningStyle: data.profile?.learningStyle || '',
        preferredLearningMethods: data.profile?.preferredLearningMethods || '',
        careerInterests: data.profile?.careerInterests || '',
        universityInterests: data.profile?.universityInterests || '',
        researchInterests: data.profile?.researchInterests || '',
        academicGoals: data.profile?.academicGoals || '',
        studyHabits: data.profile?.studyHabits || '',
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
      <h2 className="text-xl font-bold text-ink mb-4">علاقه‌مندی‌های آکادمیک</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">درسهای مورد علاقه</label>
          <Input 
            type="text" 
            value={formData.favoriteSubjects}
            onChange={(e) => setFormData({...formData, favoriteSubjects: e.target.value})}
            placeholder="درسهای مورد علاقه را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">درسهای کمتر مورد علاقه</label>
          <Input 
            type="text" 
            value={formData.leastFavoriteSubjects}
            onChange={(e) => setFormData({...formData, leastFavoriteSubjects: e.target.value})}
            placeholder="درسهای کمتر مورد علاقه را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">نقاط قوت آکادمیک</label>
          <Input 
            type="text" 
            value={formData.academicStrengths}
            onChange={(e) => setFormData({...formData, academicStrengths: e.target.value})}
            placeholder="نقاط قوت آکادمیک را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">چالش‌های آکادمیک</label>
          <Input 
            type="text" 
            value={formData.academicChallenges}
            onChange={(e) => setFormData({...formData, academicChallenges: e.target.value})}
            placeholder="چالش‌های آکادمیک را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">سبک یادگیری</label>
          <Select 
            value={formData.learningStyle}
            onChange={(e) => setFormData({...formData, learningStyle: e.target.value})}
          >
            <option value="">انتخاب سبک یادگیری</option>
            <option value="visual">بینایی</option>
            <option value="auditory">شنوایی</option>
            <option value="kinesthetic">حرکتی</option>
            <option value="reading_writing">خواندن/نوشتن</option>
            <option value="multimodal">چندوجهی</option>
            <option value="other">سایر</option>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">روش‌های ترجیحی یادگیری</label>
          <Input 
            type="text" 
            value={formData.preferredLearningMethods}
            onChange={(e) => setFormData({...formData, preferredLearningMethods: e.target.value})}
            placeholder="روش‌های ترجیحی یادگیری را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">علاقه‌مندی‌های شغلی</label>
          <Input 
            type="text" 
            value={formData.careerInterests}
            onChange={(e) => setFormData({...formData, careerInterests: e.target.value})}
            placeholder="علاقه‌مندی‌های شغلی را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">علاقه‌مندی‌های دانشگاهی</label>
          <Input 
            type="text" 
            value={formData.universityInterests}
            onChange={(e) => setFormData({...formData, universityInterests: e.target.value})}
            placeholder="علاقه‌مندی‌های دانشگاهی را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">علاقه‌مندی‌های تحقیقاتی</label>
          <Input 
            type="text" 
            value={formData.researchInterests}
            onChange={(e) => setFormData({...formData, researchInterests: e.target.value})}
            placeholder="علاقه‌مندی‌های تحقیقاتی را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">اهداف آکادمیک</label>
          <Input 
            type="text" 
            value={formData.academicGoals}
            onChange={(e) => setFormData({...formData, academicGoals: e.target.value})}
            placeholder="اهداف آکادمیک را وارد کنید"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">عادات مطالعه</label>
          <Input 
            type="text" 
            value={formData.studyHabits}
            onChange={(e) => setFormData({...formData, studyHabits: e.target.value})}
            placeholder="عادات مطالعه را وارد کنید"
          />
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