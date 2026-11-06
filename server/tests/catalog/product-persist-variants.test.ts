import { beforeEach, describe, expect, it, vi } from "vitest";

const createVariantInventories = vi.fn();
const ensureDefaultVariant = vi.fn();

vi.mock(
  "../../src/modules/catalog/product/services/product-inventory.service.ts",
  () => ({
    createVariantInventories: (...args: unknown[]) =>
      createVariantInventories(...args),
  })
);

vi.mock(
  "../../src/modules/catalog/product/services/product-variant.service.ts",
  () => ({
    ensureDefaultVariant: (...args: unknown[]) => ensureDefaultVariant(...args),
    assertAttributeValuesBelongToAttributes: vi.fn(),
  })
);

const { persistGeneratedVariants } = await import(
  "../../src/modules/catalog/product/services/product-generator.service.ts"
);

const makeTx = () => ({
  productVariant: {
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  attributeValue: { findMany: vi.fn().mockResolvedValue([]) },
  variantAttribute: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
});

const variants = [
  {
    sku: "AYRA-SHIRT-RED-S",
    price: 500,
    isDefault: true,
    attributeValueIds: ["av1"],
  },
  {
    sku: "AYRA-SHIRT-RED-M",
    price: 500,
    isDefault: false,
    attributeValueIds: ["av2"],
  },
];

describe("persistGeneratedVariants", () => {
  beforeEach(() => {
    createVariantInventories.mockReset();
    ensureDefaultVariant.mockReset();
    createVariantInventories.mockResolvedValue(undefined);
    ensureDefaultVariant.mockResolvedValue(undefined);
  });

  it("inserts every variant with one createMany and maps attributes by sku", async () => {
    const tx = makeTx();
    tx.productVariant.findMany.mockResolvedValue([
      { id: "v1", sku: "AYRA-SHIRT-RED-S" },
      { id: "v2", sku: "AYRA-SHIRT-RED-M" },
    ]);
    tx.attributeValue.findMany.mockResolvedValue([{ id: "av1" }, { id: "av2" }]);

    await persistGeneratedVariants(tx as never, "p1", variants, [{ id: "w1" }]);

    expect(tx.productVariant.createMany).toHaveBeenCalledTimes(1);
    expect(tx.productVariant.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ sku: "AYRA-SHIRT-RED-S", productId: "p1" }),
        expect.objectContaining({ sku: "AYRA-SHIRT-RED-M", productId: "p1" }),
      ],
      skipDuplicates: true,
    });
    expect(tx.productVariant.create).not.toHaveBeenCalled();
    expect(tx.variantAttribute.createMany).toHaveBeenCalledWith({
      data: [
        { variantId: "v1", attributeValueId: "av1" },
        { variantId: "v2", attributeValueId: "av2" },
      ],
    });
    expect(createVariantInventories).toHaveBeenCalledWith(
      tx,
      ["v1", "v2"],
      [{ id: "w1" }]
    );
    expect(ensureDefaultVariant).toHaveBeenCalledWith(tx, "p1", "v1");
  });

  it("retries only the rows skipped by skipDuplicates", async () => {
    const tx = makeTx();
    tx.productVariant.findMany.mockResolvedValue([
      { id: "v1", sku: "AYRA-SHIRT-RED-S" },
    ]);
    tx.productVariant.create.mockResolvedValue({
      id: "v2",
      sku: "AYRA-SHIRT-RED-M",
    });
    tx.attributeValue.findMany.mockResolvedValue([{ id: "av1" }, { id: "av2" }]);

    await persistGeneratedVariants(
      tx as never,
      "p1",
      variants.map((variant) => ({ ...variant, skuGenerated: true })),
      []
    );

    expect(tx.productVariant.create).toHaveBeenCalledTimes(1);
    expect(tx.productVariant.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sku: "AYRA-SHIRT-RED-M",
        productId: "p1",
      }),
    });
    expect(tx.variantAttribute.createMany).toHaveBeenCalledWith({
      data: [
        { variantId: "v1", attributeValueId: "av1" },
        { variantId: "v2", attributeValueId: "av2" },
      ],
    });
    expect(createVariantInventories).toHaveBeenCalledWith(
      tx,
      ["v1", "v2"],
      []
    );
  });

  it("does nothing when there are no variants", async () => {
    const tx = makeTx();

    await persistGeneratedVariants(tx as never, "p1", [], []);

    expect(tx.productVariant.createMany).not.toHaveBeenCalled();
    expect(createVariantInventories).not.toHaveBeenCalled();
  });
});
