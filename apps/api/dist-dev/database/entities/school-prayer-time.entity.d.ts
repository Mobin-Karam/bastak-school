import { Organization } from "./organization.entity";
export declare class SchoolPrayerTime {
    id: string;
    organization: Organization;
    date: string;
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
}
