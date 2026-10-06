"use client";

import Newsletter from "@/components/shared/Newsletter";
import Link from "next/link";
import { AiFillTikTok } from "react-icons/ai";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";

const TopFooter = () => {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 py-12 lg:py-20 border-t border-slate-100">
        {/* 1. Brand Section */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-6">
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.2em] text-slate-900 mb-3">
              About Us
            </h2>
            <div className="h-1 w-10 bg-[#8B2312]" />
          </div>

          <div className="space-y-4">
            <span className="block text-primary font-bold text-xl">শেকড়ে ঐতিহ্যের রং</span>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm lg:max-w-xs">
              Celebrating the timeless artistry of handcrafted textiles where every thread tells a
              story of heritage and soul.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Follow Our Journey
            </h4>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: FaFacebookF, url: "#" },
                { icon: AiFillTikTok, url: "#" },
                { icon: FaInstagram, url: "#" },
                { icon: FaYoutube, url: "#" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-black hover:text-white hover:border-black transition-all duration-300"
                >
                  <social.icon size={14} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Info Section */}
        <div className="lg:col-span-3 lg:ml-auto">
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-900 mb-6 lg:mb-8">
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

        {/* 3. Newsletter Section */}
        <div className="sm:col-span-2 lg:col-span-5 bg-slate-50 p-6 lg:p-0 lg:bg-transparent rounded-2xl">
          <Newsletter />
        </div>
      </div>
    </div>
  );
};

export default TopFooter;
