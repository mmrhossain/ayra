import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SliderCarousel from "./SliderCarousel";
import type { SliderListItem } from "@/features/dashboard/admin/sliders/api/slider";

const sliders = [1, 2, 3].map(index => ({
  id: String(index), title: "Banner " + index,
  imageUrl: "/desktop-" + index + ".jpg",
  mobileImageUrl: "/mobile-" + index + ".jpg",
  redirectUrl: "/shop",
})) as SliderListItem[];

describe("hero image loading", () => {
  it("renders one responsive image per slide and only prioritizes the first", () => {
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<SliderCarousel sliders={sliders} />), "text/html",
    );
    const images = [...doc.querySelectorAll("picture img")];
    expect(images).toHaveLength(3);
    expect(images.map(image => image.getAttribute("loading"))).toEqual(["eager", "lazy", "lazy"]);
    expect(images.map(image => image.getAttribute("fetchPriority"))).toEqual(["high", "auto", "auto"]);
    expect(doc.querySelector("picture source")?.getAttribute("media")).toBe("(min-width: 768px) and (orientation: landscape)");
    expect(doc.querySelector("picture source")?.getAttribute("srcset")).toContain("desktop-1");
    expect(images[0].getAttribute("srcset")).toContain("mobile-1");
  });

  it("keeps dashboard banners free of text and controls", () => {
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<SliderCarousel sliders={sliders} variant="banner" showContent={false} showControls={false} />), "text/html",
    );
    expect(doc.querySelectorAll("img")).toHaveLength(3);
    expect(doc.querySelector("h2")).toBeNull();
    expect(doc.querySelector('button[aria-label^="Go to slide"]')).toBeNull();
    expect(doc.querySelector("img")?.getAttribute("loading")).toBe("eager");
  });
});
