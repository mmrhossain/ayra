import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import CategoryHero from "./CategoryHero";
it("selects mobile or desktop banner sources without rendering two eager images", () => {
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(
    <CategoryHero parent_category={{ name: "Women", image: "/desktop.webp", mobileImage: "/mobile.webp" }} />,
  ), "text/html");
  expect(doc.querySelectorAll("img")).toHaveLength(1);
  expect(doc.querySelector("source")?.getAttribute("media")).toBe("(min-width: 768px)");
  expect(doc.querySelector("source")?.getAttribute("srcset")).toContain("desktop");
  expect(doc.querySelector("img")?.getAttribute("srcset")).toContain("mobile");
  expect(doc.querySelector("img")?.getAttribute("fetchpriority")).toBe("high");
  expect(doc.body.textContent).toContain("Women");
});
