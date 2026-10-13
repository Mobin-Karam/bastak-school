import { EntityManager } from "typeorm";
import { Organization } from "../../database/entities/organization.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
export declare function ensureStudentAccount(manager: EntityManager, user: User, organization: Organization): Promise<Student>;
