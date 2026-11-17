"use client";

import { useState } from "react";
import Link from "next/link";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { revalidateStorefrontTags } from "@/lib/api/revalidate";
import { archiveCollection, collectionsKey, fetchCollection, fetchCollections, type Collection } from "./api";
import { CollectionEditor, sourceLabels } from "./collection-editor";
export function CollectionsPanel() {
  const client = useQueryClient();
  const saving = useIsMutating({
    mutationKey: ["save-collection"]
  }) > 0;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const [archiving, setArchiving] = useState<Collection | null>(null);
  const query = useQuery({
    queryKey: [...collectionsKey, page, search],
    queryFn: () => fetchCollections(page, search),
    staleTime: 30000
  });
  const detail = useQuery({
    queryKey: ["admin-collection", editing],
    queryFn: () => fetchCollection(editing!),
    enabled: typeof editing === "string",
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false
  });
  const refresh = async () => {
    await Promise.all([client.invalidateQueries({
      queryKey: collectionsKey
    }), client.invalidateQueries({
      queryKey: ["admin-collection"]
    }), revalidateStorefrontTags(["home", "collections"])]);
  };
  const archive = useMutation({
    mutationFn: archiveCollection,
    onSuccess: async () => {
      setArchiving(null);
      await refresh();
    }
  });
  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Collections</h1><p className="mt-1 text-sm text-muted-foreground">Group products and manage homepage sections.</p></div><Button onClick={() => setEditing(null)}>Create collection</Button></div>
    <p className="rounded-lg border p-3 text-sm text-muted-foreground">Until you configure an active homepage collection, the homepage uses New Arrivals, Featured and Discount sections. Your active homepage collections replace those defaults. Collections group products; prices and coupons control discounts.</p>
    <form className="flex gap-2" onSubmit={event => {
      event.preventDefault();
      setPage(1);
      setSearch(searchInput.trim());
    }}><Input aria-label="Search collections" placeholder="Search collections" value={searchInput} onChange={event => setSearchInput(event.target.value)} /><Button type="submit" variant="outline">Search</Button></form>
    {query.isPending ? <p>Loading collections...</p> : query.isError ? <div role="alert"><p>{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}>Try again</Button></div> : <>
      {!query.data.items.length ? <p className="rounded-lg border p-6 text-muted-foreground">No collections found.</p> : <div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Placement</th><th className="p-3">Products</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{query.data.items.map(row => <tr className="border-b last:border-0" key={row.id}>
        <td className="p-3"><span className="font-medium">{row.name}</span><span className="block text-xs text-muted-foreground">/{row.slug}</span></td>
        <td className="p-3">{sourceLabels[row.source]}</td><td className="p-3">{row.placement === "HOME" ? "Homepage" : "Collection page"}</td><td className="p-3">{row.source === "MANUAL" || row.source === "FEATURED" && row._count?.products ? row._count?.products ?? 0 : "Automatic"}</td><td className="p-3">{row.isActive ? "Active" : "Inactive"}</td>
        <td className="p-3"><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(row.id)}>Edit</Button><Link className="underline" href={"/collections/" + row.slug} target="_blank" rel="noopener noreferrer">View</Link><Button size="sm" variant="ghost" disabled={!row.isActive || archive.isPending} onClick={() => setArchiving(row)}>Deactivate</Button></div></td>
      </tr>)}</tbody></table></div>}
      <div className="flex items-center justify-between text-sm"><span>{query.data.pagination.total} collections</span><div className="flex items-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage(current => current - 1)}>Previous</Button><span>Page {page}</span><Button variant="outline" disabled={page >= query.data.pagination.totalPages} onClick={() => setPage(current => current + 1)}>Next</Button></div></div>
    </>}
    <Dialog open={editing !== undefined} onOpenChange={open => {
      if (!open && !saving) setEditing(undefined);
    }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{editing ? "Edit collection" : "Create collection"}</DialogTitle><DialogDescription>Choose products or an automatic source, then set visibility and display order.</DialogDescription></DialogHeader>
      {editing && detail.isFetching ? <p>Loading collection...</p> : editing && detail.isError ? <p role="alert">{detail.error.message}</p> : editing === null || detail.data ? <CollectionEditor key={editing ?? "new"} collection={editing ? detail.data : undefined} onCancel={() => setEditing(undefined)} onSaved={async () => {
          setEditing(undefined);
          await refresh();
        }} /> : null}
    </DialogContent></Dialog>
    <ConfirmDialog open={Boolean(archiving)} onOpenChange={open => {
      if (!open) setArchiving(null);
    }} title="Deactivate collection?" description="It will be hidden from the homepage and its public collection page. Products and prices remain unchanged." confirmLabel="Deactivate" pending={archive.isPending} onConfirm={() => {
      if (archiving) archive.mutate(archiving.id);
    }} />
    {archive.isError ? <p role="alert" className="text-sm text-destructive">{archive.error.message}</p> : null}
  </section>;
}
