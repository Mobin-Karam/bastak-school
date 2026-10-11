export function calculateRegistrationProgress(profile: any): number {
  if (!profile) return 0;

  const requiredFields = [
    "nationalCode",
    "shenasnameNumber",
    "birthDate",
    "mobileNumber",
    "email",
    "address",
    "fatherName",
    "motherName",
  ];

  const filledFields = requiredFields.filter(
    (field) => profile[field] && profile[field].toString().trim() !== "",
  ).length;

  return Math.round((filledFields / requiredFields.length) * 100);
}

export function getRegistrationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    REVIEWING: "bg-orange-100 text-orange-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    COMPLETED: "bg-purple-100 text-purple-800",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Format as XXX-XXX-XXXX
  if (digits.length === 11) {
    return `${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`;
  }

  return phone;
}

export function validateNationalCode(nationalCode: string): boolean {
  if (!nationalCode || nationalCode.length !== 10) return false;

  const check = parseInt(nationalCode.charAt(9));
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(nationalCode.charAt(i)) * (10 - i);
  }

  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
}

export function getSectionIcon(sectionId: string): string {
  const icons: Record<string, string> = {
    basic: "📋",
    identity: "🆔",
    documents: "📄",
    contact: "📞",
    family: "👨‍👩‍👧‍👦",
    education: "🎓",
    health: "🏥",
    extracurricular: "🎭",
    "academic-interests": "📚",
    transportation: "🚌",
    financial: "💰",
    consent: "✅",
    emergency: "🚨",
    "academic-history": "📖",
    completion: "🏁",
  };

  return icons[sectionId] || "📝";
}
