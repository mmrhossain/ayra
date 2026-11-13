import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImageUpload } from "./image-upload";

const mocks = vi.hoisted(() => ({
  listMediaLibrary: vi.fn(),
  uploadImage: vi.fn(),
  uploadImages: vi.fn(),
}));

vi.mock("@/lib/api/dashboard/upload", () => ({
  listMediaLibrary: mocks.listMediaLibrary,
  resolveImageType: () => "product",
  toUploadErrorMessage: () => "Upload failed",
  uploadImage: mocks.uploadImage,
  uploadImages: mocks.uploadImages,
}));

vi.mock("next/image", async () => {
  const React = await import("react");
  return {
    default: ({
      fill: _fill,
      priority: _priority,
      ...props
    }: React.ComponentProps<"img"> & {
      fill?: boolean;
      priority?: boolean;
    }) => {
      void _fill;
      void _priority;
      return React.createElement("img", props);
    },
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const mediaItems = ["4", "2", "3", "1"].map((id) => ({
  publicId: id,
  url: `https://example.com/${id}.jpg`,
  secure_url: `https://example.com/${id}.jpg`,
  variants: [],
  type: "product" as const,
  status: "ATTACHED" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
}));

describe("ImageUpload media selection order", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;
  const onChange = vi.fn();

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    onChange.mockReset();
    mocks.listMediaLibrary.mockReset();
    mocks.listMediaLibrary.mockResolvedValue({
      items: mediaItems,
      pagination: { page: 1, limit: 24, total: 4, totalPages: 1 },
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    queryClient.clear();
    container.remove();
  });

  it("keeps the click order when selecting multiple library images", async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ImageUpload
            mode="multiple"
            folder="products"
            maxFiles={5}
            value={[]}
            onChange={onChange}
          />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>("button")
        ?.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const imageButtons = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="Select library image"]',
      ),
    );
    expect(imageButtons).toHaveLength(4);

    await act(async () => {
      for (const index of [2, 0, 3, 1]) {
        imageButtons[index]?.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      }
    });

    const confirmButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("Use selected"));

    await act(async () => {
      confirmButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    expect(onChange).toHaveBeenCalledWith([
      "https://example.com/3.jpg",
      "https://example.com/4.jpg",
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
    ]);
  });
});
