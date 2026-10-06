"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, Minus, Search, HelpCircle } from "lucide-react";

import { RichTextContent } from "@/components/shared/rich-text-content";
import type { PublicFaqCategory } from "@/features/content/api";

type FaqRow = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

type Props = {
  categories: PublicFaqCategory[];
};

const FAQPage = ({ categories }: Props) => {
  const shouldReduceMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categoryNames = useMemo(
    () => ["All", ...categories.map((category) => category.name)],
    [categories]
  );

  const faqs = useMemo<FaqRow[]>(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          id: item.id,
          category: category.name,
          question: item.question,
          answer: item.answer,
        }))
      ),
    [categories]
  );

  const filteredFaqs = faqs.filter((faq) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q);
    const matchesCategory =
      activeCategory === "All" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-20 md:pb-24">
      <section className="pt-20 md:pt-28 pb-12 md:pb-16 bg-white border-b border-slate-100 px-4 sm:px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-black tracking-tight sm:tracking-tighter uppercase mb-6">
              How can we <span className="text-primary italic font-serif text-4xl md:text-8xl block md:inline">Help?</span>
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto font-medium text-sm md:text-base">
              Find answers to common questions about our heritage, our craft, and your journey with the House of Color.
            </p>
          </motion.div>

          <div className="mt-8 md:mt-12 max-w-2xl mx-auto relative">
            <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for a topic"
              className="w-full pl-12 md:pl-14 pr-4 md:pr-6 h-12 md:h-14 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm text-sm md:text-base"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10 md:mb-16">
          {categoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 sm:px-6 md:px-8 h-10 md:h-11 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.08em] md:tracking-widest transition-all ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-lg shadow-teal-600/20"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredFaqs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} />
            ))}
          </AnimatePresence>

          {filteredFaqs.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 md:py-20">
              <HelpCircle className="mx-auto w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No results found for your search.</p>
            </motion.div>
          )}
        </div>
      </section>

      <section className="container mt-8 md:mt-12">
        <div className="bg-slate-900 rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-12 text-center text-white relative overflow-hidden">
          <div className="relative">
            <h3 className="text-2xl md:text-3xl font-black mb-3 md:mb-4">Still have questions?</h3>
            <p className="text-slate-400 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
              If you could not find what you were looking for, our team is ready to assist you personally.
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              <a
                href="/contact"
                className="bg-primary hover:bg-primary/80 text-white px-6 md:px-10 h-11 md:h-12 rounded-full font-black uppercase text-[10px] tracking-[0.08em] md:tracking-widest transition-all inline-flex items-center"
              >
                Contact Support
              </a>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        </div>
      </section>
    </div>
  );
};

const FAQItem = ({ faq }: { faq: { question: string; answer: string } }) => {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
      className={`border transition-all duration-300 ${isOpen ? "bg-white border-primary shadow-xl rounded-[1.25rem] md:rounded-[2rem]" : "bg-transparent border-slate-200 rounded-[1rem] md:rounded-[1.5rem]"}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 md:px-8 py-4 md:py-6 min-h-11 flex items-center justify-between text-left"
      >
        <span className={`text-base md:text-lg font-bold tracking-tight ${isOpen ? "text-teal-900" : "text-slate-800"}`}>
          {faq.question}
        </span>
        <div className={`flex-shrink-0 ml-3 md:ml-4 p-2 rounded-full transition-colors ${isOpen ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400"}`}>
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldReduceMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-8 pb-5 md:pb-8 text-slate-500 leading-relaxed font-medium text-sm md:text-base border-t border-slate-50 pt-4">
              <RichTextContent html={faq.answer} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FAQPage;
