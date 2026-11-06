import DOMPurify from "dompurify";

const SERVER_BLOCK_TAGS =
  /<\/?(?:script|iframe|object|embed|form|link|meta|style|svg|math)[^>]*>/gi;
const SERVER_EVENT_ATTRS = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const SERVER_JS_URLS = /\s(?:href|src|xlink:href)\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi;

function sanitizeOnServer(html: string): string {
  return html
    .replace(SERVER_BLOCK_TAGS, "")
    .replace(SERVER_EVENT_ATTRS, "")
    .replace(SERVER_JS_URLS, "");
}

export function sanitizeClientHtml(html: string): string {
  if (typeof window === "undefined") {
    return sanitizeOnServer(html);
  }

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
}
