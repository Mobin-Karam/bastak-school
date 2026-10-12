import type { EntityManager } from "typeorm";
export declare function attendanceTransaction<T>(manager: EntityManager, work: (transaction: EntityManager) => Promise<T>): Promise<T>;
