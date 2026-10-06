import type {
  ShippingMethod,
  ShippingRate,
  ShippingZone,
} from "./models";

export type {
  CreateShippingMethodBody,
  CreateShippingRateBody,
  CreateShippingZoneBody,
  ShippingMethod,
  ShippingOptionsResult,
  ShippingQuote,
  ShippingRate,
  ShippingZone,
} from "./models";

export type DialogMode = "create" | "edit";

export type ZoneFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: ShippingZone;
};

export type MethodFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: ShippingMethod;
};

export type RateFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  zones: ShippingZone[];
  methods: ShippingMethod[];
  initialData?: ShippingRate;
};

export type ZoneDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: ShippingZone | null;
};

export type RateDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: ShippingRate | null;
};

export type ShippingTableProps = {
  initialZones: ShippingZone[];
  initialMethods: ShippingMethod[];
  initialRates: ShippingRate[];
};
