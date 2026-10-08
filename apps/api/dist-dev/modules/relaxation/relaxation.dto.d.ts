export declare class SaveRelaxationTrackDto {
    title: string;
    artist?: string;
    url: string;
    active?: boolean;
    organizationId?: string | null;
    gradeIds?: number[] | null;
    availableFrom?: string | null;
    availableUntil?: string | null;
}
export declare class SelectRelaxationTrackDto {
    trackId: string;
}
