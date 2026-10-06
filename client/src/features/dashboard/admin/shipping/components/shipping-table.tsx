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
import { formatMoney } from "@/lib/format";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
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
  const [methodFormMode, setMethodFormMode] = useState<"create" | "edit">("create");
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | undefined>();

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

  return (
    <div className="space-y-8">
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
          <div role="alert" className="rounded-xl border border-destructive/30 p-4">
            <p className="text-sm">{toShippingErrorMessage(zonesQuery.error)}</p>
          </div>
        ) : null}
        <div className="rounded-xl border">
          {zonesQuery.isFetching && zones.length === 0 ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
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
                    <TableCell colSpan={5} className="h-24 text-center">
                      No shipping zones.
                    </TableCell>
                  </TableRow>
                ) : (
                  zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">
                        {zone.name}
                        {zone.isFallback ? (
                          <span className="ml-2 text-xs text-muted-foreground">Fallback</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{zone.code}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {zone.matchDistricts.length ? zone.matchDistricts.join(", ") : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={zone.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
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
            </Table>
          )}
        </div>
      </section>

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
          <div role="alert" className="rounded-xl border border-destructive/30 p-4">
            <p className="text-sm">{toShippingErrorMessage(methodsQuery.error)}</p>
          </div>
        ) : null}
        <div className="rounded-xl border">
          <Table>
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
                  <TableCell colSpan={4} className="h-24 text-center">
                    No shipping methods.
                  </TableCell>
                </TableRow>
              ) : (
                methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell className="text-muted-foreground">{method.code}</TableCell>
                    <TableCell>
                      <StatusBadge active={method.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
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
          </Table>
        </div>
      </section>

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
          <div role="alert" className="rounded-xl border border-destructive/30 p-4">
            <p className="text-sm">{toShippingErrorMessage(ratesQuery.error)}</p>
          </div>
        ) : null}
        <div className="rounded-xl border">
          <Table>
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    No shipping rates.
                  </TableCell>
                </TableRow>
              ) : (
                rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">
                      {rate.shippingZone?.name ?? rate.shippingZoneId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rate.shippingMethod?.name ?? rate.shippingMethodId}
                    </TableCell>
                    <TableCell>{formatMoney(rate.price)}</TableCell>
                    <TableCell>
                      {rate.freeShippingFrom == null ? "—" : formatMoney(rate.freeShippingFrom)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge active={rate.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
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
          </Table>
        </div>
      </section>

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
