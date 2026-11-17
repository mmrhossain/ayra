"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchProductList } from "@/features/dashboard/admin/products/api/products";
import { saveCollection, type Collection, type CollectionInput, type CollectionSource } from "./api";
export const sourceLabels: Record<CollectionSource, string> = {
  MANUAL: "Selected products",
  NEW_ARRIVALS: "New arrivals",
  FEATURED: "Featured products",
  DISCOUNT: "Products on sale",
  BEST_SELLERS: "Best sellers",
  TRENDING: "Trending products"
};
const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
function localDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function CollectionEditor({
  collection,
  onSaved,
  onCancel
}: {
  collection?: Collection;
  onSaved(): Promise<void>;
  onCancel(): void;
}) {
  const [form, setForm] = useState(() => ({
    name: collection?.name ?? "",
    slug: collection?.slug ?? "",
    description: collection?.description ?? "",
    source: collection?.source ?? "MANUAL",
    placement: collection?.placement ?? "HOME",
    sortOrder: collection?.sortOrder ?? 0,
    limit: collection?.limit ?? 8,
    startsAt: localDate(collection?.startsAt),
    endsAt: localDate(collection?.endsAt),
    isActive: collection?.isActive ?? true
  }));
  const [slugEdited, setSlugEdited] = useState(Boolean(collection));
  const [selected, setSelected] = useState(() => (collection?.products ?? []).map(item => ({
    id: item.productId,
    name: item.product.name + (item.product.deletedAt ? " (unavailable)" : item.product.status !== "ACTIVE" ? " (not published)" : "")
  })));
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const manual = form.source === "MANUAL" || form.source === "FEATURED";
  const products = useQuery({
    queryKey: ["admin-products", "collection-picker", debouncedSearch],
    queryFn: () => fetchProductList({
      search: debouncedSearch,
      page: 1,
      limit: 20,
      includeInactive: true
    }),
    enabled: manual,
    staleTime: 30000
  });
  const mutation = useMutation({
    mutationKey: ["save-collection"],
    mutationFn: () => {
      const payload: CollectionInput = {
        ...form,
        description: form.description.trim() || null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        productIds: selected.map(item => item.id)
      };
      if (payload.startsAt && payload.endsAt && new Date(payload.endsAt) <= new Date(payload.startsAt)) throw new Error("End date must be after start date");
      return saveCollection(payload, collection?.id);
    },
    onSuccess: onSaved
  });
  const move = (index: number, direction: number) => setSelected(current => {
    const next = [...current];
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  return <form onSubmit={event => {
    event.preventDefault();
    mutation.mutate();
  }} className="space-y-5">
    <fieldset disabled={mutation.isPending} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">Name<Input required maxLength={120} value={form.name} onChange={event => {
            const name = event.target.value;
            setForm(current => ({
              ...current,
              name,
              ...(!slugEdited ? {
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
              } : {})
            }));
          }} /></label>
        <label className="space-y-1 text-sm">URL slug<Input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={event => {
            setSlugEdited(true);
            setForm({
              ...form,
              slug: event.target.value
            });
          }} /></label>
      </div>
      <label className="block space-y-1 text-sm">Description<Textarea maxLength={2000} value={form.description} onChange={event => setForm({
          ...form,
          description: event.target.value
        })} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">Collection type<select className={selectClass} value={form.source} onChange={event => setForm({
            ...form,
            source: event.target.value as CollectionSource
          })}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="space-y-1 text-sm">Placement<select className={selectClass} value={form.placement} onChange={event => setForm({
            ...form,
            placement: event.target.value as CollectionInput["placement"]
          })}><option value="HOME">Homepage and collection page</option><option value="LANDING">Collection page only</option><option value="NONE">No homepage placement</option></select></label>
        <label className="space-y-1 text-sm">Homepage position<Input required type="number" min={0} max={100000} value={form.sortOrder} onChange={event => setForm({
            ...form,
            sortOrder: Number(event.target.value)
          })} /></label>
        <label className="space-y-1 text-sm">Products per page<Input required type="number" min={1} max={48} value={form.limit} onChange={event => setForm({
            ...form,
            limit: Number(event.target.value)
          })} /></label>
        <label className="space-y-1 text-sm">Starts at (optional)<Input type="datetime-local" value={form.startsAt} onChange={event => setForm({
            ...form,
            startsAt: event.target.value
          })} /></label>
        <label className="space-y-1 text-sm">Ends at (optional)<Input type="datetime-local" value={form.endsAt} onChange={event => setForm({
            ...form,
            endsAt: event.target.value
          })} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={event => setForm({
          ...form,
          isActive: event.target.checked
        })} />Active</label>
      {manual ? <section className="space-y-3">
        <h3 className="font-medium">Products</h3>
        {form.source === "FEATURED" ? <p className="text-sm text-muted-foreground">Select products to curate this section, or leave it empty to use products marked Featured.</p> : null}
        <Input aria-label="Search products for collection" placeholder="Search products to add" value={search} onChange={event => setSearch(event.target.value)} />
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
          {products.isPending ? <p className="text-sm">Loading products...</p> : products.isError ? <p role="alert" className="text-sm text-destructive">{products.error.message}</p> : !products.data?.items.length ? <p className="text-sm text-muted-foreground">No products found.</p> : products.data.items.map(product => <label key={product.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.some(item => item.id === product.id)} onChange={event => setSelected(current => event.target.checked ? [...current, {
              id: product.id,
              name: product.name
            }] : current.filter(item => item.id !== product.id))} />
            {product.name}{product.status !== "ACTIVE" ? " (" + product.status.toLowerCase() + ")" : ""}
          </label>)}
        </div>
        {selected.length ? <ol className="space-y-2">{selected.map((item, index) => <li key={item.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
          <span className="min-w-0 flex-1">{index + 1}. {item.name}</span>
          <Button type="button" size="sm" variant="outline" disabled={index === 0} aria-label={"Move " + item.name + " up"} onClick={() => move(index, -1)}>Up</Button>
          <Button type="button" size="sm" variant="outline" disabled={index === selected.length - 1} aria-label={"Move " + item.name + " down"} onClick={() => move(index, 1)}>Down</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(current => current.filter(row => row.id !== item.id))}>Remove</Button>
        </li>)}</ol> : <p className="text-sm text-muted-foreground">No selected products. Empty manual collections are hidden on the homepage.</p>}
      </section> : <p className="text-sm text-muted-foreground">Products are selected automatically from the catalog. Only active products are shown.</p>}
      {mutation.isError ? <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p> : null}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">{mutation.isPending ? "Saving..." : "Save collection"}</Button></div>
    </fieldset>
  </form>;
}
