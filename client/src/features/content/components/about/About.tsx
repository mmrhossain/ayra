"use client";

import React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Theater, Leaf, Compass, ArrowRight, Quote, Sparkles } from "lucide-react";
import Link from "next/link";

const About = () => {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, shouldReduceMotion ? 1 : 1.15]);

  return (
    <div className="bg-[#fdfdfc] text-slate-900 selection:bg-teal-100 container">
      <section className="relative py-20 sm:py-24 md:py-32 lg:py-36 flex items-center justify-center overflow-hidden">
        <motion.div style={{ scale }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fdfdfc]" />
          <div className="w-full h-full bg-[url('/hero-craft.jpg')] bg-cover bg-center opacity-20" />
        </motion.div>

        <div className="container mx-auto relative z-10">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <span className="text-primary font-bold uppercase tracking-[0.2em] sm:tracking-[0.5em] text-[10px] sm:text-xs mb-6 sm:mb-8 block">
              Established 2009 - Netrokona, Bangladesh
            </span>
            <h1 className="text-[14vw] sm:text-[12vw] lg:text-[10vw] font-black leading-[0.86] tracking-tight sm:tracking-tighter uppercase italic drop-shadow-sm">
              Raan<span className="text-primary italic font-serif">galay</span>
            </h1>
            <div className="mt-8 sm:mt-12 max-w-lg mx-auto border-t border-slate-200 pt-6 sm:pt-8">
              <p className="text-slate-500 font-medium leading-relaxed tracking-[0.05em] uppercase text-[10px] md:text-xs">
                A personality-driven lifestyle brand. An identity rooted in heritage, celebrating the universal language of color.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2">
          <div className="w-[1px] h-14 sm:h-20 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </section>

      <section className="py-16 md:py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 lg:gap-24 items-center">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
            viewport={{ once: true }}
            className="lg:col-span-5 order-2 lg:order-1"
          >
            <div className="space-y-6 md:space-y-8">
              <Theater className="text-primary w-10 h-10 md:w-12 md:h-12 stroke-[1px]" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight sm:tracking-tighter leading-none">
                Born in <span className="text-primary italic">Theater.</span> <br />
                Raised in <span className="italic">Nature.</span>
              </h2>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed md:leading-loose font-medium">
                Founder <strong>Kamrunnahar Munni</strong> reimagined the concept of &ldquo;House of Color&rdquo; through a theatrical lens.
                Based at the foot of the <strong>Garo Hills</strong>, Raangalay bridges the gap between urban sophistication and the raw, sylvan beauty of Durgapur.
              </p>
              <div className="pt-2 md:pt-6">
                <Link href="/vision" className="group inline-flex items-center gap-3 text-[11px] md:text-xs font-black uppercase tracking-[0.12em] md:tracking-widest text-primary">
                  Read our full manifesto <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform motion-reduce:transform-none" />
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="relative aspect-[16/10] bg-bg-primary rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-teal-900/10 group-hover:bg-transparent transition-colors duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-primary text-4xl sm:text-5xl lg:text-9xl font-black opacity-20 pointer-events-none">HERITAGE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16 md:py-24 lg:py-32 text-white overflow-hidden relative rounded-[2rem] sm:rounded-[4rem]">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative">
            <Quote className="text-primary w-12 h-12 md:w-16 md:h-16 mb-6 md:mb-8 opacity-50" />
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-none mb-6 md:mb-10">
              The Pride of <br /> <span className="text-primary italic">Jongla.</span>
            </h2>
              <p className="text-slate-400 text-base sm:text-lg md:text-xl leading-relaxed italic mb-6 md:mb-8">
                &ldquo;While a fragile urban society mocks the remote as &apos;Jongli&apos;, we reclaim the word. It is a signature of the forest&apos;s irrepressible brightness and true civilization.&rdquo;
              </p>
            <div className="flex gap-8 sm:gap-12 pt-6 md:pt-8 border-t border-white/10">
              <div>
                <span className="block text-3xl md:text-4xl font-black text-primary">60+</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Local Artisans</span>
              </div>
              <div>
                <span className="block text-3xl md:text-4xl font-black text-primary">100%</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Handcrafted</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <motion.div
              whileInView={shouldReduceMotion ? { rotate: 0 } : { rotate: 360 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 50, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-[1px] border-white/10 rounded-full scale-150"
            />
            <div className="aspect-square bg-white/5 rounded-full flex items-center justify-center backdrop-blur-3xl border border-white/10">
              <span className="text-primary font-black tracking-[0.35em] sm:tracking-[1em] uppercase -rotate-90 text-xs sm:text-base">Signature Motif</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 lg:py-32">
        <div className="text-center mb-12 md:mb-24">
          <h2 className="text-xs font-black uppercase tracking-[0.28em] sm:tracking-[0.6em] text-primary mb-4">The Ethical Lens</h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight sm:tracking-tighter">Beyond the Stitch.</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
          {[
            {
              icon: <Leaf />,
              title: "Sylvan Sourced",
              desc: "Using handwoven cloth, organic fibers, bamboo, wood, and clay. No ready-made components."
            },
            {
              icon: <Compass />,
              title: "Natural Education",
              desc: "Design born from a dialogue with rural women, honoring traditional knowledge over urban trends."
            },
            {
              icon: <Sparkles />,
              title: "Color Power",
              desc: "Colors inspired by pre-colonial Jatra, Sang, and Punthi art. Redefining cultural aesthetics."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={shouldReduceMotion ? { y: 0 } : { y: -12 }}
              className="p-6 sm:p-8 md:p-12 bg-[#F9F9F7] rounded-[2rem] sm:rounded-[3rem] border border-slate-100 transition-all hover:shadow-2xl hover:bg-white text-center"
            >
              <div className="flex justify-center mb-6 md:mb-8 text-primary">{item.icon}</div>
              <h4 className="text-xl md:text-2xl font-black mb-4">{item.title}</h4>
              <p className="text-slate-500 leading-relaxed font-medium text-sm sm:text-base">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16 md:py-24 lg:py-32">
        <div className="bg-primary rounded-[2rem] sm:rounded-[4rem] p-6 sm:p-8 md:p-20 lg:p-32 text-center text-white relative overflow-hidden">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
            className="relative"
          >
            <h2 className="text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-black tracking-tight sm:tracking-tighter uppercase leading-none mb-8 md:mb-10">
              A Cultural <br /> <span className="italic font-serif opacity-80 underline decoration-white/30 underline-offset-8">Movement.</span>
            </h2>
            <p className="text-teal-50 text-base md:text-xl lg:text-2xl max-w-2xl mx-auto mb-10 md:mb-12 font-medium leading-relaxed opacity-90">
              Buying is not a transaction; it&apos;s a celebration of heritage. Redefining global lifestyle through the red and green flag.
            </p>
            <Link href="/shop" className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 sm:px-8 md:px-12 h-12 md:h-14 rounded-full font-black uppercase text-[10px] md:text-xs tracking-[0.08em] md:tracking-[0.1em] hover:bg-white hover:text-teal-600 transition-all shadow-2xl">
              Enter the House of Color <ArrowRight size={18} />
            </Link>
          </motion.div>

          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
        </div>
      </section>
    </div>
  );
};

export default About;
