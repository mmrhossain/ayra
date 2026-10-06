import type { LegalDocumentItem, LegalListResult } from "./models";

export {
  LEGAL_STATUSES,
  LEGAL_TYPES,
} from "./models";

export type {
  CreateLegalBody,
  Envelope,
  LegalDocumentItem,
  LegalListParams,
  LegalListResult,
  LegalPagination,
  LegalStatus,
  LegalType,
  UpdateLegalBody,
} from "./models";

export type DialogMode = "create" | "edit";

export type LegalFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: LegalDocumentItem;
};

export type LegalPublishDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: LegalDocumentItem | null;
};

export type LegalTableProps = {
  initialData: LegalListResult;
};
