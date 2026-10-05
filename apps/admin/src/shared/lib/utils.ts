import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  digitsArToFa,
  digitsEnToFa,
  digitsFaToEn,
  toPersianChars,
} from "@persian-tools/persian-tools";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fa(value: unknown) {
  return digitsArToFa(digitsEnToFa(String(value ?? "")));
}

export function normalizePersianText(value: unknown) {
  return toPersianChars(digitsArToFa(digitsEnToFa(String(value ?? ""))));
}

export function englishDigits(value: unknown) {
  return digitsFaToEn(String(value ?? ""));
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Display-only labels; API identifiers remain stable English values. */
export function educationLabel(value: string, language: "fa" | "en" = "fa") {
  const labels: Record<"fa" | "en", Record<string, string>> = {
    fa: {
      general: "عمومی",
      theoretical: "نظری",
      technical_vocational: "فنی و حرفه‌ای",
      kar_danesh: "کاردانش",
      math_physics: "ریاضی و فیزیک",
      experimental_sciences: "علوم تجربی",
      humanities: "علوم انسانی",
    },
    en: {
      general: "General",
      theoretical: "Theoretical",
      technical_vocational: "Technical and vocational",
      kar_danesh: "Skills and knowledge",
      math_physics: "Mathematics and physics",
      experimental_sciences: "Experimental sciences",
      humanities: "Humanities",
    },
  };
  return labels[language][value] || value;
}
