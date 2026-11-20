"use client";

import { heroFrameClass } from "./hero-layout";
import CustomButton from "@/components/shared/CustomButton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
  } from "@/components/ui/carousel";
import type { SliderListItem } from "@/features/dashboard/admin/sliders/api/slider";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight } from "lucide-react";
import Image,
  { getImageProps } from "next/image";
import React,
  { useEffect,
  useState,
} from "react";

interface HeroSliderProps {
  sliders: SliderListItem[];
  className?: string;
  showContent?: boolean;
  showControls?: boolean;
  variant?: "hero" | "banner";
}

const SliderCarousel: React.FC<HeroSliderProps> = ({ sliders, className, showContent = true, showControls = true, variant = "hero" }) => {
  const isBanner = variant === "banner";
  const [autoplay] = useState(() => Autoplay({
    delay: 5000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  }));

  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    onSelect();

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (!sliders?.length) return null;

  return (
    <section
      id={isBanner ? undefined : "hero"}
      aria-label={isBanner ? "Customer dashboard banners" : undefined}
      className={cn(
        "@container relative w-full overflow-hidden",
        isBanner ? "aspect-[16/5] sm:aspect-[1920/480]" : heroFrameClass,
        className
      )}
    >
      <Carousel
        plugins={[autoplay]}
        opts={{
          loop: true,
          align: "start",
        }}
        setApi={setApi}
        className={cn("w-full", isBanner ? "h-full [&>div]:h-full" : "md:landscape:h-full md:landscape:[&>div]:h-full")}
      >
        <CarouselContent className={cn("ml-0 flex items-start", isBanner ? "h-full" : "md:landscape:h-full")}>
          {sliders.map((slider, index) => {
            const isActive = activeIndex === index;
            const eagerImage = index === 0 || isActive;
            const mobileImage = getImageProps({
              src: slider.mobileImageUrl || slider.imageUrl || "",
              alt: slider.title || "Hero Banner",
              width: 1080, height: 1350, sizes: "100vw",
              loading: eagerImage ? "eager" : "lazy",
              fetchPriority: eagerImage ? "high" : "auto",
            }).props;
            const desktopImage = getImageProps({
              src: slider.imageUrl || "", alt: slider.title || "Hero Banner",
              width: 1920, height: 720, sizes: "100vw",
            }).props;

            return (
              <CarouselItem
                key={slider.id || index}
                className={cn("relative min-w-full pl-0 basis-full", isBanner ? "h-full" : "md:landscape:h-full")}
              >
                {/* Hero Container */}
                <div className={cn("relative w-full", isBanner ? "h-full" : "md:landscape:h-full")}>
                  {isBanner ? (
                    <Image
                      src={slider.imageUrl || ""}
                      alt={slider.title || "Hero Banner"}
                      loading={eagerImage ? "eager" : "lazy"}
                      fetchPriority={eagerImage ? "high" : "auto"}
                      width={1920} height={720} sizes="100vw"
                      className="block h-full w-full object-cover object-top"
                    />
                  ) : (
                    <picture className="block md:landscape:h-full">
                      <source
                        media="(min-width: 768px) and (orientation: landscape)"
                        srcSet={desktopImage.srcSet} sizes={desktopImage.sizes}
                      />
                      {/* getImageProps supplies Next.js optimized responsive sources. */}
                      <img
                        {...mobileImage}
                        alt={mobileImage.alt}
                        className="block aspect-[4/5] h-auto w-full object-cover object-top md:landscape:aspect-auto md:landscape:h-full"
                      />
                    </picture>
                  )}
                </div>

                {/* Content Overlay */}
                {showContent && <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-black/30 via-black/5 to-transparent">
                  <div className="container flex h-full min-w-0 items-end py-[clamp(1rem,4cqw,4rem)] md:items-center">
                    <div className="min-w-0 w-full max-w-lg text-left text-white md:w-[44%] md:max-w-lg md:translate-y-[clamp(2.5rem,9svh,5rem)]">
                      {isActive && (
                        <>
                          <h2
                            key={`title-${index}`}
                            className="hero-title-enter
                              mb-[clamp(0.75rem,1.5cqw,1.5rem)]
                              max-w-[16ch]
                              whitespace-normal
                              text-balance
                              [overflow-wrap:anywhere]
                              font-serif
                              text-[clamp(1.5rem,6cqw,2.75rem)]
                              leading-[1.12]
                              font-medium
                              tracking-normal
                              md:text-[clamp(1.5rem,3cqw,3.5rem)]
                            "
                          >
                            {slider.title || "Timeless Ethnic Elegance"}
                          </h2>

                          <div
                            key={`cta-${index}`}
                            className="hero-cta-enter pointer-events-auto flex min-w-0 items-center"
                          >
                            <CustomButton
                              ctaText="Explore Collection"
                              icon={
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                              }
                              path={slider.redirectUrl || "/shop"}
                              className={cn(
                                "group flex h-auto min-h-11 max-w-full items-center gap-2 whitespace-normal text-center",
                                "border border-white/80",
                                "bg-white/10",
                                "px-[clamp(0.875rem,1.5cqw,1.75rem)] py-2.5",
                                "text-[clamp(0.625rem,1cqw,0.875rem)] font-medium uppercase tracking-[0.12em]",
                                "text-white backdrop-blur-md",
                                "transition-all duration-300",
                                "hover:border-white",
                                "hover:bg-white",
                                "hover:text-neutral-950"
                              )}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>}
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {/* Indicators: anchored to the hero section, desktop only */}
      {showControls && <div className={cn("pointer-events-auto absolute left-1/2 z-30 hidden -translate-x-1/2 items-center gap-2 md:flex", isBanner ? "bottom-3 sm:bottom-4" : "bottom-[clamp(0.75rem,2cqw,2.5rem)]")}>
        {sliders.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-[2px] transition-all duration-500",
              activeIndex === i ? "w-8 bg-amber-200" : "w-4 bg-white/40 hover:bg-white/70"
            )}
          />
        ))}
      </div>}
    </section>
  );
};

export default SliderCarousel;
