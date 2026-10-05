import type { CmbModuleDescriptor, CmbModuleRegistration, CmbModuleRegistry } from "@moshaver/cmb-kernel";
import type { CmbHealthService } from "@moshaver/cmb-health";

export const STARTER_MODULE: CmbModuleDescriptor;
export const builtInModules: Readonly<Record<string, CmbModuleDescriptor>>;

export type CmbStarterConfig = Readonly<{
  serviceName?: string;
  modules?: readonly (keyof typeof builtInModules)[];
  registrations?: readonly CmbModuleDescriptor[] | readonly CmbModuleRegistration[];
}>;

export function normalizeConfig(input?: CmbStarterConfig): Readonly<{
  serviceName: string;
  modules: readonly string[];
  registrations: readonly (CmbModuleDescriptor | CmbModuleRegistration)[];
}>;

export function createCmbRuntime(config?: CmbStarterConfig): Readonly<{
  config: ReturnType<typeof normalizeConfig>;
  registry: CmbModuleRegistry;
  health: CmbHealthService;
  metadata(): readonly CmbModuleDescriptor[];
  ready(): ReturnType<CmbHealthService["ready"]>;
  start(context?: Record<string, unknown>): ReturnType<CmbModuleRegistry["start"]>;
  stop(context?: Record<string, unknown>): ReturnType<CmbModuleRegistry["stop"]>;
}>;
