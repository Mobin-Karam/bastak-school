import { useState, useEffect } from "react";
import { Card, Button, Badge, Alert } from "../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, completeRegistration } from "../api/registration.api";

export function RegistrationCompletionSection() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['registration-self'],
    queryFn: getRegistrationSelf,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const mutation = useMutation({
    mutationFn: completeRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-self'] });
      alert('ثبت‌نام با موفقیت تکمیل شد');
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await mutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
    </div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4">خطا در بارگذاری اطلاعات</div>;
  }
  
  const isComplete = data?.status === 'COMPLETED';
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-ink mb-4">تکمیل ثبت‌نام</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-ink mb-2">وضعیت ثبت‌نام</h3>
          <div className="flex items-center space-x-3">
            <Badge variant={isComplete ? 'success' : 'outline'} className={
              isComplete 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }>
              {isComplete ? 'تکمیل شده' : 'در حال انجام'}
            </Badge>
            <span className="text-sm text-slate-600">
              {isComplete 
                ? 'ثبت‌نام شما با موفقیت تکمیل شده است.' 
                : 'لطفاً تمام بخش‌های لازم را تکمیل کنید.'}
            </span>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-ink mb-2">بررسی نهایی</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {data?.profile?.nationalCode ? '✓' : '✗'}
              </Badge>
              <span className="text-sm text-ink">کد ملی</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {data?.profile?.shenasnameNumber ? '✓' : '✗'}
              </Badge>
              <span className="text-sm text-ink">شماره شناسنامه</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {data?.profile?.birthDate ? '✓' : '✗'}
              </Badge>
              <span className="text-sm text-ink">تاریخ تولد</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {data?.profile?.mobileNumber ? '✓' : '✗'}
              </Badge>
              <span className="text-sm text-ink">شماره موبایل</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {data?.documents && data.documents.length > 0 ? '✓' : '✗'}
              </Badge>
              <span className="text-sm text-ink">مدارک آپلود شده</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {data?.profile?.privacyPolicyConsent && data?.profile?.termsOfServiceConsent ? '✓' : '✗'}
              </Badge>
              <span className="text-sm text-ink">موافقت‌نامه‌ها</span>
            </div>
          </div>
        </div>
        
        {!isComplete && (
          <Alert variant="info" className="mt-4">
            <span className="font-medium">توجه:</span> قبل از تکمیل ثبت‌نام، لطفاً مطمئن شوید که تمام اطلاعات وارد شده صحیح و کامل هستند.
          </Alert>
        )}
        
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            loading={isSubmitting || mutation.isPending}
            disabled={isComplete}
            onClick={handleSubmit}
          >
            {isComplete 
              ? 'ثبت‌نام تکمیل شده' 
              : isSubmitting || mutation.isPending 
                ? 'در حال تکمیل...' 
                : 'تکمیل ثبت‌نام'}
          </Button>
        </div>
      </div>
    </Card>
  );
}