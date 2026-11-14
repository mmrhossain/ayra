"use client";

import { usePublicSettings } from "@/features/settings/public-settings-provider";
import { getSocialDisplayLinks } from "@/config/site";
import Image from "next/image";
import { AiFillTikTok } from "react-icons/ai";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";

const BottomFooter = () => {
  const { store } = usePublicSettings();
  const socialLinks = getSocialDisplayLinks(store.supportPhone);
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
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                aria-disabled={social.href === "#"}
                onClick={social.href === "#" ? (event) => event.preventDefault() : undefined}
                className="flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                {social.label === "Facebook" ? <FaFacebookF size={14} /> : null}
                {social.label === "TikTok" ? <AiFillTikTok size={14} /> : null}
                {social.label === "Instagram" ? <FaInstagram size={14} /> : null}
                {social.label === "WhatsApp" ? <FaWhatsapp size={14} /> : null}
                {social.label === "YouTube" ? <FaYoutube size={14} /> : null}
              </a>
            ))}
          </div>

          {/* Copyright & Credits (Centered Below) */}
          <div className="text-center">
            <p className="text-slate-500 text-sm leading-relaxed tracking-wide">
              © {currentYear} <span className="text-foreground font-semibold">{store.name}</span>. All rights
              reserved.
              <span className="hidden sm:inline mx-2 text-slate-300">|</span>
              <br className="sm:hidden" />
              <span className="text-slate-400">Crafted with precision by {store.name} Team.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomFooter;
