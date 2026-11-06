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

export type ListDistrictsQuery = {
  divisionCode?: string | undefined;
};

export type ListUpazilasQuery = {
  districtCode?: string | undefined;
};

export type ListUnionsQuery = {
  upazilaCode?: string | undefined;
  districtCode?: string | undefined;
};
