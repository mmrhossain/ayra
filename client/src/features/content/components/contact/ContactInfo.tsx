"use client";

import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { AiFillTikTok } from "react-icons/ai";
import { SOCIAL_LINKS } from "@/config/site";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import Link from "next/link";

const ContactInfo: React.FC = () => {
  const { store } = usePublicSettings();
  const telephoneHref = store.supportPhone.replace(/[^\d+]/g, "");

  return (
    <div className="flex h-full flex-col justify-between space-y-10 bg-primary p-5 text-white sm:p-8 md:space-y-12 md:p-12">
      <div>
        <h2 className="mb-6 text-xl font-black uppercase tracking-tight lg:mb-8 lg:text-2xl lg:tracking-tighter">
          Contact Information
        </h2>

        <div className="space-y-6 md:space-y-8">
          {store.supportPhone ? (
            <div className="group flex items-start gap-4">
              <div className="rounded-xl bg-white/10 p-3 transition-all duration-300 group-hover:bg-white group-hover:text-primary">
                <FiPhone size={22} />
              </div>
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-widest text-white/60">
                  Call Us
                </p>
                <Link
                  href={`tel:${telephoneHref}`}
                  className="text-base font-bold hover:underline md:text-lg"
                >
                  {store.supportPhone}
                </Link>
              </div>
            </div>
          ) : null}

          {store.supportEmail ? (
            <div className="group flex items-start gap-4">
              <div className="rounded-xl bg-white/10 p-3 transition-all duration-300 group-hover:bg-white group-hover:text-primary">
                <FiMail size={22} />
              </div>
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-widest text-white/60">
                  Email Us
                </p>
                <Link
                  href={`mailto:${store.supportEmail}`}
                  className="break-all text-base font-bold hover:underline md:text-lg"
                >
                  {store.supportEmail}
                </Link>
              </div>
            </div>
          ) : null}

          {store.address ? (
            <div className="group flex items-start gap-4">
              <div className="rounded-xl bg-white/10 p-3 transition-all duration-300 group-hover:bg-white group-hover:text-primary">
                <FiMapPin size={22} />
              </div>
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-widest text-white/60">
                  Address
                </p>
                <p className="whitespace-pre-line text-sm font-medium leading-relaxed lg:text-base">
                  {store.address}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-4 text-xs font-black uppercase tracking-[0.12em] text-white/60 md:tracking-widest">
          Social Presence
        </p>
        <div className="flex gap-4">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-11 items-center justify-center rounded-full bg-white/10 transition-all duration-300 hover:bg-white hover:text-primary"
              aria-label={social.label}
            >
              {social.label === "Facebook" && <FaFacebookF />}
              {social.label === "TikTok" && <AiFillTikTok />}
              {social.label === "Instagram" && <FaInstagram />}
              {social.label === "YouTube" && <FaYoutube />}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
