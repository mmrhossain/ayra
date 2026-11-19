"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveTable } from "@/features/dashboard/admin/shared/components/responsive-table";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { deleteTaxClass, fetchTaxClasses, saveTaxClass, taxClassesKey, type TaxClass } from "../api/tax-classes";

const empty = { name: "", code: "", rate: 0, isActive: true };
const FORM_ID = "tax-class-form";

export function TaxClassesPanel({ initialData }: { initialData: TaxClass[] }) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: taxClassesKey, queryFn: fetchTaxClasses, initialData, staleTime: 60_000 });
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<TaxClass | null>(null);
  const [id, setId] = useState<string>();
  const [form, setForm] = useState<Omit<TaxClass, "id">>(empty);
  const mutation = useMutation({
    mutationFn: () => saveTaxClass(form, id),
    onSuccess: async () => {
      setOpen(false);
      setId(undefined);
      setForm(empty);
      await client.invalidateQueries({ queryKey: taxClassesKey });
    },
  });

  const deletion = useMutation({
    mutationFn: deleteTaxClass,
    onSuccess: async (_, deletedId) => {
      if (id === deletedId) {
        setId(undefined);
        setForm(empty);
      }
      await client.invalidateQueries({ queryKey: taxClassesKey });
      setDeleting(null);
    },
  });
  const isBusy = mutation.isPending || deletion.isPending;

  const openEditor = (row?: TaxClass) => {
    mutation.reset();
    setId(row?.id);
    setForm(row ? { name: row.name, code: row.code, rate: row.rate, isActive: row.isActive } : empty);
    setOpen(true);
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Tax classes" description="Assign a class to each product. Deactivating a class stops tax on future purchases; existing orders keep their tax snapshots." />
      <div className="flex flex-wrap items-center justify-end gap-3">
        {query.data ? <p className="text-sm text-muted-foreground">{query.data.length} tax classes</p> : null}
        <Button type="button" disabled={isBusy} onClick={() => openEditor()}>Add Tax Class</Button>
      </div>

      {query.isError ? <p role="alert">{query.error.message}</p> : (
        <div className="rounded-xl border">
          <ResponsiveTable>
            <TableHeader><TableRow className="border-b"><TableHead className="p-3">Name</TableHead><TableHead className="p-3">Code</TableHead><TableHead className="p-3">Rate</TableHead><TableHead className="p-3">Status</TableHead><TableHead className="p-3 text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {query.data.length === 0 ? <TableRow><TableCell colSpan={5} className="p-6 text-center text-muted-foreground">No tax classes found.</TableCell></TableRow> : query.data.map(row => (
                <TableRow key={row.id} className="border-b last:border-0">
                  <TableCell data-label="Name" className="p-3 font-medium">{row.name}</TableCell>
                  <TableCell data-label="Code" className="p-3">{row.code}</TableCell>
                  <TableCell data-label="Rate" className="p-3">{row.rate}%</TableCell>
                  <TableCell data-label="Status" className="p-3">{row.isActive ? "Active" : "Inactive"}</TableCell>
                  <TableCell data-label="Actions" className="p-3 text-right"><div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={() => openEditor(row)}>Edit</Button><Button type="button" variant="destructive" size="sm" disabled={isBusy} aria-label={"Delete tax class " + row.name} onClick={() => { deletion.reset(); setDeleting(row); }}>Delete</Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ResponsiveTable>
        </div>
      )}

      <Dialog open={open} onOpenChange={next => { if (!isBusy) setOpen(next); }}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[95vw] flex-col overflow-hidden rounded-2xl p-5 sm:max-w-lg sm:p-6">
          <DialogHeader className="shrink-0">
            <DialogTitle>{id ? "Edit Tax Class" : "Add Tax Class"}</DialogTitle>
            <DialogDescription>{id ? "Update tax class details." : "Create a tax class to assign to products."}</DialogDescription>
          </DialogHeader>
          <form id={FORM_ID} className="min-h-0 flex-1 overflow-y-auto scrollbar-hide" onSubmit={event => { event.preventDefault(); if (!isBusy) mutation.mutate(); }}>
            <fieldset disabled={isBusy} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="tax-class-name">Name</Label><Input id="tax-class-name" required maxLength={120} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="tax-class-code">Code</Label><Input id="tax-class-code" required maxLength={50} pattern="[A-Za-z0-9_-]+" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="tax-class-rate">Rate (%)</Label><Input id="tax-class-rate" type="number" required min="0" max="100" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: Number(e.target.value) })} /></div>
              <div className="flex min-h-11 items-center gap-2"><Checkbox id="tax-class-active" checked={form.isActive} disabled={isBusy} onCheckedChange={checked => setForm({ ...form, isActive: checked === true })} /><Label htmlFor="tax-class-active" className="font-normal">Active</Label></div>
              {mutation.isError ? <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p> : null}
            </fieldset>
          </form>
          <DialogFooter className="shrink-0 border-t pt-4">
            <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isBusy} onClick={() => setOpen(false)}>Cancel</Button>
            <Button form={FORM_ID} className="w-full sm:w-auto" disabled={isBusy} type="submit">{mutation.isPending ? <><Loader2 className="size-4 animate-spin" />Saving...</> : id ? "Save changes" : "Create tax class"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    <ConfirmDialog
      open={deleting !== null}
      onOpenChange={open => {
        if (!open) setDeleting(null);
      }}
      title="Delete tax class?"
      description={deleting && (
        <>
          Permanently delete the tax class &quot;{deleting.name}&quot;?
          {deletion.isError ? (
            <span role="alert" className="mt-2 block text-destructive">
              {deletion.error.message}
            </span>
          ) : null}
        </>
      )}
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      pending={deletion.isPending}
      destructive
      onConfirm={() => {
        if (deleting) deletion.mutate(deleting.id);
      }}
    />
    </section>
  );
}
