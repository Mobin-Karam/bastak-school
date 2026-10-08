import { RelationshipStatus, RelationshipType } from "../../../database/entities/user-relationship.entity";
export declare class CreateRelationshipDto {
    fromUserId: string;
    toStudentId: string;
    organizationId?: string;
    type: RelationshipType;
}
export declare class UpdateRelationshipDto {
    status: RelationshipStatus;
}
