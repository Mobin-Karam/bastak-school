"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultOperationalDayStart = exports.defaultAttendanceTimeZone = void 0;
exports.validateTimeZone = validateTimeZone;
exports.parseSchoolTime = parseSchoolTime;
exports.shiftSchoolDate = shiftSchoolDate;
exports.schoolCalendarDate = schoolCalendarDate;
exports.operationalDate = operationalDate;
exports.schoolLocalInstant = schoolLocalInstant;
exports.schoolWeekday = schoolWeekday;
exports.defaultAttendanceTimeZone = "Asia/Tehran";
exports.defaultOperationalDayStart = "04:00";
function validateTimeZone(timeZone) {
    new Intl.DateTimeFormat("en", { timeZone }).format(new Date(0));
}
function parseSchoolTime(time) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
        throw new RangeError("Invalid school time");
    const [hour, minute] = time.split(":").map(Number);
    return { hour, minute };
}
function calendarInstant(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new RangeError("Invalid calendar date");
    const [year, month, day] = date.split("-").map(Number);
    const instant = new Date(0);
    instant.setUTCFullYear(year, month - 1, day);
    instant.setUTCHours(0, 0, 0, 0);
    if (year < 1 ||
        instant.getUTCFullYear() !== year ||
        instant.getUTCMonth() !== month - 1 ||
        instant.getUTCDate() !== day)
        throw new RangeError("Invalid calendar date");
    return instant;
}
function shiftSchoolDate(date, days) {
    if (!Number.isInteger(days))
        throw new RangeError("Invalid day offset");
    const instant = calendarInstant(date);
    instant.setUTCDate(instant.getUTCDate() + days);
    return instant.toISOString().slice(0, 10);
}
function schoolParts(instant, timeZone) {
    if (!Number.isFinite(instant.getTime()))
        throw new RangeError("Invalid attendance instant");
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        calendar: "gregory",
        numberingSystem: "latn",
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(instant);
    const value = (type) => Number(parts.find((part) => part.type === type).value);
    const year = value("year"), month = value("month"), day = value("day");
    return {
        year,
        month,
        day,
        hour: value("hour"),
        minute: value("minute"),
        second: value("second"),
        date: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    };
}
function schoolCalendarDate(instant, timeZone = exports.defaultAttendanceTimeZone) {
    return schoolParts(instant, timeZone).date;
}
function operationalDate(instant, timeZone = exports.defaultAttendanceTimeZone, dayStartsAt = exports.defaultOperationalDayStart) {
    const local = schoolParts(instant, timeZone);
    const start = parseSchoolTime(dayStartsAt);
    return local.hour * 60 + local.minute < start.hour * 60 + start.minute
        ? shiftSchoolDate(local.date, -1)
        : local.date;
}
function schoolLocalInstant(date, time, timeZone = exports.defaultAttendanceTimeZone) {
    const desired = calendarInstant(date);
    const { hour, minute } = parseSchoolTime(time);
    desired.setUTCHours(hour, minute, 0, 0);
    const offsets = new Set();
    for (const hours of [-48, -24, 0, 24, 48]) {
        const probe = new Date(desired.getTime() + hours * 3600000);
        const parts = schoolParts(probe, timeZone);
        const local = calendarInstant(parts.date);
        local.setUTCHours(parts.hour, parts.minute, parts.second, 0);
        offsets.add(local.getTime() - probe.getTime());
    }
    const candidates = [...offsets]
        .map((offset) => new Date(desired.getTime() - offset))
        .filter((candidate) => {
        const parts = schoolParts(candidate, timeZone);
        return (parts.date === date && parts.hour === hour && parts.minute === minute);
    })
        .sort((a, b) => a.getTime() - b.getTime());
    if (!candidates.length)
        throw new RangeError("This local school time does not exist");
    return candidates[0];
}
function schoolWeekday(date) {
    return calendarInstant(date).getUTCDay();
}
//# sourceMappingURL=attendance-time.js.map