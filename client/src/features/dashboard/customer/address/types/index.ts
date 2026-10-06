import type { SavedAddress } from "./models";
import type { AddressFormValues } from "../schemas";

export type { Envelope, SavedAddress, AddressPayload } from "./models";

export type AddressFormState = AddressFormValues;

export type AddressPageProps = {
  initialData: SavedAddress[];
};

export type AddressListProps = {
  addresses: SavedAddress[];
  loading: boolean;
  userName?: string;
  onAdd: () => void;
  onEdit: (address: SavedAddress) => void;
  onDelete: (address: SavedAddress) => void;
};

export type AddressFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SavedAddress | null;
  userName?: string;
};

export type AddressDeleteDialogProps = {
  address: SavedAddress | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};
