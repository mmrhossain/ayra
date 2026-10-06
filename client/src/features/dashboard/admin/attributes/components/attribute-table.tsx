"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttributeDeleteDialog } from "@/features/dashboard/admin/attributes/components/attribute-delete-dialog";
import { AttributeValueChip } from "@/features/dashboard/admin/attributes/components/attribute-value-chip";
import { AttributeValueDeleteDialog } from "@/features/dashboard/admin/attributes/components/attribute-value-delete-dialog";
import { AttributeValueFormDialog } from "@/features/dashboard/admin/attributes/components/attribute-value.dialog";
import { AttributeFormDialog } from "@/features/dashboard/admin/attributes/components/attribute.dialog";
import { useAttributeList } from "@/features/dashboard/admin/attributes/hooks/use-attribute-list";
import type {
  AttributeListItem,
  AttributeTableProps,
  AttributeValueItem,
  DialogMode,
} from "@/features/dashboard/admin/attributes/types";
import {
  isColorAttribute,
  toAttributeErrorMessage,
} from "@/features/dashboard/admin/attributes/utils";

export function AttributeTable({ initialData }: AttributeTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<DialogMode>("create");
  const [editing, setEditing] = useState<AttributeListItem | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<AttributeListItem | null>(null);

  const [valueOpen, setValueOpen] = useState(false);
  const [valueMode, setValueMode] = useState<DialogMode>("create");
  const [valueAttribute, setValueAttribute] =
    useState<AttributeListItem | null>(null);
  const [editingValue, setEditingValue] = useState<
    AttributeValueItem | undefined
  >();
  const [valueDeleteOpen, setValueDeleteOpen] = useState(false);
  const [deletingValue, setDeletingValue] = useState<AttributeValueItem | null>(
    null,
  );

  const { query, items } = useAttributeList(initialData);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} attributes
        </p>
        <Button
          type="button"
          onClick={() => {
            setFormMode("create");
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          Add Attribute
        </Button>
      </div>

      {query.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toAttributeErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched && items.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Values</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No attributes found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((attribute) => (
                  <TableRow key={attribute.id}>
                    <TableCell className="font-medium align-top">
                      {attribute.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {attribute.values.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No values
                          </p>
                        ) : (
                          <ul className="flex flex-wrap gap-2">
                            {attribute.values.map((value) => (
                              <AttributeValueChip
                                key={value.id}
                                value={value}
                                showSwatch={isColorAttribute(attribute.name)}
                                onEdit={() => {
                                  setValueAttribute(attribute);
                                  setValueMode("edit");
                                  setEditingValue(value);
                                  setValueOpen(true);
                                }}
                                onDelete={() => {
                                  setDeletingValue(value);
                                  setValueDeleteOpen(true);
                                }}
                              />
                            ))}
                          </ul>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          onClick={() => {
                            setValueAttribute(attribute);
                            setValueMode("create");
                            setEditingValue(undefined);
                            setValueOpen(true);
                          }}
                        >
                          Add value
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormMode("edit");
                            setEditing(attribute);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeleting(attribute);
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <AttributeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={formMode === "edit" ? editing : undefined}
      />
      <AttributeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        attribute={deleting}
      />
      <AttributeValueFormDialog
        open={valueOpen}
        onOpenChange={setValueOpen}
        mode={valueMode}
        attribute={valueAttribute}
        initialData={valueMode === "edit" ? editingValue : undefined}
      />
      <AttributeValueDeleteDialog
        open={valueDeleteOpen}
        onOpenChange={setValueDeleteOpen}
        value={deletingValue}
      />
    </div>
  );
}
