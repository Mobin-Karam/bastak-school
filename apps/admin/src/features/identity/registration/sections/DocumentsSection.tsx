import { useState, useRef } from "react";
import { Card, Badge, Alert } from "../../../shared/ui/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRegistrationSelf, uploadStudentDocument } from "../api/registration.api";

export function DocumentsSection() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });

  const [selectedType, setSelectedType] = useState("");
  const [, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const mutation = useMutation({
    mutationFn: ({ studentId, type, file }: { studentId: string; type: string; file: File }) =>
      uploadStudentDocument(studentId, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-self"] });
      alert("مدرک با موفقیت آپلود شد");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      setUploadError(error.response?.data?.message || "خطا در آپلود مدرک");
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedType) return;

    setUploading(true);
    setUploadError("");

    mutation.mutate({
      studentId: data?.student.id || "",
      type: selectedType,
      file,
    });
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

  const documentTypes = [
    { code: "SHENASNAME", name: "شناسنامه", description: "تصویر شناسنامه دانش‌آموز" },
    { code: "NATIONAL_CARD", name: "کارت ملی", description: "تصویر کارت ملی دانش‌آموز" },
    {
      code: "PARENT_DOCUMENTS",
      name: "مدارک والدین",
      description: "تصویر شناسنامه یا کارت ملی والدین",
    },
    { code: "PERSONAL_PHOTO", name: "عکس پرسنلی", description: "عکس پرسنلی دانش‌آموز" },
    { code: "HEALTH_RECORD", name: "پرونده سلامت", description: "پرونده سلامت / اطلاعات پزشکی" },
    { code: "VACCINATION_RECORD", name: "واکسیناسیون", description: "وضعیت واکسیناسیون" },
    { code: "INSURANCE_INFO", name: "اطلاعات بیمه", description: "اطلاعات بیمه" },
    { code: "CONSENT_FORMS", name: "رضایت‌نامه‌ها", description: "رضایت‌نامه‌ها و تعهدنامه‌ها" },
    { code: "TRANSPORT_INFO", name: "سرویس مدرسه", description: "اطلاعات سرویس مدرسه" },
    { code: "TUITION_INFO", name: "شهریه", description: "اطلاعات پرداخت شهریه" },
    {
      code: "LEGAL_GUARDIAN_SIGNATURE",
      name: "امضای ولی",
      description: "امضای ولی یا سرپرست قانونی",
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-ink mb-4">مدارک</h2>

      <div className="mb-6">
        <p className="text-slate-600 mb-4">
          لطفاً مدارک مورد نیاز را بر اساس توضیحات زیر آپلود کنید. هر مدرک باید تصویر واضح و کامل
          باشد.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentTypes.map((docType) => (
            <div key={docType.code} className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-1">{docType.name}</h3>
              <p className="text-sm text-slate-500 mb-2">{docType.description}</p>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                {docType.code}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-ink mb-3">آپلود مدرک</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">نوع مدرک</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-10 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
            >
              <option value="">انتخاب نوع مدرک</option>
              {documentTypes.map((docType) => (
                <option key={docType.code} value={docType.code}>
                  {docType.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">فایل</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="w-full h-10 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>
        </div>

        {uploadError && (
          <Alert variant="destructive" className="mb-4">
            <span>{uploadError}</span>
          </Alert>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-ink mb-3">مدارک آپلود شده</h3>

        {data?.documents && data.documents.length > 0 ? (
          <div className="space-y-3">
            {data.documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
                <div>
                  <div className="font-medium text-ink">{doc.type?.name || doc.type}</div>
                  <div className="text-sm text-slate-500">{doc.originalFileName}</div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    doc.status === "VERIFIED"
                      ? "bg-green-100 text-green-800"
                      : doc.status === "SUBMITTED"
                        ? "bg-blue-100 text-blue-800"
                        : doc.status === "WAITING_REVIEW"
                          ? "bg-yellow-100 text-yellow-800"
                          : doc.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-800"
                  }
                >
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>هیچ مدرکی آپلود نشده است</p>
          </div>
        )}
      </div>
    </Card>
  );
}
