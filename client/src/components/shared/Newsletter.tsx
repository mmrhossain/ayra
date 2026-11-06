"use client";

import { SendHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // No newsletter subscription endpoint exists yet. Until the backend exposes
  // one, this form validates input but explicitly reports that signup is not
  // available instead of faking a successful subscription.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();

    if (!EMAIL_PATTERN.test(value)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await Promise.resolve();
      toast("Newsletter signup isn't available yet. Please check back soon.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground uppercase">
          Join Our Tribe
        </h2>
        <div className="h-[1px] flex-1 bg-border hidden md:block" />
      </div>

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-[280px] md:max-w-full">
          Subscribe to receive exclusive offers, early access to new arrivals,
          and curated style inspiration.
        </p>

        <div className="space-y-3">
          <div className="relative group/input">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <Input
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "newsletter-email-error" : undefined}
              className="h-12 md:h-14 rounded-xl border-border bg-card px-4 text-foreground ring-offset-background focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-300"
              placeholder="Enter your email address"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-xl text-sm font-medium uppercase tracking-wide shadow-lg shadow-primary/10 transition-all duration-500 hover:shadow-primary/30 md:h-14"
          >
            {submitting ? "Checking..." : "Subscribe Now"}
            <SendHorizontal
              size={18}
              className="ml-2 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Button>

          <p
            id="newsletter-email-error"
            role="alert"
            aria-live="polite"
            className="min-h-4 text-sm text-danger"
          >
            {error}
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center md:text-left italic">
          *We respect your privacy. Unsubscribe at any time.
        </p>
      </form>
    </div>
  );
};

export default Newsletter;
