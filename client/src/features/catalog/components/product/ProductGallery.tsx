"use client";

import StoreImage from "@/components/shared/store-image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { productDetailsLayout } from "@/features/catalog/components/product/product-details-layout";
import type { GalleryImage } from "@/features/catalog/types";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

export type { GalleryImage };

const LENS_SIZE = 144;
const MAGNIFICATION = 2.5;

type MagnifierState = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

function resolveSrc(image: GalleryImage): string {
  const url = image.imageUrl?.trim() || "";

  if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"))) {
    return url;
  }

  return "https://placehold.jp/800x800.png";
}

const ProductGallery: React.FC<{ images: GalleryImage[] }> = ({ images }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [magnifier, setMagnifier] = useState<MagnifierState | null>(null);

  const list = images.length > 0 ? images : [{ imageUrl: "https://placehold.jp/800x800.png" }];

  const onThumbClick = (index: number) => {
    if (!api) return;

    setMagnifier(null);
    api.scrollTo(index);
    setSelectedIndex(index);
  };

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setMagnifier(null);
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="w-full min-w-0">
      <div className={productDetailsLayout.gallery}>
        <div
          className={cn(
            productDetailsLayout.thumbnailRail,
            "scrollbar-hide overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto"
          )}
        >
          {list.map((image, index) => (
            <button
              key={`thumb-${image.id ?? index}`}
              type="button"
              onClick={() => onThumbClick(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={selectedIndex === index}
              className={cn(
                "relative aspect-square w-16 shrink-0 cursor-pointer overflow-hidden rounded-md bg-gray-50 outline-none after:pointer-events-none after:absolute after:inset-0 after:rounded-md after:ring-inset after:transition-shadow focus-visible:after:ring-2 focus-visible:after:ring-primary lg:w-full dark:bg-zinc-900",
                selectedIndex === index
                  ? "after:ring-2 after:ring-primary"
                  : "after:ring-1 after:ring-border hover:after:ring-2 hover:after:ring-primary"
              )}
            >
              <StoreImage
                src={resolveSrc(image)}
                alt={image.altText || "thumbnail"}
                fill
                sizes="80px"
                loading={index === 0 ? "eager" : "lazy"}
                className="object-contain"
              />
            </button>
          ))}
        </div>

        {/* মেইন কারূসল ইমেজ */}
        <div className="relative min-w-0 flex-1">
          <Carousel
            setApi={setApi}
            className="w-full aspect-square"
            opts={{ align: "start", loop: true }}
          >
            <CarouselContent>
              {list.map((image, index) => (
                <CarouselItem key={image.id ?? index}>
                  <div
                    onPointerMove={(event) => {
                      if (event.pointerType === "touch" || event.buttons !== 0) {
                        return;
                      }

                      const rect = event.currentTarget.getBoundingClientRect();

                      setMagnifier({
                        index,
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top,
                        width: rect.width,
                        height: rect.height,
                      });
                    }}
                    onPointerLeave={() => setMagnifier(null)}
                    onPointerDown={() => setMagnifier(null)}
                    onPointerCancel={() => setMagnifier(null)}
                    className={cn(
                      productDetailsLayout.galleryImage,
                      "relative mx-auto overflow-hidden bg-gray-50 shadow-sm dark:bg-zinc-900"
                    )}
                  >
                    <StoreImage
                      src={resolveSrc(image)}
                      alt={image.altText || `Product image ${index + 1}`}
                      fill
                      sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) 50vw, (max-width: 1279px) 40vw, 480px"
                      className="object-contain"
                      priority={index === 0}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      loading={index === 0 ? "eager" : "lazy"}
                    />

                    {magnifier?.index === index && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute z-10 overflow-hidden rounded-full border-2 border-white bg-gray-50 shadow-xl ring-1 ring-black/20 dark:bg-zinc-900"
                        style={{
                          width: LENS_SIZE,
                          height: LENS_SIZE,
                          left: magnifier.x - LENS_SIZE / 2,
                          top: magnifier.y - LENS_SIZE / 2,
                        }}
                      >
                        <div
                          className="absolute"
                          style={{
                            width: magnifier.width * MAGNIFICATION,
                            height: magnifier.height * MAGNIFICATION,
                            left: LENS_SIZE / 2 - magnifier.x * MAGNIFICATION,
                            top: LENS_SIZE / 2 - magnifier.y * MAGNIFICATION,
                          }}
                        >
                          <StoreImage
                            src={resolveSrc(image)}
                            alt=""
                            fill
                            sizes="1600px"
                            className="object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;
