import brandConfig from "../../../brand.config.json";

export type BrandLanguage = keyof typeof brandConfig.name;

/**
 * Product presentation only. Protocol, authorization, package and persistence
 * identifiers intentionally stay outside this config as compatibility contracts.
 */
export const brand = brandConfig;

export function brandText(key: "name" | "shortName" | "description", language: BrandLanguage) {
  return brand[key][language];
}
