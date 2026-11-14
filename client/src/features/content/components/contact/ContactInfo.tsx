"use client";

import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { AiFillTikTok } from "react-icons/ai";
import { getSocialDisplayLinks } from "@/config/site";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import Link from "next/link";

const ContactInfo: React.FC = () => {
  const { store } = usePublicSettings();
  const telephoneHref = store.supportPhone.replace(/[^\d+]/g, "");
  const contactSocialLinks = getSocialDisplayLinks(store.supportPhone);
  return (
    <div className="flex h-full flex-col justify-between space-y-10 bg-primary p-5 text-white sm:p-8 md:space-y-12 md:p-12">
      <div>
        <h2 className="mb-6 text-lg font-semibold tracking-tight sm:text-xl lg:mb-8 lg:text-2xl">
          Contact Information
        </h2>

        <div className="space-y-6 md:space-y-8">
          {store.supportPhone ? (
            <div className="group flex items-start gap-4">
              <div className="rounded-xl bg-white/10 p-3 transition-all duration-300 group-hover:bg-white group-hover:text-primary">
                <FiPhone size={22} />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-white/70 sm:text-sm">
                  Call Us
                </p>
                <Link
                  href={`tel:${telephoneHref}`}
                  className="break-all text-sm font-normal hover:underline sm:text-base"
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
                <p className="mb-1 text-xs font-medium text-white/70 sm:text-sm">
                  Email Us
                </p>
                <Link
                  href={`mailto:${store.supportEmail}`}
                  className="break-all text-sm font-normal hover:underline sm:text-base"
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
                <p className="mb-1 text-xs font-medium text-white/70 sm:text-sm">
                  Address
                </p>
                <p className="break-words whitespace-pre-line text-sm font-normal leading-relaxed sm:text-base">
                  {store.address}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-4 text-xs font-medium text-white/70 sm:text-sm">
          Social Presence
        </p>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {contactSocialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={social.href === "#"}
              onClick={social.href === "#" ? (event) => event.preventDefault() : undefined}
              className="flex size-11 items-center justify-center rounded-full bg-white/10 transition-all duration-300 hover:bg-white hover:text-primary"
              aria-label={social.label}
            >
              {social.label === "Facebook" && <FaFacebookF />}
              {social.label === "WhatsApp" && <FaWhatsapp />}
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
