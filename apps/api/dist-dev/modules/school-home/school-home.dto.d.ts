export declare class SavePrayerTimeDto {
    date?: string;
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    source?: string;
}
export declare class SaveSchoolAnnouncementDto {
    title: string;
    body: string;
    audience: "STAFF" | "STUDENTS" | "CLASS";
    classroomId?: string;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
}
