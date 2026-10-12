import { EducationBook } from "./education-book.entity";
import type { EducationClass } from "./education-class.entity";
import { User } from "./user.entity";
export declare class EducationClassBook {
    id: string;
    classroom: EducationClass;
    book: EducationBook;
    teacher: User;
    createdAt: Date;
}
