import { DataSource } from "typeorm";
export declare class CmbRuntimeService {
    private readonly modules;
    private readonly adapters;
    constructor(dataSource: DataSource);
    moduleInventory(): readonly Readonly<{
        id: string;
        version: string;
        kind: import("@moshaver/cmb-kernel").CmbModuleKind;
        dependencies: readonly string[];
        optionalDependencies?: readonly string[];
        provides?: readonly string[];
        requires?: readonly string[];
        routes?: readonly string[];
        migrations?: readonly string[];
        health?: readonly string[];
        permissions?: readonly string[];
        events?: Readonly<{
            publishes: readonly string[];
            subscribes: readonly string[];
        }>;
        configuration?: Readonly<Record<string, unknown>>;
    }>[];
    adapterInventory(): readonly Readonly<{
        port: string;
        id: string;
        required: boolean;
    }>[];
    readinessProbes(): {
        name: string;
        check(): Promise<void>;
    }[];
}
