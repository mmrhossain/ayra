"use client";

import Newsletter from "@/components/shared/Newsletter";
import { getSocialDisplayLinks, INSTAGRAM_URL } from "@/config/site";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import Image from "next/image";
import Link from "next/link";
import { AiFillTikTok } from "react-icons/ai";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";

const TopFooter = () => {
  const { store } = usePublicSettings();
  const socialLinks = getSocialDisplayLinks(store.supportPhone);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 py-12 lg:py-20 border-t border-slate-100">
        {/* 1. Brand Section */}
        <div className="sm:col-span-2 lg:col-span-3 space-y-6">
          <div>
            <h2 className="mb-3 text-base font-semibold tracking-tight text-foreground">
              About Us
            </h2>
            <div className="h-1 w-10 bg-primary" />
          </div>

          <div className="space-y-4">
            <span lang="bn" className="block text-xl leading-relaxed font-semibold text-primary">
              শেকড়ে ঐতিহ্যের রং
            </span>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm lg:max-w-xs">
              Celebrating the timeless artistry of handcrafted textiles where every thread tells a
              story of heritage and soul.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-medium tracking-wide uppercase text-slate-400">
              Follow Our Journey
            </h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  aria-disabled={social.href === "#"}
                  onClick={social.href === "#" ? (event) => event.preventDefault() : undefined}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-black hover:text-white hover:border-black transition-all duration-300"
                >
                  {social.label === "Facebook" ? <FaFacebookF size={14} /> : null}
                  {social.label === "TikTok" ? <AiFillTikTok size={14} /> : null}
                  {social.label === "Instagram" ? <FaInstagram size={14} /> : null}
                  {social.label === "WhatsApp" ? <FaWhatsapp size={14} /> : null}
                  {social.label === "YouTube" ? <FaYoutube size={14} /> : null}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Info Section */}
        <div className="lg:col-span-2 lg:ml-auto">
          <h2 className="mb-6 text-sm font-semibold tracking-wide uppercase text-slate-900 lg:mb-8">
            Quick Links
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-1 gap-y-4 gap-x-2">
            {["About", "Contact", "Blogs", "Shop", "Privacy Policy", "Terms", "FAQ"].map((item) => (
              <li key={item}>
                <Link
                  href={`/${item.toLowerCase().replace(" ", "-")}`}
                  className="text-slate-500 text-sm hover:text-primary transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="h-[1px] w-0 bg-primary group-hover:w-3 transition-all duration-300" />
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Social Gallery Section */}
        <div className="lg:col-span-3 lg:ml-auto flex flex-col items-start sm:items-start lg:items-start">
          <h2 className="mb-6 text-sm font-semibold tracking-wide uppercase text-slate-900 lg:mb-8">
            Instagram Shop
          </h2>
          <div className="group relative overflow-hidden rounded-2xl border-4 border-slate-50 shadow-sm w-fit">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden bg-white p-2"
            >
              <Image
                width={140}
                height={140}
                src={
                  "https://res.cloudinary.com/dw0ojh7h8/image/upload/v1791365873/qr_code_qwkeqc.png"
                }
                alt={"QR Code"}
                className="transition-transform duration-700 group-hover:scale-105 w-auto h-auto"
              />
            </a>
          </div>
          <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Scan to follow @ayra
          </p>
        </div>

        {/* 4. Newsletter Section */}
        <div className="sm:col-span-2 lg:col-span-4 bg-slate-50 p-6 lg:p-0 lg:bg-transparent rounded-2xl">
          <Newsletter />
        </div>
      </div>
    </div>
  );
};

export default TopFooter;
