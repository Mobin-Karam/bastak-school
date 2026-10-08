export declare class SyncChangeDto {
    id: string;
    clientMutationId?: string;
    type?: string;
    method: "POST" | "PATCH";
    path: string;
    body?: unknown;
    createdAt?: string;
}
export declare class UploadSyncDto {
    changes: SyncChangeDto[];
}
