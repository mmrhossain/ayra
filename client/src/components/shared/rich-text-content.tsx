import { cn } from "@/lib/utils";

type RichTextContentProps = {
  html?: string | null;
  className?: string;
  fallback?: string;
};

const BLOCK_TAGS =
  /<\/?(?:script|iframe|object|embed|form|link|meta|style|svg|math)[^>]*>/gi;
const EVENT_ATTRS = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URLS = /\s(?:href|src|xlink:href)\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi;

export function sanitizeClientHtml(html: string): string {
  return html.replace(BLOCK_TAGS, "").replace(EVENT_ATTRS, "").replace(JS_URLS, "");
}

export function RichTextContent({ html, className, fallback }: RichTextContentProps) {
  const safe = html ? sanitizeClientHtml(html) : "";
  if (!safe) {
    return fallback ? <p className={className}>{fallback}</p> : null;
  }

  return (
    <div
      className={cn("rich-text max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
