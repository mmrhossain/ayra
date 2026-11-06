import type { CustomerProfile, NotificationPreferences } from "./models";

export type {
  Envelope,
  CustomerGender,
  CustomerProfileUser,
  CustomerProfile,
  CustomerProfileUpdate,
  NotificationPreferences,
  NotificationPreferencesUpdate,
} from "./models";

export type AccountCardProps = {
  initialData: CustomerProfile;
  initialPreferences: NotificationPreferences;
};

export type AccountEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CustomerProfile;
  imageUrl: string;
};
