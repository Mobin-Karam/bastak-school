export declare const defaultAttendanceTimeZone = "Asia/Tehran";
export declare const defaultOperationalDayStart = "04:00";
export declare function validateTimeZone(timeZone: string): void;
export declare function parseSchoolTime(time: string): {
    hour: number;
    minute: number;
};
export declare function shiftSchoolDate(date: string, days: number): string;
export declare function schoolCalendarDate(instant: Date, timeZone?: string): string;
export declare function operationalDate(instant: Date, timeZone?: string, dayStartsAt?: string): string;
export declare function schoolLocalInstant(date: string, time: string, timeZone?: string): Date;
export declare function schoolWeekday(date: string): number;
