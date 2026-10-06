"use client";
import React from "react";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { SocialLink } from "@/types/social";

const platformIcons = {
    facebook: { icon: Facebook, color: "bg-[#3b5998]" },
    twitter: { icon: Twitter, color: "bg-[#1da1f2]" },
    instagram: { icon: Instagram, color: "bg-[#e1306c]" },
    linkedin: { icon: Linkedin, color: "bg-[#0077b5]" },
};

export default function SocialShare({ links }: { links: SocialLink[] }) {
    return (
        <div className="flex items-center gap-4">
            <span className="font-bold text-slate-900 text-sm uppercase">Share:</span>
            <div className="flex gap-2">
                {links.map((link, idx) => {
                    const config = platformIcons[link.platform.toLowerCase() as keyof typeof platformIcons];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                        <a key={idx} href={link.url} className={`${config.color} w-9 h-9 flex items-center justify-center rounded-full hover:scale-110 transition-all shadow-md`}>
                            <Icon size={16} className="text-white" fill="white" />
                        </a>
                    );
                })}
            </div>
        </div>
    );
}