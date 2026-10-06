export interface AttributeOption {
  label: string;
  value: string;
}

export interface CategoryAttribute {
  id: string;
  name: string; // e.g., "Fabric", "Saree Type", "Size"
  key: string; // e.g., "fabric", "type", "size"
  options: AttributeOption[];
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: CategoryItem[];
  attributes?: CategoryAttribute[];
}
