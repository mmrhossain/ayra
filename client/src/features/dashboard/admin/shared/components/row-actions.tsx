"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RowAction = {
  label: string;
  onSelect?: () => void;
  href?: string;
  variant?: "default" | "destructive";
  disabled?: boolean;
};

export function splitRowActions(actions: RowAction[]) {
  const firstDestructive = actions.findIndex(
    (action) => action.variant === "destructive",
  );
  if (firstDestructive === -1) {
    return { primary: actions, destructive: [] as RowAction[] };
  }
  return {
    primary: actions.slice(0, firstDestructive),
    destructive: actions.slice(firstDestructive),
  };
}

export function RowActions({
  label,
  actions,
}: {
  label: string;
  actions: RowAction[];
}) {
  const { primary, destructive } = splitRowActions(actions);

  const renderItem = (action: RowAction, isDestructive: boolean) => {
    const variant = isDestructive ? "destructive" : "default";
    return action.href ? (
      <DropdownMenuItem
        key={action.label}
        asChild
        variant={variant}
        disabled={action.disabled}
      >
        <Link href={action.href}>{action.label}</Link>
      </DropdownMenuItem>
    ) : (
      <DropdownMenuItem
        key={action.label}
        variant={variant}
        disabled={action.disabled}
        onSelect={action.onSelect}
      >
        {action.label}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={label}
          disabled={actions.length === 0}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {primary.map((action) => renderItem(action, false))}
        {destructive.length > 0 ? <DropdownMenuSeparator /> : null}
        {destructive.map((action) => renderItem(action, true))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
