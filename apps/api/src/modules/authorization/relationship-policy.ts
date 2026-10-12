import { RelationshipType } from "../../database/entities/user-relationship.entity";

/** Product policy: a work role may consume only its corresponding student links. */
export const relationshipRoleCodes: Record<
  RelationshipType,
  readonly string[]
> = {
  [RelationshipType.GUARDIAN_OF]: ["GUARDIAN"],
  [RelationshipType.TEACHER_OF]: ["TEACHER"],
  [RelationshipType.ADVISOR_OF]: ["ADVISOR", "COUNSELOR"],
  [RelationshipType.MENTOR_OF]: ["MENTOR", "STUDENT_AFFAIRS_MENTOR"],
};

export function relationshipTypesForRoles(roles: readonly string[]) {
  return (Object.keys(relationshipRoleCodes) as RelationshipType[]).filter(
    (type) => relationshipRoleCodes[type].some((role) => roles.includes(role)),
  );
}
