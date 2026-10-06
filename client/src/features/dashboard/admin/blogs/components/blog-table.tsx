"use client";

import { useDeferredValue, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BlogCategoryDeleteDialog } from "@/features/dashboard/admin/blogs/components/blog-category-delete-dialog";
import { BlogCategoryDialog } from "@/features/dashboard/admin/blogs/components/blog-category.dialog";
import { BlogDeleteDialog } from "@/features/dashboard/admin/blogs/components/blog-delete-dialog";
import { BlogPublishDialog } from "@/features/dashboard/admin/blogs/components/blog-publish-dialog";
import { BlogFormDialog } from "@/features/dashboard/admin/blogs/components/blog.dialog";
import { useBlogList } from "@/features/dashboard/admin/blogs/hooks/use-blog-list";
import {
  BLOG_STATUSES,
  type BlogCategoryListItem,
  type BlogListItem,
  type BlogStatus,
  type BlogTableProps,
  type DialogMode,
} from "@/features/dashboard/admin/blogs/types";
import { toBlogErrorMessage } from "@/features/dashboard/admin/blogs/utils";

export function BlogTable({ initialPosts, initialCategories }: BlogTableProps) {
  const [page, setPage] = useState(initialPosts.pagination.page);
  const [search, setSearch] = useState("");

  const deferredSearch = useDeferredValue(search);

  const [status, setStatus] = useState<BlogStatus | "">("");
  const [categoryId, setCategoryId] = useState("");

  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catFormMode, setCatFormMode] = useState<DialogMode>("create");
  const [editingCategory, setEditingCategory] = useState<BlogCategoryListItem | undefined>();
  const [catDeleteOpen, setCatDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<BlogCategoryListItem | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<DialogMode>("create");
  const [editing, setEditing] = useState<BlogListItem | undefined>();
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState<BlogListItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<BlogListItem | null>(null);

  // এখানে সরাসরি deferredSearch পাস করা হয়েছে
  const { query, categoriesQuery, items, pagination, categories } = useBlogList({
    initialPosts,
    initialCategories,
    page,
    search: deferredSearch.trim(),
    status,
    categoryId,
  });

  return (
    <div className="space-y-8">
      {/* Categories Section */}
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
          <div role="alert" className="rounded-xl border border-destructive/30 p-4">
            <p className="text-sm">{toBlogErrorMessage(categoriesQuery.error)}</p>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No blog categories.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                      <TableCell className="tabular-nums">{category.postCount}</TableCell>
                      <TableCell className="text-right">
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
            </Table>
          )}
        </div>
      </div>

      {/* Posts Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Posts</h2>
          <Button
            type="button"
            onClick={() => {
              setFormMode("create");
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            Add Post
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search posts"
            aria-label="Search posts"
            className="max-w-sm"
          />
          <Select
            value={status || "__all__"}
            onValueChange={(v) => {
              setStatus(v === "__all__" ? "" : (v as BlogStatus));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {BLOG_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={categoryId || "__all__"}
            onValueChange={(v) => {
              setCategoryId(v === "__all__" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-56" aria-label="Filter by category">
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
          <p className="text-sm text-muted-foreground">{pagination.total} posts</p>
        </div>

        {query.isError ? (
          <div role="alert" className="rounded-xl border border-destructive/30 p-4">
            <p className="text-sm">{toBlogErrorMessage(query.error)}</p>
          </div>
        ) : null}

        <div className="rounded-xl border">
          {query.isFetching && !query.isFetched ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No blog posts.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {post.category?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex w-fit items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${
                            post.status === "PUBLISHED"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {post.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormMode("edit");
                              setEditing(post);
                              setFormOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          {post.status !== "PUBLISHED" ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setPublishing(post);
                                setPublishOpen(true);
                              }}
                            >
                              Publish
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleting(post);
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

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || query.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages || query.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BlogCategoryDialog
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        mode={catFormMode}
        initialData={catFormMode === "edit" ? editingCategory : undefined}
      />
      <BlogCategoryDeleteDialog
        open={catDeleteOpen}
        onOpenChange={setCatDeleteOpen}
        category={deletingCategory}
      />
      <BlogFormDialog
        key={formOpen ? `${formMode}-${editing?.id ?? "new"}` : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        categories={categories}
        initialData={formMode === "edit" ? editing : undefined}
      />
      <BlogPublishDialog open={publishOpen} onOpenChange={setPublishOpen} post={publishing} />
      <BlogDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} post={deleting} />
    </div>
  );
}
