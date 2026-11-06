import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ResponsiveTable } from "./responsive-table";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("ResponsiveTable", () => {
  it("adds the responsive class and preserves data-label", () => {
    act(() =>
      root.render(
        <ResponsiveTable>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell data-label="Name">Signature Tee</TableCell>
            </TableRow>
          </TableBody>
        </ResponsiveTable>,
      ),
    );

    const table = container.querySelector("table");
    expect(table?.className).toContain("responsive-table");
    expect(container.querySelector("td")?.getAttribute("data-label")).toBe(
      "Name",
    );
  });

  it("keeps an explicitly supplied className", () => {
    act(() => root.render(<ResponsiveTable className="text-xs" />));
    expect(container.querySelector("table")?.className).toContain("text-xs");
  });
});
