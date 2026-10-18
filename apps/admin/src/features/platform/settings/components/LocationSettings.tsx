import { CalendarDays, MapPin } from "lucide-react";
import { Card, Field, Select } from "../../../shared/ui/ui";
import { locationLabel, locations, useLocale, type LocationId } from "../../../shared/ui/locale";
import { settingsCopy } from "../settings-locale";
export function LocationSettings({
  locale,
  onChange,
}: {
  locale: ReturnType<typeof useLocale>;
  onChange?: (id: LocationId) => void;
}) {
  const copy = settingsCopy(locale.language);
  return (
    <Card className="h-full p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-sky-50 text-sky-700">
          <MapPin size={20} />
        </span>
        <div>
          <h3 className="font-bold">{copy.locationTitle}</h3>
          <p className="text-xs text-slate-500">{copy.locationDescription}</p>
        </div>
      </div>
      <div className="grid gap-3">
        <Field label={copy.defaultLocation}>
          <Select
            value={locale.profile.id}
            onChange={(event) => {
              const id = event.target.value as LocationId;
              locale.setLocation(id);
              onChange?.(id);
            }}
          >
            {locations.map((item) => (
              <option key={item.id} value={item.id}>
                {locationLabel(item, locale.language)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="rounded-lg border bg-slate-50 p-3 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarDays size={16} />
            <span>{copy.currentDisplay}</span>
          </div>
          <strong className="mt-2 block">
            {locale.profile.calendar === "persian" ? copy.persianCalendar : copy.gregorianCalendar}{" "}
            · <span dir="ltr">{locale.profile.timeZone}</span>
          </strong>
          <p className="mt-1 text-slate-500">
            {copy.today}:{" "}
            {locale.formatDate(new Date(), {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <p className="text-xs text-slate-500">{copy.locationStored}</p>
      </div>
    </Card>
  );
}
