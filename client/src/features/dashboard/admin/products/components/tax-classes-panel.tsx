"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchTaxClasses, saveTaxClass, taxClassesKey, type TaxClass } from "../api/tax-classes";
const empty = { name: "", code: "", rate: 0, isActive: true };
export function TaxClassesPanel() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: taxClassesKey, queryFn: fetchTaxClasses, staleTime: 60_000 });
  const [id, setId] = useState<string>();
  const [form, setForm] = useState<Omit<TaxClass, "id">>(empty);
  const mutation = useMutation({
    mutationFn: () => saveTaxClass(form, id),
    onSuccess: async () => { setId(undefined); setForm(empty); await client.invalidateQueries({ queryKey: taxClassesKey }); },
  });
  return <section className="space-y-6">
    <h1 className="text-2xl font-semibold">Tax classes</h1>
    <p className="text-sm text-muted-foreground">Assign a class to each product. Deactivating a class stops tax on future purchases; existing orders keep their tax snapshots.</p>
    <form className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); mutation.mutate(); }}>
      <label className="space-y-2">Name<Input required maxLength={120} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label className="space-y-2">Code<Input required maxLength={50} pattern="[A-Za-z0-9_-]+" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></label>
      <label className="space-y-2">Rate (%)<Input type="number" required min="0" max="100" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: Number(e.target.value) })} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />Active</label>
      <div className="flex gap-2"><Button disabled={mutation.isPending} type="submit">{mutation.isPending ? "Saving..." : id ? "Save changes" : "Create tax class"}</Button>{id ? <Button type="button" variant="outline" onClick={() => { setId(undefined); setForm(empty); }}>Cancel</Button> : null}</div>
      {mutation.isError ? <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p> : null}
    </form>
    {query.isPending ? <p>Loading tax classes...</p> : query.isError ? <p role="alert">{query.error.message}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Name</th><th>Code</th><th>Rate</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{query.data.map(row => <tr key={row.id} className="border-t"><td className="p-3">{row.name}</td><td>{row.code}</td><td>{row.rate}%</td><td>{row.isActive ? "Active" : "Inactive"}</td><td><Button variant="outline" disabled={mutation.isPending} onClick={() => { setId(row.id); setForm({ name: row.name, code: row.code, rate: row.rate, isActive: row.isActive }); }}>Edit</Button></td></tr>)}</tbody></table></div>}
  </section>;
}
