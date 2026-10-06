"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddressFormMutation } from "@/features/dashboard/customer/address/hooks/use-address-mutations";
import {
  addressFormSchema,
  type AddressFormValues,
} from "@/features/dashboard/customer/address/schemas";
import type { AddressFormDialogProps } from "@/features/dashboard/customer/address/types";
import { addressFormDefaults } from "@/features/dashboard/customer/address/utils";
import { locationStore } from "@/stores/location.store";

const ADDRESS_FORM_ID = "customer-address-form";

export function AddressFormDialog({
  open,
  onOpenChange,
  editing,
  userName,
}: AddressFormDialogProps) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: addressFormDefaults(editing, userName),
  });

  // ✅ useWatch এর মাধ্যমে React Compiler এর মেমোরাইজেশন ওয়ার্নিং দূর করা হয়েছে
  const selectedDivision = useWatch({
    control: form.control,
    name: "division",
  });

  const selectedDistrict = useWatch({
    control: form.control,
    name: "district",
  });

  const {
    fetchDivisionList,
    fetchDistrictList,
    fetchPostList,
    divisionList,
    districtList,
    postList,
  } = locationStore();

  useEffect(() => {
    if (!open) return;
    form.reset(addressFormDefaults(editing, userName));
  }, [open, editing, userName, form]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const hydrate = async () => {
      await fetchDivisionList();
      if (cancelled || !editing) return;
      const division = locationStore
        .getState()
        .divisionList?.find((d) => d.name === editing.division);
      if (!division) return;
      await fetchDistrictList(division._id);
      if (cancelled) return;
      const district = locationStore
        .getState()
        .districtList?.find((d) => d.name === editing.district);
      if (district) await fetchPostList(district._id);
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [open, editing, fetchDivisionList, fetchDistrictList, fetchPostList]);

  const displayName = editing?.fullName || userName || "";

  const mutation = useAddressFormMutation({
    editingId: editing?.id ?? null,
    fullName: displayName,
    onSuccess: () => onOpenChange(false),
  });

  const handleDivisionChange = async (value: string) => {
    const selected = divisionList?.find((d) => d._id === value);
    form.setValue("division", selected?.name || "", { shouldValidate: true });
    form.setValue("district", "");
    form.setValue("thana", "");
    if (value) await fetchDistrictList(value);
  };

  const handleDistrictChange = async (value: string) => {
    const selected = districtList?.find((d) => d._id === value);
    form.setValue("district", selected?.name || "", { shouldValidate: true });
    form.setValue("thana", "");
    if (value) await fetchPostList(value);
  };

  const handleThanaChange = (value: string) => {
    const selected = postList?.find((p) => p._id === value);
    form.setValue("thana", selected?.name || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit address" : "Add address"}</DialogTitle>
          <DialogDescription>
            Bangladesh phone, division and district are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={ADDRESS_FORM_ID}
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Home, Office"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input value={displayName} readOnly />
                </FormControl>
              </FormItem>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input inputMode="tel" placeholder="01XXXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="division"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Division</FormLabel>
                    <Select
                      value={divisionList?.find((d) => d.name === field.value)?._id}
                      onValueChange={(v) => void handleDivisionChange(v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {divisionList?.map((div) => (
                          <SelectItem key={div._id} value={div._id}>
                            {div.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <Select
                      value={districtList?.find((d) => d.name === field.value)?._id}
                      onValueChange={(v) => void handleDistrictChange(v)}
                      disabled={!selectedDivision}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districtList?.map((dist) => (
                          <SelectItem key={dist._id} value={dist._id}>
                            {dist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="thana"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thana</FormLabel>
                    <Select
                      value={postList?.find((p) => p.name === field.value)?._id}
                      onValueChange={handleThanaChange}
                      disabled={!selectedDistrict}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select thana" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {postList?.map((post) => (
                          <SelectItem key={post._id} value={post._id}>
                            {post.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal code</FormLabel>
                    <FormControl>
                      <Input value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isDefaultShipping"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-2 text-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    Default shipping
                  </label>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isDefaultBilling"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-2 text-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    Default billing
                  </label>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <button
            type="submit"
            form={ADDRESS_FORM_ID}
            disabled={mutation.isPending}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : "Save address"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
