"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relationshipRoleCodes = void 0;
exports.relationshipTypesForRoles = relationshipTypesForRoles;
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
exports.relationshipRoleCodes = {
    [user_relationship_entity_1.RelationshipType.GUARDIAN_OF]: ["GUARDIAN"],
    [user_relationship_entity_1.RelationshipType.TEACHER_OF]: ["TEACHER"],
    [user_relationship_entity_1.RelationshipType.ADVISOR_OF]: ["ADVISOR", "COUNSELOR"],
    [user_relationship_entity_1.RelationshipType.MENTOR_OF]: ["MENTOR", "STUDENT_AFFAIRS_MENTOR"],
};
function relationshipTypesForRoles(roles) {
    return Object.keys(exports.relationshipRoleCodes).filter((type) => exports.relationshipRoleCodes[type].some((role) => roles.includes(role)));
}
//# sourceMappingURL=relationship-policy.js.map