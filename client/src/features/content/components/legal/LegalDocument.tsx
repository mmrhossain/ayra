import { CalendarDays, FileText, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { RichTextContent } from "@/components/shared/rich-text-content";
import { SUPPORT_EMAIL } from "@/config/site";
import type { PublishedLegalDocument } from "@/features/content/types";

type Props = {
  document: PublishedLegalDocument | null;
  fallbackTitle: string;
  fallbackIntro: string;
};

export function LegalDocument({ document, fallbackTitle, fallbackIntro }: Props) {
  const title = document?.title ?? fallbackTitle;
  const updated = document?.effectiveAt || document?.updatedAt;
  const updatedLabel = updated
    ? new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(updated))
    : null;
  const isPrivacy = document?.type === "PRIVACY" || fallbackTitle === "Privacy Policy";
  const otherDocument = isPrivacy
    ? { label: "Terms of Service", href: "/terms" }
    : { label: "Privacy Policy", href: "/privacy-policy" };

  return (
    <main className="min-h-[60vh] bg-muted/30 pb-16 sm:pb-20">
      <section className="border-b bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">{title}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {isPrivacy ? <ShieldCheck className="size-3.5 text-primary" /> : <FileText className="size-3.5 text-primary" />}
              Store policies
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {fallbackIntro}
            </p>
            {updatedLabel ? (
              <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CalendarDays className="size-4" />
                <span>Effective date</span>
                <span aria-hidden="true">·</span>
                <time dateTime={updated}>{updatedLabel}</time>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="container mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <article className="min-w-0 rounded-xl border bg-background p-5 shadow-sm sm:p-8 lg:p-10">
          {document ? (
            <RichTextContent
              html={document.body}
              className="text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_ul]:my-4 [&_ol]:my-4 [&_li]:my-1.5"
            />
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
                <FileText className="size-5" />
              </span>
              <h2 className="text-base font-semibold text-foreground">Policy coming soon</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                This document has not been published yet. Please check back later.
              </p>
            </div>
          )}
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-foreground">Your information matters</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              We aim to make our policies clear and keep your shopping experience secure.
            </p>
          </section>

          <section className="rounded-xl border bg-background p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Need help?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Contact our team if you have a question about this policy.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-4 inline-flex max-w-full items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Mail className="size-4 shrink-0" />
              <span className="break-all">{SUPPORT_EMAIL}</span>
            </a>
          </section>

          <Link
            href={otherDocument.href}
            className="block rounded-xl border bg-background p-5 text-sm shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            <span className="text-xs text-muted-foreground">Also available</span>
            <span className="mt-1 block font-semibold text-foreground">{otherDocument.label}</span>
          </Link>
        </aside>
      </div>
    </main>
  );
}
