"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

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
  fetchContactMessages,
  toContactMessageErrorMessage,
  updateContactMessageStatus,
} from "@/features/dashboard/admin/contact-messages/api/contact-messages";
import type {
  ContactMessageListResult,
  ContactMessageStatus,
} from "@/features/dashboard/admin/contact-messages/types";
import { EmptyState } from "@/features/dashboard/admin/shared/components/empty-state";
import { ResponsiveTable } from "@/features/dashboard/admin/shared/components/responsive-table";

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  NEW: "New",
  READ: "Read",
  RESOLVED: "Resolved",
};

const STATUS_VARIANTS = {
  NEW: "warning",
  READ: "info",
  RESOLVED: "success",
} as const;

export function ContactMessageTable({
  initialData,
}: {
  initialData: ContactMessageListResult;
}) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [status, setStatus] = useState<ContactMessageStatus | "">("");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-contact-messages", page, status],
    queryFn: () =>
      fetchContactMessages({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
      }),
    initialData: page === initialData.pagination.page && status === "" ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const result = query.data ?? initialData;
  const mutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: ContactMessageStatus }) =>
      updateContactMessageStatus(id, nextStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      toast.success("Contact message updated");
    },
    onError: (error) => toast.error(toContactMessageErrorMessage(error)),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={status || "__all__"}
          onValueChange={(value) => {
            setStatus(value === "__all__" ? "" : (value as ContactMessageStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter contact messages by status">
            <SelectValue placeholder="All messages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All messages</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="READ">Read</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{result.pagination.total} messages</p>
      </div>

      {query.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
          <p className="text-sm">{toContactMessageErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      title="No contact messages"
                      body="Messages submitted through the storefront will appear here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                result.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium" data-label="Sender">
                      {item.firstName} {item.lastName}
                    </TableCell>
                    <TableCell data-label="Contact">
                      <a className="block text-primary hover:underline" href={`mailto:${item.email}`}>
                        {item.email}
                      </a>
                      <a className="text-muted-foreground hover:underline" href={`tel:${item.phone}`}>
                        {item.phone}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-md whitespace-pre-wrap break-words" data-label="Message">
                      {item.message}
                    </TableCell>
                    <TableCell className="whitespace-nowrap" data-label="Submitted">
                      {new Date(item.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell data-label="Status">
                      <StatusBadge variant={STATUS_VARIANTS[item.status]}>
                        {STATUS_LABELS[item.status]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right" data-label="Update">
                      <Select
                        value={item.status}
                        onValueChange={(value) =>
                          mutation.mutate({
                            id: item.id,
                            nextStatus: value as ContactMessageStatus,
                          })
                        }
                        disabled={mutation.isPending}
                      >
                        <SelectTrigger
                          className="ml-auto w-36"
                          aria-label={`Update status for message from ${item.firstName} ${item.lastName}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </ResponsiveTable>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {result.pagination.page} of {Math.max(result.pagination.totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= result.pagination.totalPages || query.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
