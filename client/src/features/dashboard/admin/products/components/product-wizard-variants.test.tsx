import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { variantsFromProduct } from "@/features/dashboard/admin/products/utils";
import { ProductWizardVariants } from "./product-wizard-variants";

it("preserves an existing variant while its attribute options are loading", async () => {
  const environment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  const rows = variantsFromProduct({
    id: "shirt",
    name: "Shirt",
    slug: "shirt",
    variants: [{
      id: "variant-1",
      sku: "SHIRT-M",
      price: "500",
      compareAtPrice: "650.50",
      costPrice: "0.00",
      isDefault: true,
      availableStock: 12,
      attributes: [{ attributeValue: { id: "medium", value: "Medium", attributeId: "size" } }],
    }],
  });
  const onRowsChange = vi.fn();
  const props = {
    categoryName: "Shirts",
    attributes: [],
    selected: [{ attributeId: "size", valueIds: ["medium"] }],
    onSelectedChange: vi.fn(),
    rows,
    onRowsChange,
  };

  try {
    await act(async () => root.render(<ProductWizardVariants {...props} />));
    expect(onRowsChange).not.toHaveBeenCalled();
    expect(container.querySelector<HTMLInputElement>('[aria-label="Compare-at price for Medium"]')?.value).toBe("650.5");
    expect(container.querySelector<HTMLInputElement>('[aria-label="Buying cost for Medium"]')?.value).toBe("0");
    const attributes = [{ id: "size", name: "Size", values: [{ id: "medium", value: "Medium" }] }];
    await act(async () => root.render(<ProductWizardVariants {...props} attributes={attributes} />));
    await act(async () => root.render(
      <ProductWizardVariants {...props} attributes={attributes} categoryName="T-shirts" />,
    ));
    expect(onRowsChange).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    if (previous === undefined) delete environment.IS_REACT_ACT_ENVIRONMENT;
    else environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
