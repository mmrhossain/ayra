const BLOCK_TAGS =
  /<\/?(?:script|iframe|object|embed|form|link|meta|style|svg|math)[^>]*>/gi;
const EVENT_ATTRS = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URLS = /\s(?:href|src|xlink:href)\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi;

export const sanitizeHtml = (html: string): string =>
  html.replace(BLOCK_TAGS, "").replace(EVENT_ATTRS, "").replace(JS_URLS, "");
