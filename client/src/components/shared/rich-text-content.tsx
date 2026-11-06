import { cn } from "@/lib/utils";
import { sanitizeClientHtml } from "./sanitize-client-html";

type RichTextContentProps = {
  html?: string | null;
  className?: string;
  fallback?: string;
};

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
