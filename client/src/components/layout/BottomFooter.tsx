import Image from "next/image";

const BottomFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full border-t border-slate-100 bg-white">
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          {/* Copyright & Credits */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <p className="text-slate-500 text-sm leading-relaxed tracking-wide">
              © {currentYear}{" "}
              <span className="text-secondary font-semibold">Raangalay</span>.
              All rights reserved.
              <span className="hidden sm:inline mx-2 text-slate-300">|</span>
              <br className="sm:hidden" />
              <span className="text-slate-400">
                Crafted with precision by Raangalay Team.
              </span>
            </p>
          </div>

          {/* Payment Gateways */}
          <div className="order-1 lg:order-2">
            <div className="relative group grayscale hover:grayscale-0 transition-all duration-500 opacity-80 hover:opacity-100">
              <Image
                width={320}
                height={30}
                src="/images/other/payment-visa-card.png"
                alt="Accepted payment methods: Visa, Mastercard, etc."
                className="object-contain w-auto h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomFooter;
