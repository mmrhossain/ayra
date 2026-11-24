"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CircleHelp, Mail, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";

import { RichTextContent } from "@/components/shared/rich-text-content";
import { Input } from "@/components/ui/input";
import { SUPPORT_EMAIL } from "@/config/site";
import type { PublicFaqCategory } from "@/features/content/api";

type FaqRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  question: string;
  answer: string;
};

type Props = {
  categories: PublicFaqCategory[];
};

const FAQPage = ({ categories }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const faqs = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          id: item.id,
          categoryId: category.id,
          categoryName: category.name,
          question: item.question,
          answer: item.answer,
        })),
      ),
    [categories],
  );

  const filteredFaqs = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.categoryId === activeCategory;
      const matchesSearch =
        !query ||
        faq.question.toLocaleLowerCase().includes(query) ||
        faq.answer.toLocaleLowerCase().includes(query) ||
        faq.categoryName.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, faqs, searchTerm]);

  return (
    <main className="min-h-[60vh] bg-muted/30 pb-16 sm:pb-20">
      <section className="border-b bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-9 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Help Center</span>
          </nav>

          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CircleHelp className="size-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Customer care</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              How can we help?
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Find quick answers about shopping, orders, delivery, returns, and your account.
            </p>

            <div className="relative mx-auto mt-7 max-w-2xl text-left sm:mt-9">
              <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search questions, orders, delivery..."
                aria-label="Search frequently asked questions"
                className="h-12 rounded-xl border-border bg-background pl-11 pr-11 text-sm shadow-sm placeholder:text-xs focus-visible:ring-1"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside aria-label="FAQ categories" className="min-w-0">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Browse by topic</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                aria-pressed={activeCategory === "all"}
                className={`flex shrink-0 items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${
                  activeCategory === "all"
                    ? "border-primary/30 bg-primary/5 font-medium text-primary"
                    : "border-transparent bg-background text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2.5"><ShoppingBag className="size-4" /> All questions</span>
                <span className="text-xs tabular-nums">{faqs.length}</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  aria-pressed={activeCategory === category.id}
                  className={`flex shrink-0 items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${
                    activeCategory === category.id
                      ? "border-primary/30 bg-primary/5 font-medium text-primary"
                      : "border-transparent bg-background text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5"><CircleHelp className="size-4" /> {category.name}</span>
                  <span className="text-xs tabular-nums">{category.items.length}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 hidden rounded-xl border bg-background p-4 lg:block">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Mail className="size-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">Still need help?</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Our support team is happy to help with your order.</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                Email support <ArrowRight className="size-3.5" />
              </a>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex min-h-8 items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                {activeCategory === "all"
                  ? "Frequently asked questions"
                  : categories.find((category) => category.id === activeCategory)?.name ?? "Frequently asked questions"}
              </h2>
              <span className="shrink-0 text-xs text-muted-foreground">
                {filteredFaqs.length} {filteredFaqs.length === 1 ? "answer" : "answers"}
              </span>
            </div>

            {filteredFaqs.length ? (
              <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
                {filteredFaqs.map((faq, index) => (
                  <FAQItem key={faq.id} faq={faq} isLast={index === filteredFaqs.length - 1} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-background px-6 py-12 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Search className="size-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">No answers found</h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Try a different search or choose another topic.</p>
                <button
                  type="button"
                  onClick={() => { setSearchTerm(""); setActiveCategory("all"); }}
                  className="mt-4 text-sm font-medium text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-background p-5 shadow-sm sm:p-6 lg:hidden">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-foreground">Still have a question?</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Our support team is happy to help with your order.</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                Contact support <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

function FAQItem({ faq, isLast }: { faq: FaqRow; isLast: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const answerId = `faq-answer-${faq.id}`;

  return (
    <section className={!isLast ? "border-b" : undefined}>
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={() => setIsOpen((open) => !open)}
          className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:px-6"
        >
          <span className="text-sm font-medium leading-6 text-foreground sm:text-base">{faq.question}</span>
          <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-colors ${isOpen ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
            {isOpen ? "−" : "+"}
          </span>
        </button>
      </h3>
      {isOpen ? (
        <div id={answerId} className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="border-l-2 border-primary/20 pl-4 text-sm leading-6 text-muted-foreground sm:pl-5 sm:text-[15px] sm:leading-7">
            <RichTextContent html={faq.answer} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default FAQPage;
