"use client";

import { useMemo, useState } from "react";

import { FaqCategoryDeleteDialog } from "@/features/dashboard/admin/faqs/components/faq-category-delete-dialog";
import { FaqCategoryFormDialog } from "@/features/dashboard/admin/faqs/components/faq-category.dialog";
import { FaqItemDeleteDialog } from "@/features/dashboard/admin/faqs/components/faq-item-delete-dialog";
import { FaqItemFormDialog } from "@/features/dashboard/admin/faqs/components/faq-item.dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  toFaqErrorMessage,
  type FaqCategoryListItem,
  type FaqItemListItem,
} from "@/features/dashboard/admin/faqs/api/faqs";
import { useFaqList } from "@/features/dashboard/admin/faqs/hooks/use-faq-list";
import { EmptyState } from "@/features/dashboard/admin/shared/components/empty-state";
import { ResponsiveTable } from "@/features/dashboard/admin/shared/components/responsive-table";
import { SectionTabs } from "@/features/dashboard/admin/shared/components/section-tabs";

type Props = {
  initialCategories: FaqCategoryListItem[];
  initialItems: FaqItemListItem[];
};

export function FaqTable({ initialCategories, initialItems }: Props) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catFormMode, setCatFormMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<
    FaqCategoryListItem | undefined
  >();
  const [catDeleteOpen, setCatDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] =
    useState<FaqCategoryListItem | null>(null);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemFormMode, setItemFormMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<FaqItemListItem | undefined>();
  const [itemDeleteOpen, setItemDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FaqItemListItem | null>(
    null,
  );

  const { categoriesQuery, itemsQuery, categories, items } = useFaqList({
    initialCategories,
    initialItems,
    categoryFilter,
  });
  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) map.set(category.id, category.name);
    return map;
  }, [categories]);

  const categoriesSection = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Categories</h2>
        <Button
          type="button"
          onClick={() => {
            setCatFormMode("create");
            setEditingCategory(undefined);
            setCatFormOpen(true);
          }}
        >
          Add Category
        </Button>
      </div>

      {categoriesQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toFaqErrorMessage(categoriesQuery.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {categoriesQuery.isFetching && categories.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState
                      title="No FAQ categories"
                      body="Add a category to group your questions."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium" data-label="Name">
                      {category.name}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      data-label="Slug"
                    >
                      {category.slug}
                    </TableCell>
                    <TableCell className="tabular-nums" data-label="Items">
                      {category.itemCount}
                    </TableCell>
                    <TableCell data-label="Status">
                      <StatusBadge
                        variant={category.isActive ? "success" : "neutral"}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right" data-label="Actions">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCatFormMode("edit");
                            setEditingCategory(category);
                            setCatFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingCategory(category);
                            setCatDeleteOpen(true);
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
          </ResponsiveTable>
        )}
      </div>
    </div>
  );

  const questionsSection = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Questions</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={categoryFilter || "__all__"}
            onValueChange={(v) => setCategoryFilter(v === "__all__" ? "" : v)}
          >
            <SelectTrigger
              className="w-full sm:w-56"
              aria-label="Filter by category"
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            disabled={categories.length === 0}
            onClick={() => {
              setItemFormMode("create");
              setEditingItem(undefined);
              setItemFormOpen(true);
            }}
          >
            Add FAQ
          </Button>
        </div>
      </div>

      {itemsQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toFaqErrorMessage(itemsQuery.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {itemsQuery.isFetching &&
        !itemsQuery.isFetched &&
        items.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState
                      title="No FAQ items"
                      body="Publish an answer so customers can find it."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell
                      className="max-w-md font-medium"
                      data-label="Question"
                    >
                      {item.question}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      data-label="Category"
                    >
                      {categoryNameById.get(item.categoryId) ?? "—"}
                    </TableCell>
                    <TableCell data-label="Status">
                      <StatusBadge
                        variant={item.isPublished ? "success" : "warning"}
                      >
                        {item.isPublished ? "Published" : "Draft"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right" data-label="Actions">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setItemFormMode("edit");
                            setEditingItem(item);
                            setItemFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingItem(item);
                            setItemDeleteOpen(true);
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
          </ResponsiveTable>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <SectionTabs
        label="FAQ sections"
        sections={[
          { value: "questions", label: "Questions", content: questionsSection },
          {
            value: "categories",
            label: "Categories",
            content: categoriesSection,
          },
        ]}
      />

      <FaqCategoryFormDialog
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        mode={catFormMode}
        initialData={catFormMode === "edit" ? editingCategory : undefined}
      />
      <FaqCategoryDeleteDialog
        open={catDeleteOpen}
        onOpenChange={setCatDeleteOpen}
        category={deletingCategory}
      />
      <FaqItemFormDialog
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        mode={itemFormMode}
        categories={categories}
        initialData={itemFormMode === "edit" ? editingItem : undefined}
        defaultCategoryId={categoryFilter || undefined}
      />
      <FaqItemDeleteDialog
        open={itemDeleteOpen}
        onOpenChange={setItemDeleteOpen}
        item={deletingItem}
      />
    </div>
  );
}
