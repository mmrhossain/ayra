"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MethodFormDialog } from "@/features/dashboard/admin/shipping/components/method-dialog";
import { RateDeleteDialog } from "@/features/dashboard/admin/shipping/components/rate-delete-dialog";
import { RateFormDialog } from "@/features/dashboard/admin/shipping/components/rate-dialog";
import { ZoneDeleteDialog } from "@/features/dashboard/admin/shipping/components/zone-delete-dialog";
import { ZoneFormDialog } from "@/features/dashboard/admin/shipping/components/zone-dialog";
import { useShipping } from "@/features/dashboard/admin/shipping/hooks/use-shipping";
import type {
  ShippingMethod,
  ShippingRate,
  ShippingTableProps,
  ShippingZone,
} from "@/features/dashboard/admin/shipping/types";
import { toShippingErrorMessage } from "@/features/dashboard/admin/shipping/utils";
import { EmptyState } from "@/features/dashboard/admin/shared/components/empty-state";
import { ResponsiveTable } from "@/features/dashboard/admin/shared/components/responsive-table";
import { SectionTabs } from "@/features/dashboard/admin/shared/components/section-tabs";
import { formatMoney } from "@/lib/format";

function ActiveStatusBadge({ active }: { active: boolean }) {
  return (
    <StatusBadge variant={active ? "success" : "neutral"}>
      {active ? "Active" : "Inactive"}
    </StatusBadge>
  );
}

function TableLoading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" role="status" aria-label="Loading records">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ShippingTable({
  initialZones,
  initialMethods,
  initialRates,
}: ShippingTableProps) {
  const [zoneFormOpen, setZoneFormOpen] = useState(false);
  const [zoneFormMode, setZoneFormMode] = useState<"create" | "edit">("create");
  const [editingZone, setEditingZone] = useState<ShippingZone | undefined>();
  const [zoneDeleteOpen, setZoneDeleteOpen] = useState(false);
  const [deletingZone, setDeletingZone] = useState<ShippingZone | null>(null);

  const [methodFormOpen, setMethodFormOpen] = useState(false);
  const [methodFormMode, setMethodFormMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingMethod, setEditingMethod] = useState<
    ShippingMethod | undefined
  >();

  const [rateFormOpen, setRateFormOpen] = useState(false);
  const [rateFormMode, setRateFormMode] = useState<"create" | "edit">("create");
  const [editingRate, setEditingRate] = useState<ShippingRate | undefined>();
  const [rateDeleteOpen, setRateDeleteOpen] = useState(false);
  const [deletingRate, setDeletingRate] = useState<ShippingRate | null>(null);

  const {
    zonesQuery,
    methodsQuery,
    ratesQuery,
    zones,
    methods,
    rates,
    toggleZone,
    toggleMethod,
  } = useShipping({ initialZones, initialMethods, initialRates });

  const zonesSection = (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Zones</h2>
        <Button
          type="button"
          onClick={() => {
            setZoneFormMode("create");
            setEditingZone(undefined);
            setZoneFormOpen(true);
          }}
        >
          Add Zone
        </Button>
      </div>
      {zonesQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toShippingErrorMessage(zonesQuery.error)}</p>
        </div>
      ) : null}
      <div className="rounded-xl border">
        {zonesQuery.isFetching && zones.length === 0 ? (
          <TableLoading rows={3} />
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Districts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState
                      title="No shipping zones"
                      body="Add a zone to control where you deliver."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium" data-label="Name">
                      {zone.name}
                      {zone.isFallback ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Fallback
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      data-label="Code"
                    >
                      {zone.code}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      data-label="Districts"
                    >
                      {zone.matchDistricts.length
                        ? zone.matchDistricts.join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell data-label="Status">
                      <ActiveStatusBadge active={zone.isActive} />
                    </TableCell>
                    <TableCell className="text-right" data-label="Actions">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleZone.mutate(zone)}
                        >
                          {zone.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setZoneFormMode("edit");
                            setEditingZone(zone);
                            setZoneFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingZone(zone);
                            setZoneDeleteOpen(true);
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
    </section>
  );

  const methodsSection = (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Methods</h2>
        <Button
          type="button"
          onClick={() => {
            setMethodFormMode("create");
            setEditingMethod(undefined);
            setMethodFormOpen(true);
          }}
        >
          Add Method
        </Button>
      </div>
      {methodsQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">
            {toShippingErrorMessage(methodsQuery.error)}
          </p>
        </div>
      ) : null}
      <div className="rounded-xl border">
        {methodsQuery.isFetching && methods.length === 0 ? (
          <TableLoading />
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState
                      title="No shipping methods"
                      body="Add a method such as standard or express delivery."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium" data-label="Name">
                      {method.name}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      data-label="Code"
                    >
                      {method.code}
                    </TableCell>
                    <TableCell data-label="Status">
                      <ActiveStatusBadge active={method.isActive} />
                    </TableCell>
                    <TableCell className="text-right" data-label="Actions">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMethod.mutate(method)}
                        >
                          {method.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMethodFormMode("edit");
                            setEditingMethod(method);
                            setMethodFormOpen(true);
                          }}
                        >
                          Edit
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
    </section>
  );

  const ratesSection = (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Rates</h2>
        <Button
          type="button"
          onClick={() => {
            setRateFormMode("create");
            setEditingRate(undefined);
            setRateFormOpen(true);
          }}
        >
          Add Rate
        </Button>
      </div>
      {ratesQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toShippingErrorMessage(ratesQuery.error)}</p>
        </div>
      ) : null}
      <div className="rounded-xl border">
        {ratesQuery.isFetching && rates.length === 0 ? (
          <TableLoading rows={5} />
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Free from</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      title="No shipping rates"
                      body="Add a rate to price delivery for a zone and method."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium" data-label="Zone">
                      {rate.shippingZone?.name ?? rate.shippingZoneId}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      data-label="Method"
                    >
                      {rate.shippingMethod?.name ?? rate.shippingMethodId}
                    </TableCell>
                    <TableCell data-label="Price">
                      {formatMoney(rate.price)}
                    </TableCell>
                    <TableCell data-label="Free from">
                      {rate.freeShippingFrom == null
                        ? "—"
                        : formatMoney(rate.freeShippingFrom)}
                    </TableCell>
                    <TableCell data-label="Status">
                      <ActiveStatusBadge active={rate.isActive} />
                    </TableCell>
                    <TableCell className="text-right" data-label="Actions">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRateFormMode("edit");
                            setEditingRate(rate);
                            setRateFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingRate(rate);
                            setRateDeleteOpen(true);
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
    </section>
  );

  return (
    <div className="space-y-8">
      <SectionTabs
        label="Shipping sections"
        sections={[
          { value: "zones", label: "Zones", content: zonesSection },
          { value: "methods", label: "Methods", content: methodsSection },
          { value: "rates", label: "Rates", content: ratesSection },
        ]}
      />

      <ZoneFormDialog
        open={zoneFormOpen}
        onOpenChange={setZoneFormOpen}
        mode={zoneFormMode}
        initialData={zoneFormMode === "edit" ? editingZone : undefined}
      />
      <ZoneDeleteDialog
        open={zoneDeleteOpen}
        onOpenChange={setZoneDeleteOpen}
        zone={deletingZone}
      />
      <MethodFormDialog
        open={methodFormOpen}
        onOpenChange={setMethodFormOpen}
        mode={methodFormMode}
        initialData={methodFormMode === "edit" ? editingMethod : undefined}
      />
      <RateFormDialog
        open={rateFormOpen}
        onOpenChange={setRateFormOpen}
        mode={rateFormMode}
        zones={zones}
        methods={methods}
        initialData={rateFormMode === "edit" ? editingRate : undefined}
      />
      <RateDeleteDialog
        open={rateDeleteOpen}
        onOpenChange={setRateDeleteOpen}
        rate={deletingRate}
      />
    </div>
  );
}
