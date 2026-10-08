export declare class RelaxationTrack {
    id: string;
    title: string;
    artist: string;
    url: string;
    active: boolean;
    organizationId?: string | null;
    gradeIds?: number[] | null;
    availableFrom?: string | null;
    availableUntil?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
