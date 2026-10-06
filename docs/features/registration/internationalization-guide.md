# Registration Feature Internationalization Guide

## Overview

This internationalization (i18n) guide provides comprehensive requirements, implementation guidelines, and best practices for supporting multiple languages and cultural conventions in the Registration Feature.

## Internationalization Requirements

### Language Support

| Language | Status | Features | Translation Coverage |
|----------|--------|----------|---------------------|
| **Persian (Farsi)** | ✅ Production | RTL layout, Jalali calendar, Persian numbers | 100% |
| **English** | ✅ Production | LTR layout, Gregorian calendar, English numbers | 95% |
| **Arabic** | ⚠️ Beta | RTL layout, Hijri calendar, Arabic numbers | 75% |
| **Turkish** | ⚠️ Beta | LTR layout, Gregorian calendar, Turkish numbers | 65% |
| **French** | 🚧 Planned | LTR layout, Gregorian calendar, French numbers | 0% |
| **Spanish** | 🚧 Planned | LTR layout, Gregorian calendar, Spanish numbers | 0% |

### Cultural Conventions

| Convention | Persian | English | Arabic | Turkish |
|------------|---------|---------|--------|---------|
| **Text Direction** | RTL | LTR | RTL | LTR |
| **Date Format** | Jalali (1394/01/15) | Gregorian (2024-01-15) | Hijri (1445/07/15) | Gregorian (15.01.2024) |
| **Number Format** | Persian digits (۰-۹) | ASCII digits (0-9) | Arabic digits (٠-٩) | ASCII digits (0-9) |
| **Currency** | IRR (﷼) | USD ($) | SAR (ر.س) | TRY (₺) |
| **Name Order** | Given + Family | Given + Family | Given + Family | Given + Family |
| **Address Format** | City, Street, Building | Street, City, State | City, Street, Building | Street, City, Province |

## Internationalization Implementation Guidelines

### i18n Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend Layer                                   │
│  • React-i18next integration                                              │
│  • Language detection and negotiation                                       │
│  • RTL/LTR layout switching                                                 │
│  • Dynamic translation loading                                              │
│  • Locale-specific formatting (dates, numbers, currencies)                   │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Backend Layer                                    │
│  • API localization support                                                 │
│  • Database localization (multilingual fields)                              │
│  • Content negotiation (Accept-Language header)                             │
│  • Locale-aware validation and formatting                                    │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Infrastructure Layer                             │
│  • CDN-based language routing                                               │
│  • Edge-based locale detection                                                │
│  • Multi-region deployment                                                    │
│  • Language-specific caching                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### React-i18next Configuration

```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Load translations from backend
const backendOptions = {
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  allowMultiLoading: true,
};

// Language detection options
const detectionOptions = {
  order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
  caches: ['cookie', 'localStorage'],
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupLocalStorage: 'i18nextLng',
  htmlTag: document.documentElement,
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fa',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already escapes values
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        return value;
      },
    },
    react: {
      useSuspense: true,
      wait: true,
      bindI18n: 'languageChanged loaded',
      bindStore: 'added removed',
      nsMode: 'default',
    },
    detection: detectionOptions,
    backend: backendOptions,
    // Language-specific configuration
    supportedLngs: ['fa', 'en', 'ar', 'tr'],
    nonExplicitSupportedLngs: true,
    // RTL/LTR detection
    rtl: {
      fa: true,
      ar: true,
      en: false,
      tr: false,
    },
  });

export default i18n;
```

### Translation File Structure

```
public/locales/
├── fa/
│   ├── common.json          # Common strings
│   ├── registration.json    # Registration-specific strings
│   ├── validation.json      # Validation messages
│   └── errors.json          # Error messages
├── en/
│   ├── common.json
│   ├── registration.json
│   ├── validation.json
│   └── errors.json
├── ar/
│   ├── common.json
│   ├── registration.json
│   ├── validation.json
│   └── errors.json
└── tr/
    ├── common.json
    ├── registration.json
    ├── validation.json
    └── errors.json
```

### Sample Translation Files

```json
// public/locales/fa/common.json
{
  "next": "بعدی",
  "previous": "قبلی",
  "save": "ذخیره",
  "cancel": "انصراف",
  "submit": "ارسال",
  "complete": "تکمیل",
  "loading": "در حال بارگذاری...",
  "error": "خطا",
  "success": "موفقیت‌آمیز",
  "required": "الزامی"
}
```

```json
// public/locales/fa/registration.json
{
  "basicInformation": "اطلاعات اولیه",
  "identityInformation": "اطلاعات شناسایی",
  "documents": "مدارک",
  "contactInformation": "اطلاعات تماس",
  "familyInformation": "اطلاعات خانواده",
  "educationalBackground": "سوابق تحصیلی",
  "healthInformation": "اطلاعات سلامت",
  "extracurricularActivities": "فعالیت‌های فوق برنامه",
  "academicInterests": "علاقه‌مندی‌های تحصیلی",
  "transportation": "حمل و نقل",
  "financialInformation": "اطلاعات مالی",
  "consentAndAgreements": "موافقت‌نامه‌ها و توافق‌نامه‌ها",
  "emergencyContacts": "تماس‌های اضطراری",
  "academicHistory": "تاریخچه تحصیلی",
  "registrationCompletion": "تکمیل ثبت‌نام"
}
```

## Localization Implementation

### Date & Time Localization

```tsx
// ✅ Good: Locale-aware date formatting
import { format, parse, parseISO } from 'date-fns';
import { faIR, enUS, arSA, trTR } from 'date-fns/locale';

const getLocale = () => {
  const lang = i18n.language || 'fa';
  switch (lang) {
    case 'fa': return faIR;
    case 'en': return enUS;
    case 'ar': return arSA;
    case 'tr': return trTR;
    default: return faIR;
  }
};

const formatDate = (date: Date | string) => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'PP', { locale: getLocale() });
};

// ✅ Good: Jalali calendar support
import { jalali } from 'jalali-moment';

const formatJalaliDate = (date: Date | string) => {
  const jalaliDate = jalali(date);
  return `${jalaliDate.format('jYYYY/jMM/jDD')} ${jalaliDate.format('jMMMM jYYYY')}`;
};
```

### Number & Currency Localization

```tsx
// ✅ Good: Locale-aware number formatting
const formatNumber = (num: number) => {
  const lang = i18n.language || 'fa';
  const options: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };
  
  // Persian numbers
  if (lang === 'fa') {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const formatted = new Intl.NumberFormat(lang, options).format(num);
    return formatted.replace(/\d/g, (match) => persianDigits[parseInt(match)]);
  }
  
  return new Intl.NumberFormat(lang, options).format(num);
};

// ✅ Good: Currency formatting
const formatCurrency = (amount: number, currency: string = 'IRR') => {
  const lang = i18n.language || 'fa';
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  
  return new Intl.NumberFormat(lang, options).format(amount);
};
```

### RTL/LTR Layout Management

```tsx
// ✅ Good: Dynamic RTL/LTR management
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const RegistrationLayout = () => {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // Set HTML direction based on language
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
    
    // Add language-specific classes
    document.body.className = `lang-${i18n.language}`;
    
    // Update font family
    const fontMap: Record<string, string> = {
      'fa': 'Vazir, Tahoma, sans-serif',
      'en': 'Inter, system-ui, sans-serif',
      'ar': 'Tajawal, system-ui, sans-serif',
      'tr': 'Inter, system-ui, sans-serif',
    };
    
    document.documentElement.style.fontFamily = fontMap[i18n.language] || fontMap['fa'];
  }, [i18n.language]);
  
  return (
    <div className="min-h-screen bg-gray-50" dir={i18n.dir()}>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('registration.title')}
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
```

## Internationalization Testing

### Test Categories

| Test Type | Description | Tools | Frequency |
|-----------|-------------|-------|-----------|
| **Language Switching** | Verify language changes work correctly | Manual testing | Per Release |
| **RTL/LTR Layout** | Check proper text direction and alignment | Manual testing, Lighthouse | Per Release |
| **Date Formatting** | Verify locale-appropriate date formats | Automated tests | CI Pipeline |
| **Number Formatting** | Verify locale-appropriate number formats | Automated tests | CI Pipeline |
| **Currency Formatting** | Verify locale-appropriate currency formats | Automated tests | CI Pipeline |
| **Text Expansion** | Check UI handles longer translated text | Manual testing | Per Release |
| **Character Encoding** | Verify proper Unicode handling | Automated tests | CI Pipeline |
| **Input Method** | Test with different input methods | Manual testing | Quarterly |

### Internationalization Test Cases

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| **Language Switching** | Change language from Persian to English | All text changes to English, layout switches to LTR |
| **RTL Layout** | View Persian interface | Text flows right-to-left, alignment is right-aligned |
| **Date Format** | View date in Persian interface | Shows Jalali date (1394/01/15) |
| **Date Format** | View date in English interface | Shows Gregorian date (2024-01-15) |
| **Number Format** | View numbers in Persian interface | Shows Persian digits (۱۲۳۴۵) |
| **Number Format** | View numbers in English interface | Shows ASCII digits (12345) |
| **Currency Format** | View currency in Persian interface | Shows IRR (﷼۱۲۳۴۵) |
| **Currency Format** | View currency in English interface | Shows USD ($12345) |
| **Text Expansion** | View English translation of Persian text | UI accommodates longer English text without overflow |
| **Input Method** | Type Persian text using IME | Proper Persian character input and rendering |

### Sample i18n Test Script

```typescript
// tests/i18n.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { RegistrationDashboardPage } from '../RegistrationDashboardPage';

// Mock translation resources
const mockResources = {
  fa: {
    common: { next: 'بعدی' },
    registration: { title: 'ثبت‌نام دانش‌آموزان' },
  },
  en: {
    common: { next: 'Next' },
    registration: { title: 'Student Registration' },
  },
};

describe('Internationalization Tests', () => {
  it('displays Persian text when language is set to fa', async () => {
    // Initialize i18n with Persian resources
    i18n.addResourceBundle('fa', 'common', mockResources.fa.common);
    i18n.addResourceBundle('fa', 'registration', mockResources.fa.registration);
    i18n.changeLanguage('fa');
    
    render(
      <I18nextProvider i18n={i18n}>
        <RegistrationDashboardPage />
      </I18nextProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('ثبت‌نام دانش‌آموزان')).toBeInTheDocument();
      expect(screen.getByText('بعدی')).toBeInTheDocument();
      expect(document.documentElement.dir).toBe('rtl');
    });
  });
  
  it('displays English text when language is set to en', async () => {
    // Initialize i18n with English resources
    i18n.addResourceBundle('en', 'common', mockResources.en.common);
    i18n.addResourceBundle('en', 'registration', mockResources.en.registration);
    i18n.changeLanguage('en');
    
    render(
      <I18nextProvider i18n={i18n}>
        <RegistrationDashboardPage />
      </I18nextProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Student Registration')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(document.documentElement.dir).toBe('ltr');
    });
  });
});
```

## Internationalization Configuration

### Required i18n Configuration

| Setting | Description | Configuration |
|---------|-------------|---------------|
| **Default Language** | Primary language for the application | `fa` (Persian) |
| **Supported Languages** | List of supported languages | `['fa', 'en', 'ar', 'tr']` |
| **Language Detection** | How to detect user's preferred language | Query param, cookie, localStorage, browser header |
| **Fallback Language** | Language to use when translation is missing | `fa` (Persian) |
| **RTL Detection** | Which languages require RTL layout | `fa`, `ar` |
| **Font Fallback** | Font stack for each language | Persian: Vazir, Tahoma; English: Inter, system fonts |

### i18n Configuration File

```json
// config/i18n.config.json
{
  "defaultLanguage": "fa",
  "supportedLanguages": [
    {"code": "fa", "name": "فارسی", "rtl": true, "font": "Vazir, Tahoma, sans-serif"},
    {"code": "en", "name": "English", "rtl": false, "font": "Inter, system-ui, sans-serif"},
    {"code": "ar", "name": "العربية", "rtl": true, "font": "Tajawal, system-ui, sans-serif"},
    {"code": "tr", "name": "Türkçe", "rtl": false, "font": "Inter, system-ui, sans-serif"}
  ],
  "detection": {
    "order": ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
    "caches": ["cookie", "localStorage"],
    "lookupQuerystring": "lng",
    "lookupCookie": "i18next",
    "lookupLocalStorage": "i18nextLng"
  },
  "backend": {
    "loadPath": "/locales/{{lng}}/{{ns}}.json",
    "allowMultiLoading": true
  },
  "formatting": {
    "date": {
      "fa": "jYYYY/jMM/jDD",
      "en": "yyyy-MM-dd",
      "ar": "iYYYY/iMM/iDD",
      "tr": "dd.MM.yyyy"
    },
    "number": {
      "fa": "persian",
      "en": "english",
      "ar": "arabic",
      "tr": "english"
    },
    "currency": {
      "fa": "IRR",
      "en": "USD",
      "ar": "SAR",
      "tr": "TRY"
    }
  }
}
```

## License

MIT License