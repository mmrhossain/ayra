export type GeoEntity = {
  code: string;
  name: string;
  bnName: string | null;
  slug: string | null;
  aliases: string[];
  divisionCode: string | null;
  districtCode: string | null;
  upazilaCode: string | null;
};

export type GeoDivision = GeoEntity;
export type GeoDistrict = GeoEntity;
export type GeoUpazila = GeoEntity;
export type GeoUnion = GeoEntity;
