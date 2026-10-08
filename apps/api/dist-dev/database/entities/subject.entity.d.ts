import { Organization } from "./organization.entity";
export declare class Subject {
    id: string;
    organization?: Organization | null;
    code: string;
    name: string;
    category: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
