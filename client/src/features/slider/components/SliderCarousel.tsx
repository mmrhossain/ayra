"use client";

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
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

interface HeroSliderProps {
  sliders: SliderListItem[];
  className?: string;
}

const SliderCarousel: React.FC<HeroSliderProps> = ({ sliders, className }) => {
  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    []
  );

  const shouldReduceMotion = useReducedMotion();

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
      className={cn(
        "relative w-full overflow-hidden h-[60svh] min-h-[350px] sm:h-[calc(100dvh-var(--header-height,120px))] sm:min-h-[500px] ",
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
        className="w-full"
      >
        <CarouselContent className="ml-0 flex">
          {sliders.map((slider, index) => {
            const isActive = activeIndex === index;

            return (
              <CarouselItem key={slider.id || index} className="relative min-w-full pl-0">
                {/* Hero Container */}
                <div className="relative">
                  {/* Mobile Image */}
                  <Image
                    src={slider.mobileImageUrl || "/fallbacks/hero-mobile.webp"}
                    alt={slider.title || "Hero Banner"}
                    priority={index === 0}
                    loading={"eager"}
                    width={960}
                    height={1200}
                    className="object-cover md:hidden"
                  />

                  {/* Desktop Image */}
                  <Image
                    src={slider.imageUrl || "/fallbacks/hero-desktop.webp"}
                    alt={slider.title || "Hero Banner"}
                    priority={index === 0}
                    loading={"eager"}
                    width={1920}
                    height={1080}
                    className="w-[100%] h-auto object-cover hidden md:block"
                  />
                </div>

                {/* Content */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  <div className="mx-auto flex h-full max-w-7xl items-end px-4 pb-12 sm:px-12 sm:pb-16 lg:px-20 lg:pb-20">
                    <div className="max-w-xl text-left text-white">
                      {isActive && (
                        <>
                          <motion.h2
                            key={`title-${index}`}
                            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.6,
                              delay: 0.25,
                            }}
                            className="
                              mb-3
                              break-words
                              font-serif
                              text-xl
                              font-medium
                              tracking-wide
                              sm:mb-6
                              sm:text-5xl
                              lg:text-6xl
                            "
                          >
                            {slider.title || "Timeless Ethnic Elegance"}
                          </motion.h2>

                          <motion.div
                            key={`cta-${index}`}
                            initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.5,
                              delay: 0.4,
                            }}
                            className="pointer-events-auto flex items-center gap-4"
                          >
                            <CustomButton
                              ctaText="Explore Collection"
                              icon={
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                              }
                              path={slider.redirectUrl || "/shop"}
                              className={cn(
                                "group flex items-center gap-2",
                                "border border-white/80",
                                "bg-white/10",
                                "px-5 py-2.5 sm:px-7 sm:py-3.5",
                                "text-xs font-medium uppercase tracking-[0.2em]",
                                "text-white backdrop-blur-md",
                                "transition-all duration-300",
                                "hover:border-white",
                                "hover:bg-white",
                                "hover:text-neutral-950"
                              )}
                            />
                          </motion.div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 sm:bottom-10">
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
        </div>
      </Carousel>
    </section>
  );
};

export default SliderCarousel;
