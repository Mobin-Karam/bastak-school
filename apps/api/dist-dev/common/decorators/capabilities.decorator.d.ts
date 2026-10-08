export declare const CAPABILITIES_KEY = "capabilities";
export declare const RequireCapabilities: (...capabilities: string[]) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
