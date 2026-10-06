"use client";

import { features } from "@/constants/features";

const Features = () => {
  return (
    <div className="container mt-24 mb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-4">
        {features.map((feature, index) => {
          const { id, title, description, icon } = feature;
          const Icon = icon;

          return (
            <div
              key={id}
              className="group relative flex flex-col items-start p-6 transition-all duration-500 hover:bg-slate-50 border"
            >
              {/* 1. Abstract Icon Presentation */}
              <div className="relative mb-8 flex items-center justify-center">
                {/* Decorative "Orbit" circle */}
                <div className="absolute inset-0 w-14 h-14 border border-dashed border-primary/30 rounded-full group-hover:rotate-180 transition-transform duration-1000" />

                <div className="relative  w-14 h-14 flex items-center justify-center bg-white shadow-sm rounded-2xl group-hover:shadow-xl group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:-rotate-12">
                  <Icon strokeWidth={1.2} />
                </div>
              </div>

              {/* 2. Sophisticated Content Stack */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-primary/40 tracking-tighter uppercase italic">
                    0{index + 1}
                  </span>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.25em]">
                    {title}
                  </h3>
                </div>

                <p className="text-xs md:text-[13px] text-slate-500 font-medium leading-[1.8] max-w-[200px] group-hover:text-slate-700 transition-colors">
                  {description}
                </p>
              </div>

              {/* 3. The "Luxury" Detail: Floating Arrow */}
              <div className="mt-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                <div className="w-10 h-[1px] bg-primary relative">
                  <div className="absolute right-0 -top-[3px] w-1.5 h-1.5 border-t border-r border-primary rotate-45" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Features;
