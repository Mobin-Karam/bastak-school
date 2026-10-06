import { Outlet, useNavigate } from "react-router-dom";
import { Card, Button, Badge } from "../../../shared/ui/ui";
import { useQuery } from "@tanstack/react-query";
import { getRegistrationSelf } from "../api/registration.api";

export function RegistrationLayout() {
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['registration-self'],
    queryFn: getRegistrationSelf,
  });
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
    </div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4">خطا در بارگذاری اطلاعات</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">ثبت‌نام دانش‌آموزان</h1>
          <p className="text-slate-600 mt-1">پلتفرم ثبت‌نام مدارس</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {data?.status === 'COMPLETED' ? 'تکمیل شده' : 'در حال انجام'}
          </Badge>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/dashboard')}
          >
            بازگشت به داشبورد
          </Button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-slate-100 rounded-full h-2.5">
        <div 
          className="bg-brand h-2.5 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${data?.progress || 0}%` }}
        ></div>
      </div>
      
      {/* Main Content */}
      <div className="min-h-[calc(100vh-200px)]">
        <Outlet />
      </div>
    </div>
  );
}