import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { Button, Card, Input } from "../../../shared/ui/ui";
import {
  getRegistrationRequirements,
  getRegistrationSelf,
  getRegistrationStudents,
  saveRegistrationRequirements,
  submitRegistrationSection,
  updateRegistrationProfile,
  type RegistrationSection,
  type RegistrationSelf,
} from "../api/registration.api";

const sectionNames: Record<string, string> = {
  BASIC_INFORMATION: "اطلاعات پایه",
  IDENTITY_INFORMATION: "هویتی",
  ADDRESS: "آدرس",
  PARENTS: "والدین و سرپرست",
  PREVIOUS_EDUCATION: "سوابق تحصیلی",
  DOCUMENTS: "مدارک",
  HEALTH: "سلامت",
  INSURANCE: "بیمه",
  CONSENTS: "رضایت‌نامه‌ها",
  TRANSPORT: "سرویس",
  TUITION: "شهریه",
};

export function RegistrationPage() {
  const auth = useAuth();
  const orgId = auth.context?.activeOrganization?.id ?? auth.context?.memberships?.[0]?.id ?? "";
  const [self, setSelf] = useState<RegistrationSelf | null>(null);
  const [requirements, setRequirements] = useState<
    Array<RegistrationSection & { enabled: boolean }>
  >([]);
  const [students, setStudents] = useState<
    Array<{ id: string; name: string; registrationStatus: string }>
  >([]);
  const [nationalCode, setNationalCode] = useState("");
  const [birthCertificateNumber, setBirthCertificateNumber] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    if (auth.can("registration.self.read")) {
      const data = await getRegistrationSelf();
      setSelf(data);
      setNationalCode(data.student.nationalCode ?? "");
      setBirthCertificateNumber(String(data.profile?.birthCertificateNumber ?? ""));
      setAddress(String(data.profile?.address ?? ""));
    }
    if (orgId && auth.can("registration.manage"))
      setRequirements(await getRegistrationRequirements(orgId));
    if (auth.can("registration.review"))
      setStudents(await getRegistrationStudents(orgId || undefined));
  }
  useEffect(() => {
    void refresh().catch(() => setMessage("دریافت اطلاعات ثبت‌نام انجام نشد."));
  }, [orgId]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSelf(
      await updateRegistrationProfile({
        nationalCode: nationalCode || undefined,
        birthCertificateNumber: birthCertificateNumber || undefined,
        address: address || undefined,
      }),
    );
    setMessage("پرونده ذخیره شد.");
  }
  async function saveRequirements() {
    if (!orgId) return;
    await saveRegistrationRequirements(
      orgId,
      requirements.map((item, index) => ({
        sectionCode: item.sectionCode,
        enabled: item.enabled,
        required: item.required,
        sortOrder: item.sortOrder ?? (index + 1) * 10,
        announcement: item.announcement ?? "",
      })),
    );
    setMessage("مراحل ثبت‌نام ذخیره شد.");
    await refresh();
  }

  return (
    <section className="space-y-4" dir="rtl">
      <div>
        <h2 className="sr-only">ثبت‌نام و تکمیل پرونده</h2>
        <p className="mt-1 text-sm text-slate-500">
          مراحل فعال را مدیریت مدرسه تعیین می‌کند و طلبه فقط همان مراحل را تکمیل می‌کند.
        </p>
      </div>
      {message ? <p className="rounded-lg bg-brand/5 p-2 text-sm text-brand">{message}</p> : null}
      {self ? (
        <>
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-black text-ink">{self.student.name}</h2>
                <p className="text-xs text-slate-500">
                  {self.student.organization.name} · {self.student.registrationStatus}
                </p>
              </div>
            </div>
            <form onSubmit={saveProfile} className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm">
                کد ملی
                <Input value={nationalCode} onChange={(e) => setNationalCode(e.target.value)} />
              </label>
              <label className="grid gap-1 text-sm">
                شماره شناسنامه
                <Input
                  value={birthCertificateNumber}
                  onChange={(e) => setBirthCertificateNumber(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                آدرس
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>
              <div>
                <Button type="submit">ذخیره پرونده</Button>
              </div>
            </form>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            {self.sections.map((section) => (
              <Card key={section.sectionCode} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black text-ink">
                    {sectionNames[section.sectionCode] ?? section.sectionCode}
                  </h3>
                  <span className="text-xs text-slate-500">{section.status}</span>
                </div>
                {section.announcement ? (
                  <p className="mt-2 text-sm text-slate-500">{section.announcement}</p>
                ) : null}
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={async () => {
                      setSelf(await submitRegistrationSection(section.sectionCode, "SUBMITTED"));
                    }}
                  >
                    ارسال برای بررسی
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : null}
      {auth.can("registration.manage") && requirements.length ? (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-ink">مراحل اعلام‌شده توسط مدیریت</h2>
            <Button size="sm" onClick={() => void saveRequirements()}>
              ذخیره
            </Button>
          </div>
          <div className="mt-3 grid gap-2">
            {requirements.map((item, index) => (
              <div
                key={item.sectionCode}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-[rgb(var(--border-subtle))] p-3"
              >
                <span className="min-w-40 font-bold text-ink">
                  {sectionNames[item.sectionCode] ?? item.sectionCode}
                </span>
                <label className="text-sm">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) =>
                      setRequirements((all) =>
                        all.map((x, i) => (i === index ? { ...x, enabled: e.target.checked } : x)),
                      )
                    }
                  />{" "}
                  فعال
                </label>
                <label className="text-sm">
                  <input
                    type="checkbox"
                    checked={item.required}
                    onChange={(e) =>
                      setRequirements((all) =>
                        all.map((x, i) => (i === index ? { ...x, required: e.target.checked } : x)),
                      )
                    }
                  />{" "}
                  اجباری
                </label>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      {auth.can("registration.review") ? (
        <Card className="p-4">
          <h2 className="font-black text-ink">وضعیت ثبت‌نام طلبه‌ها</h2>
          <div className="mt-3 divide-y divide-[rgb(var(--border-subtle))]">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between py-2">
                <span>{student.name}</span>
                <span className="text-xs font-bold text-slate-500">
                  {student.registrationStatus}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
