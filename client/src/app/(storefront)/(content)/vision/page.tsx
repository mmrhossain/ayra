"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, Target, Globe, Heart, ArrowDownRight } from "lucide-react";

const VisionPage = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="bg-bg-primary text-[#1A1A1A] selection:bg-teal-100 selection:text-teal-900 container">
      <section className="pt-16 sm:pt-24 md:pt-32 pb-12 md:pb-20 px-4 sm:px-6">
        <div className="container mx-auto">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 pb-8 md:pb-12"
          >
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight sm:tracking-tighter leading-[0.9] uppercase">
                Our <br />
                <span className="text-primary italic font-serif">Vision.</span>
              </h1>
            </div>
            <div className="max-w-xs">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-slate-400 leading-relaxed">
                Defining the future of heritage through the lens of color and community.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 sm:px-6">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <div className="lg:col-span-4">
            <span className="text-primary font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <Target size={14} /> The North Star
            </span>
          </div>
          <div className="lg:col-span-8">
            <motion.h2
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
              className="text-2xl sm:text-3xl md:text-5xl font-medium leading-[1.24] tracking-tight"
            >
              To redefine the global lifestyle by taking local craftsmanship beyond national borders,
              proving that <span className="bg-teal-50 px-2 py-1 italic font-serif text-teal-700">culture is not a relic</span>,
              but a living, breathing tool for social change.
            </motion.h2>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-slate-100">
          {[
            {
              title: "Identity",
              desc: "Every product is an expression of personality. We aim to help people rediscover their roots in an increasingly detached world.",
              icon: <Eye className="mb-5 md:mb-6 text-primary" />
            },
            {
              title: "Inclusion",
              desc: "Challenging class discrimination by empowering rural women and indigenous communities as the true architects of culture.",
              icon: <Heart className="mb-5 md:mb-6 text-primary" />
            },
            {
              title: "Impact",
              desc: "To scale local talent to a global stage, ensuring economic freedom and the preservation of sylvan craftsmanship.",
              icon: <Globe className="mb-5 md:mb-6 text-primary" />
            }
          ].map((pillar, i) => (
            <div key={i} className="p-6 md:p-8 border-r border-b border-slate-100 hover:bg-[#FDFDFD] transition-colors group">
              {pillar.icon}
              <h3 className="text-xl md:text-2xl font-black uppercase mb-3 md:mb-4 group-hover:text-primary transition-colors">
                {pillar.title}
              </h3>
              <p className="text-slate-500 leading-relaxed font-medium text-sm md:text-base">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 md:py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
              className="space-y-8 md:space-y-10"
            >
              <h3 className="text-primary font-black tracking-[0.2em] sm:tracking-[0.4em] uppercase text-xs">The Philosophy</h3>
              <p className="text-2xl sm:text-3xl md:text-6xl font-light leading-tight italic font-serif">
                &ldquo;We don&apos;t just draw; we use the needle as a pen and the thread as ink to write the story of our people.&rdquo;
              </p>
              <div className="flex flex-col items-center">
                <div className="w-12 h-[1px] bg-primary mb-4" />
                <span className="uppercase tracking-widest font-black text-sm">Kamrunnahar Munni</span>
                <span className="text-primary text-[10px] uppercase tracking-widest mt-1">Founder, Raangalay</span>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      </section>

      <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight md:tracking-tighter mb-6 md:mb-8 flex items-center gap-3 md:gap-4">
              2025 & Beyond <ArrowDownRight className="text-primary" />
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-6 md:mb-10 font-medium">
              Our journey from the foothills of Durgapur to the fashion capitals of the world is just beginning.
              We are building a future where sustainable heritage is the global standard.
            </p>
          </div>
          <div className="space-y-6">
            {[
              { label: "Community", value: "Expanding to 500+ indigenous artisans." },
              { label: "Design", value: "Integrating 100% biodegradable tech with handlooms." },
              { label: "Market", value: "Establishing Raangalay hubs in Europe and America." }
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-3 justify-between border-b border-slate-200 pb-4">
                <span className="text-primary font-black uppercase tracking-widest text-xs">{stat.label}</span>
                <span className="text-slate-900 font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 px-4 sm:px-6 text-center border-t border-slate-100">
        <motion.div whileHover={shouldReduceMotion ? { scale: 1 } : { scale: 1.02 }} className="inline-block">
          <button className="bg-slate-900 text-white px-8 md:px-16 h-12 md:h-16 rounded-full font-black uppercase tracking-[0.15em] md:tracking-[0.3em] text-[10px] md:text-xs hover:bg-primary transition-all shadow-2xl">
            Support the Vision
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default VisionPage;
