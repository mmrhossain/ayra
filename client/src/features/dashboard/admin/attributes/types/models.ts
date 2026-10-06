export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type AttributeValueItem = {
  id: string;
  value: string;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AttributeListItem = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  values: AttributeValueItem[];
};
