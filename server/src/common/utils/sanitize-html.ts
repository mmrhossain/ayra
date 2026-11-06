import sanitizeHtmlLib from "sanitize-html";

const options: sanitizeHtmlLib.IOptions = {
  allowedTags: [...sanitizeHtmlLib.defaults.allowedTags, "img", "figure", "figcaption"],
  allowedAttributes: {
    ...sanitizeHtmlLib.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: "noopener noreferrer",
      },
    }),
  },
};

export const sanitizeHtml = (html: string): string => sanitizeHtmlLib(html, options);
