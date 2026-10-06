export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type CustomerGender = "MALE" | "FEMALE" | "OTHER";

export type CustomerProfileUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
};

export type CustomerProfile = {
  id: string;
  customerCode: string;
  dateOfBirth?: string | null;
  gender?: CustomerGender | null;
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: number | string;
  facebookId?: string | null;
  googleId?: string | null;
  appleId?: string | null;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  user?: CustomerProfileUser;
};

export type CustomerProfileUpdate = {
  dateOfBirth?: string;
  gender?: CustomerGender;
};
