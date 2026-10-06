import Image from "next/image";

const BottomFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full border-t border-slate-100 bg-white">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center text-center gap-6">
          {/* Payment Gateways (Centered on Top) */}
          <div className="w-full max-w-4xl flex items-center justify-center">
            <div className="relative w-full">
              <Image
                width={1200}
                height={500}
                src="https://res.cloudinary.com/dw0ojh7h8/image/upload/v1791299182/payment_lz9mxo.png"
                alt="Accepted payment methods"
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>

          {/* Copyright & Credits (Centered Below) */}
          <div className="text-center">
            <p className="text-slate-500 text-sm leading-relaxed tracking-wide">
              © {currentYear} <span className="text-secondary font-semibold">Ayra</span>. All rights
              reserved.
              <span className="hidden sm:inline mx-2 text-slate-300">|</span>
              <br className="sm:hidden" />
              <span className="text-slate-400">Crafted with precision by Ayra Team.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomFooter;
