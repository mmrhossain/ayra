"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { RxDividerVertical } from "react-icons/rx";

const Header: React.FC = () => {
  const [value, setValue] = useState<string>("English");

  return (
    <header className="bg-primary text-light-color text-sm font-normal">
      <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-2 sm:gap-0 py-1.5 container">
        {/* Left Section */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-center">
          <span>Welcome to Ayra Online Store</span>

          <div className="hidden sm:flex">
            <RxDividerVertical size={28} />

            <Link
              href="/customer/orders"
              className="flex items-center gap-1.5 hover:underline text-light-color hover:text-white"
            >
              <Truck size={16} /> <span className="hidden sm:inline">Track Your Order</span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <RxDividerVertical size={28} />

            <a
              href="mailto:info.mmrhossain.com"
              onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
                // Optional Gmail fallback
                const isMailClientAvailable = true; // In browsers, usually true if mail client is registered
                if (!isMailClientAvailable) {
                  e.preventDefault();
                  window.open(
                    "https://mail.google.com/mail/?view=cm&to=info@raangalay.com",
                    "_blank"
                  );
                }
              }}
              className="flex items-center gap-1.5 hover:underline text-light-color hover:text-white"
            >
              <Mail size={16} />
              <span className="hidden sm:inline">info@raangalay.com</span>
            </a>
          </div>
        </div>

        {/* Right Section (Language Switcher) */}
        <div className="w-full hidden  md:w-auto md:flex ">
          <Select defaultValue={value} onValueChange={(val) => setValue(val)}>
            <SelectTrigger className="w-full text-sm font-normal border-0 text-light-color focus-visible:ring-0">
              {value === "English" ? (
                <Image
                  src={"/images/icon/en.png"}
                  alt="En"
                  width={18}
                  height={18}
                  loading="eager"
                />
              ) : (
                <Image
                  src={"/images/icon/bn.png"}
                  alt="Bn"
                  width={18}
                  height={18}
                  loading="eager"
                />
              )}
              <SelectValue placeholder="English" />
            </SelectTrigger>
            <SelectContent className="bg-gray-100 text-gray-800">
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="বাংলা">বাংলা</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
};

export default Header;
