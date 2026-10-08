export declare class ChangeOwnPhoneNumberDto {
    phoneNumber: string;
}
export declare class CreatePhoneNumberChangeRequestDto extends ChangeOwnPhoneNumberDto {
    organizationId: string;
    reason?: string;
}
export declare class ReviewPhoneNumberChangeRequestDto {
    reviewNote?: string;
}
