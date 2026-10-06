import type { CustomerProfile } from "./models";

export type {
  Envelope,
  CustomerGender,
  CustomerProfileUser,
  CustomerProfile,
  CustomerProfileUpdate,
} from "./models";

export type AccountCardProps = {
  initialData: CustomerProfile;
};

export type AccountEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CustomerProfile;
  imageUrl: string;
};
