import type { TimetableAllocation, TimetableAvailability, TimetableConflict, TimetableHoliday, TimetableLesson, TimetableOccurrence, TimetableOverride, TimetablePeriod, TimetableSession } from "@moshaver/api-contract";
export declare function canonicalDate(value: string): string;
export declare function addDays(date: string, days: number): string;
export declare function weekdayOf(date: string): number;
export declare function minuteOf(time: string): number;
export declare function overlaps(a: {
    startTime: string;
    endTime: string;
}, b: {
    startTime: string;
    endTime: string;
}): boolean;
export declare function zonedInstant(date: string, time: string, timeZone: string): string;
export declare function occurrencesForRange(lessons: TimetableLesson[], overrides: TimetableOverride[], holidays: TimetableHoliday[], startsOn: string, endsOn: string, timeZone: string): TimetableOccurrence[];
export declare function detectTimetableConflicts(input: {
    lessons: TimetableLesson[];
    overrides: TimetableOverride[];
    holidays: TimetableHoliday[];
    availability: TimetableAvailability[];
    allocations: TimetableAllocation[];
    periods: TimetablePeriod[];
    sessions: TimetableSession[];
    startsOn: string;
    endsOn: string;
    timeZone: string;
    locations?: Array<{
        id: string;
        capacity: number;
    }>;
    classSizes?: Record<string, number>;
}): TimetableConflict[];
