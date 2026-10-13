import { RelationshipType } from "../../database/entities/user-relationship.entity";
export declare const relationshipRoleCodes: Record<RelationshipType, readonly string[]>;
export declare function relationshipTypesForRoles(roles: readonly string[]): RelationshipType[];
