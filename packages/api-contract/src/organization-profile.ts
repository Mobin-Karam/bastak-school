/** Public presentation data. Never include enrollment policy, memberships or credentials. */
export type OrganizationAuthProfile = {
  published: boolean;
  displayName: string;
  brandName: string;
  description: string;
  address: string;
  phone: string;
  location: string;
  logoUrl: string;
  backgroundUrl: string;
  loginTitle: string;
  signupTitle: string;
  signupLabel: string;
  securityNotice: string;
};
export type PublicOrganizationProfile = {
  id: string;
  name: string;
  profile: OrganizationAuthProfile;
};
