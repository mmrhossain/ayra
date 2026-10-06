import CustomButton from "@/components/shared/CustomButton"; // For a more modern feel
import { Input } from "@/components/ui/input";
import { SendHorizontal } from "lucide-react";

const Newsletter = () => {
  return (
    <div className="relative group">
      {/* Header with improved typography */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-secondary uppercase">
          Join Our Tribe
        </h2>
        <div className="h-[1px] flex-1 bg-slate-200 hidden md:block" />
      </div>

      <div className="space-y-6">
        <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-[280px] md:max-w-full">
          Subscribe to receive exclusive offers, early access to new arrivals,
          and curated style inspiration.
        </p>

        <div className="space-y-3">
          {/* Input field with a more premium feel */}
          <div className="relative group/input">
            <Input
              type="email"
              className="h-12 md:h-14 rounded-xl border-slate-200 bg-white px-4 text-secondary ring-offset-white focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-300"
              placeholder="Enter your email address"
            />
          </div>

          {/* Button with an icon and hover lift */}
          <CustomButton
            ctaText="Subscribe Now"
            icon={
              <SendHorizontal
                size={18}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            }
            className="w-full h-12 md:h-14 rounded-xl font-bold text-sm uppercase tracking-widest bg-slate-900 text-white hover:bg-primary shadow-lg shadow-slate-200 hover:shadow-primary/30 transition-all duration-500"
          />
        </div>

        {/* Optional: Trust message */}
        <p className="text-[10px] text-slate-400 text-center md:text-left italic">
          *We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </div>
  );
};

export default Newsletter;
