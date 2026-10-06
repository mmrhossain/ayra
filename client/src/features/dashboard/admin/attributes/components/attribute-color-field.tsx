"use client";

import type { ControllerRenderProps } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AttributeValueFormValues } from "@/features/dashboard/admin/attributes/schemas";
import {
  DEFAULT_HEX,
  HEX_COLOR,
  normalizeHex,
} from "@/features/dashboard/admin/attributes/utils";

type Props = {
  field: ControllerRenderProps<AttributeValueFormValues, "color">;
  disabled?: boolean;
};

export function AttributeColorField({ field, disabled }: Props) {
  const pickerValue = HEX_COLOR.test(field.value ?? "")
    ? normalizeHex(field.value)
    : DEFAULT_HEX;

  return (
    <FormItem>
      <FormLabel>Color</FormLabel>
      <div className="flex items-center gap-3">
        <FormControl>
          <Input
            type="color"
            value={pickerValue}
            onChange={(event) =>
              field.onChange(event.target.value.toUpperCase())
            }
            disabled={disabled}
            className="h-10 w-14 cursor-pointer p-1"
            aria-label="Pick color"
          />
        </FormControl>
        <Input
          value={field.value ?? ""}
          onChange={(event) => {
            const raw = event.target.value.toUpperCase();
            field.onChange(raw.startsWith("#") ? raw : `#${raw}`);
          }}
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          placeholder={DEFAULT_HEX}
          disabled={disabled}
          className="font-mono uppercase"
          aria-label="HEX color"
        />
      </div>
      <FormDescription>HEX format #RRGGBB</FormDescription>
      <FormMessage />
    </FormItem>
  );
}
