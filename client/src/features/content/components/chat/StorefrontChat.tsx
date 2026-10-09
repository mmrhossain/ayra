"use client";

import { CHAT_MAX_MESSAGE } from "@/features/content/api/chat";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useStorefrontChat } from "./use-storefront-chat";

const HIDDEN_ROUTES = ["/checkout", "/cart"];

export default function StorefrontChat() {
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
      className={`fixed right-4 z-[9999] md:right-6 bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))] md:bottom-24 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="mb-3 flex h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border bg-slate-900 px-4 py-3 text-white">
            <p id={titleId} className="text-sm font-semibold">
              Ask Ayra
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex size-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
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
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-800 shadow-sm"
                  }`}
                >
                  <p>{message.text}</p>
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
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
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
            <textarea
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
              className="max-h-24 min-h-11 flex-1 resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-base text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-opacity hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      ) : null}

      <div className="group relative flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close chat" : "Ask us"}
          aria-expanded={open}
          className="relative flex size-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-slate-800 active:scale-95"
        >
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </button>
        {!open ? (
          <span className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100 md:block">
            Ask us
          </span>
        ) : null}
      </div>
    </div>
  );
}
