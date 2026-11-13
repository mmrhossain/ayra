"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateSettingsGroup } from "@/features/dashboard/admin/settings/api/settings";
import { PUBLIC_SETTINGS_QUERY_KEY } from "@/features/settings/public-settings-provider";
import type {
  AdminSettingField,
  AdminSettingGroup,
} from "@/features/dashboard/admin/settings/types";

type FieldValues = Record<string, unknown>;

function initialValues(fields: AdminSettingField[]): FieldValues {
  const values: FieldValues = {};
  for (const field of fields) {
    if (field.type === "secret" || field.readOnly) continue;
    values[field.key] = field.value;
  }
  return values;
}

function FieldControl({
  field,
  value,
  secretValue,
  disabled,
  onChange,
  onSecretChange,
}: {
  field: AdminSettingField;
  value: unknown;
  secretValue: string;
  disabled: boolean;
  onChange: (value: unknown) => void;
  onSecretChange: (value: string) => void;
}) {
  if (field.readOnly) {
    return (
      <Input
        value={String(value ?? "")}
        disabled
        aria-label={field.label}
      />
    );
  }

  switch (field.type) {
    case "boolean":
      return (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-label={field.label}
        />
      );
    case "number":
      return (
        <NumberInput
          decimal
          value={typeof value === "number" ? value : null}
          onChange={onChange}
          disabled={disabled}
          aria-label={field.label}
        />
      );
    case "select":
      return (
        <Select
          value={String(value ?? "")}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger aria-label={field.label}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multiselect": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {(field.options ?? []).map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selected.includes(option.value)}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selected, option.value]
                    : selected.filter((item) => item !== option.value);
                  onChange(next);
                }}
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    }
    case "secret":
      return (
        <Input
          type="password"
          value={secretValue}
          onChange={(event) => onSecretChange(event.target.value)}
          disabled={disabled}
          autoComplete="new-password"
          placeholder={
            field.configured
              ? `Configured (${field.last4 ?? "****"})`
              : "Not configured"
          }
          aria-label={field.label}
        />
      );
    case "textarea":
      return (
        <Textarea
          id={field.key}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-label={field.label}
        />
      );
    default:
      return (
        <Input
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-label={field.label}
        />
      );
  }
}

export function SettingsGroupCard({
  group,
}: {
  group: AdminSettingGroup;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<FieldValues>(() =>
    initialValues(group.fields),
  );
  const [secrets, setSecrets] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => {
      const payload: FieldValues = {};
      for (const field of group.fields) {
        if (field.readOnly) continue;
        if (field.type === "secret") {
          const secret = secrets[field.key]?.trim();
          if (secret) payload[field.key] = secret;
          continue;
        }
        const value = values[field.key];
        if (field.type === "number" && value === null) {
          if (field.key === "checkout.freeShippingThreshold") {
            payload[field.key] = null;
          }
          continue;
        }
        payload[field.key] = value;
      }
      return updateSettingsGroup(group.key, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PUBLIC_SETTINGS_QUERY_KEY,
      });
      toast.success(`${group.label} settings saved`);
      setSecrets({});
      router.refresh();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not save settings",
      );
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{group.label}</CardTitle>
        <CardDescription>{group.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        {group.fields.map((field) => (
          <div
            key={field.key}
            className={
              field.type === "multiselect"
                ? "space-y-2 sm:col-span-2"
                : "space-y-2"
            }
          >
            <Label htmlFor={field.key}>{field.label}</Label>
            <FieldControl
              field={field}
              value={values[field.key]}
              secretValue={secrets[field.key] ?? ""}
              disabled={mutation.isPending}
              onChange={(value) =>
                setValues((current) => ({ ...current, [field.key]: value }))
              }
              onSecretChange={(value) =>
                setSecrets((current) => ({ ...current, [field.key]: value }))
              }
            />
            {field.help ? (
              <p className="text-xs text-muted-foreground">{field.help}</p>
            ) : null}
            {field.key === "payment.callbackBaseUrl" &&
            typeof values[field.key] === "string" &&
            /localhost|127\.0\.0\.1/.test(values[field.key] as string) ? (
              <p className="text-sm leading-snug text-destructive">
                SSLCommerz cannot reach localhost. Use a public HTTPS origin for
                live callbacks (a tunnel is fine for sandbox testing).
              </p>
            ) : null}
            {field.type === "secret" ? (
              <p className="text-xs text-muted-foreground">
                Leave blank to keep the current value.
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
