"use client";

import { CHAT_MAX_MESSAGE } from "@/features/content/api/chat";
import { Textarea } from "@/components/ui/textarea";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useStorefrontChat } from "./use-storefront-chat";
import StoreImage from "@/components/shared/store-image";
import { formatPrice } from "@/lib/format";

const HIDDEN_ROUTES = ["/checkout", "/cart"];

export default function StorefrontChat() {
  const { store } = usePublicSettings();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const { messages, draft, setDraft, sending, send } = useStorefrontChat();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();

  const isHiddenRoute = HIDDEN_ROUTES.some((route) => pathname?.startsWith(route));
  const loginHref = `/login?redirect=${encodeURIComponent(pathname || "/")}`;

  // ১. সমস্ত হুকগুলো সবার উপরে কল করা হলো (কোনো কন্ডিশন ছাড়া)
  useEffect(() => {
    if (isHiddenRoute) return;

    let observer: IntersectionObserver | null = null;
    const animationFrameId = requestAnimationFrame(() => {
      const hero = document.getElementById("hero");
      if (!hero) {
        setVisible(true);
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => {
          setVisible(!entry.isIntersecting);
        },
        { threshold: 0.25 }
      );
      observer.observe(hero);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer?.disconnect();
    };
  }, [pathname, isHiddenRoute]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, sending, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ২. হুক কল করা শেষ হওয়ার পর এখন কন্ডিশনাল রিটার্ন দেওয়া যাবে
  if (isHiddenRoute) return null;

  const canSend = draft.trim().length > 0 && !sending;

  return (
    <div
      data-storefront-chat
      data-chat-open={open}
      className={`fixed right-4 z-40 md:right-6 bottom-[calc(var(--bottom-nav-space)_+_var(--sticky-cart-space)_+_5rem)] lg:bottom-24 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="mb-3 flex h-[min(28rem,calc(100dvh-var(--bottom-nav-space)-var(--sticky-cart-space)-10rem))] w-[min(calc(100vw-2rem),24rem)] flex-col overflow-hidden rounded-md border border-border bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/10 px-4 py-3 text-foreground">
            <p id={titleId} className="text-sm font-semibold">
              Ask {store.name}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex size-11 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-900/10 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`${message.products?.length ? "max-w-[94%]" : "max-w-[85%]"} rounded-md px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary/10 text-foreground"
                      : "bg-white text-slate-800 shadow-sm"
                  }`}
                >
                  {message.text && !message.products?.length ? (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  ) : null}
                  {message.products?.length ? (
                    <div className="mt-2 space-y-2">
                      {message.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product-details/${encodeURIComponent(product.slug)}`}
                          className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-white p-2 text-slate-800 transition-colors hover:border-primary"
                        >
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                            {product.imageUrl ? (
                              <StoreImage
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="56px"
                                className="object-contain"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-[10px] text-slate-400">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-xs font-medium leading-snug">{product.name}</p>
                            {product.price !== null ? (
                              <p className="mt-1 text-xs font-semibold text-primary">{formatPrice(product.price)}</p>
                            ) : null}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {message.loginCta ? (
                    <Link
                      href={loginHref}
                      className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Log in
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
            {sending ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking…
                </div>
              </div>
            ) : null}
          </div>

          <form
            className="flex items-end gap-2 border-t border-border bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <label htmlFor="storefront-chat-input" className="sr-only">
              Message
            </label>
            <Textarea
              id="storefront-chat-input"
              ref={inputRef}
              rows={1}
              maxLength={CHAT_MAX_MESSAGE}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask about products…"
              className="max-h-24 min-h-11 flex-1 resize-none rounded-md border border-border bg-white px-3 py-2.5 text-base text-slate-800 placeholder:text-muted-foreground placeholder:text-xs outline-none focus-visible:ring-0"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}

      {open ? (
        <div className="h-11" aria-hidden="true" />
      ) : (
        <div className="group relative flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ask us"
            aria-expanded={false}
            className="relative flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-110 hover:bg-primary/90 active:scale-95"
          >
            <MessageCircle size={20} />
          </button>
          <span className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100 md:block">
            Ask us
          </span>
        </div>
      )}
    </div>
  );
}
