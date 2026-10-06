import { ChangeEvent, useState } from "react";
import { useAuth } from "../../auth";
import { api } from "../../../shared/api/api";
import { Button, Card } from "../../../shared/ui/ui";

type ImportRow = { firstName: string; lastName: string; nationalCode?: string; gradeId?: number; educationTypeId?: string; trackId?: string };
type Preview = { total: number; valid: number; invalid: number; rows: Array<ImportRow & { row: number; errors: string[] }> };

export function StudentTransferPage() {
  const auth = useAuth();
  const organizationId = auth.context?.activeOrganization?.id ?? auth.context?.memberships?.[0]?.id ?? "";
  const [rows,setRows]=useState<ImportRow[]>([]); const [preview,setPreview]=useState<Preview|null>(null); const [message,setMessage]=useState("");
  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0]; if(!file) return; const { Workbook }=await import("exceljs"); const workbook=new Workbook(); await workbook.xlsx.load(await file.arrayBuffer()); const sheet=workbook.worksheets[0]; const parsed:ImportRow[]=[];
    sheet.eachRow((row,index)=>{ if(index===1)return; const values=row.values as unknown[]; const firstName=String(values[1]??"").trim(); const lastName=String(values[2]??"").trim(); if(!firstName&&!lastName)return; parsed.push({ firstName,lastName,nationalCode:String(values[3]??"").trim()||undefined,gradeId:Number(values[4])||undefined,educationTypeId:String(values[5]??"").trim()||undefined,trackId:String(values[6]??"").trim()||undefined }); });
    setRows(parsed); if(organizationId) setPreview(await api.post<Preview>("/students/transfer/preview",{organizationId,rows:parsed}));
  }
  async function commit(){ if(!organizationId||!rows.length)return; const result=await api.post<{committed:boolean;count?:number;invalid?:number}>("/students/transfer/commit",{organizationId,rows}); setMessage(result.committed?`${result.count??0} طلبه وارد شد.`:`فایل ${result.invalid??0} ردیف نامعتبر دارد.`); }
  async function exportXlsx(){ const data=await api.get<Array<Record<string,unknown>>>(`/students/transfer/export?organizationId=${encodeURIComponent(organizationId)}`); const {Workbook}=await import("exceljs"); const wb=new Workbook(); const ws=wb.addWorksheet("students"); ws.addRow(["نام","نام خانوادگی","کد ملی","شماره همراه","پایه","نوع آموزش","رشته","وضعیت ثبت‌نام"]); data.forEach((r)=>ws.addRow([r.firstName,r.lastName,r.nationalCode,r.phoneNumber,r.gradeId,r.educationTypeId,r.trackId,r.registrationStatus])); const bytes=await wb.xlsx.writeBuffer(); const url=URL.createObjectURL(new Blob([bytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})); const a=document.createElement("a");a.href=url;a.download="students.xlsx";a.click();URL.revokeObjectURL(url); }
  return <section className="space-y-4" dir="rtl"><div><h1 className="text-2xl font-black text-ink">ورود و خروجی Excel طلبه‌ها</h1><p className="text-sm text-slate-500">ستون‌ها: نام، نام خانوادگی، کد ملی، پایه، نوع آموزش، رشته. قبل از ورود نهایی فایل اعتبارسنجی می‌شود.</p></div><Card className="p-4"><div className="flex flex-wrap gap-2"><label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[rgb(var(--border-subtle))] px-3 text-sm font-bold"><input className="hidden" type="file" accept=".xlsx" onChange={(e)=>void pick(e)} />انتخاب Excel</label><Button variant="soft" onClick={()=>void exportXlsx()} disabled={!organizationId}>خروجی Excel</Button><Button onClick={()=>void commit()} disabled={!preview||preview.invalid>0}>ثبت {preview?.valid??0} ردیف معتبر</Button></div>{preview?<div className="mt-4 grid grid-cols-3 gap-2 text-center"><div>کل: {preview.total}</div><div className="text-emerald-700">معتبر: {preview.valid}</div><div className="text-rose-700">خطا: {preview.invalid}</div></div>:null}{message?<p className="mt-3 text-sm">{message}</p>:null}{preview?.rows.some((r)=>r.errors.length)?<div className="mt-4 max-h-64 overflow-auto text-xs">{preview.rows.filter((r)=>r.errors.length).map((r)=><p key={r.row} className="border-b py-1">ردیف {r.row}: {r.errors.join("، ")}</p>)}</div>:null}</Card></section>;
}
