"use client";

import type { AttributeValueItem } from "@/features/dashboard/admin/attributes/types";

type Props = {
  value: AttributeValueItem;
  showSwatch: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function AttributeValueChip({
  value,
  showSwatch,
  onEdit,
  onDelete,
}: Props) {
  return (
    <li className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
      {showSwatch && value.color ? (
        <span
          aria-hidden
          className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: value.color }}
          title={value.color}
        />
      ) : null}
      <span>{value.value}</span>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground"
        onClick={onEdit}
      >
        Edit
      </button>
      <button
        type="button"
        className="text-destructive hover:underline"
        onClick={onDelete}
      >
        Delete
      </button>
    </li>
  );
}
