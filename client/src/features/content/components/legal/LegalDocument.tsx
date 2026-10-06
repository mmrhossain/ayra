import { FileText } from "lucide-react";

import { RichTextContent } from "@/components/shared/rich-text-content";
import type { PublishedLegalDocument } from "@/features/content/types";

type Props = {
  document: PublishedLegalDocument | null;
  fallbackTitle: string;
  fallbackIntro: string;
};

export function LegalDocument({
  document,
  fallbackTitle,
  fallbackIntro,
}: Props) {
  const title = document?.title ?? fallbackTitle;
  const updated = document?.effectiveAt || document?.updatedAt;
  const updatedLabel = updated
    ? new Date(updated).toLocaleDateString()
    : null;

  return (
    <div className="bg-white pb-20">
      <div className="bg-[#F9F9F9] border-b border-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            {title}
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">{fallbackIntro}</p>
          {updatedLabel ? (
            <p className="mt-4 text-xs font-bold text-[#14b8a6] uppercase tracking-widest">
              Last Updated: {updatedLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 mt-16">
        {document ? (
          <RichTextContent
            html={document.body}
            className="text-slate-600 leading-relaxed"
          />
        ) : (
          <div className="bg-[#F9F9F9] border border-gray-100 p-8 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <FileText className="text-[#14b8a6]" />
              <h2 className="text-xl font-bold text-slate-900">Coming soon</h2>
            </div>
            <p className="text-slate-600">
              This document has not been published yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
