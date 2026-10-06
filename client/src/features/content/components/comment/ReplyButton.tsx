"use client";
import React, { useState } from "react";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";

export default function ReplyButton() {
    const [open, setOpen] = useState(false);

    return (
        <div className="text-right">
            <Button
                onClick={() => setOpen(!open)}
                className="px-5 py-1.5 bg-primary text-white text-xs font-bold rounded-sm hover:bg-slate-900 transition-colors uppercase tracking-widest"
            >
                {open ? "Cancel" : "Reply"}
            </Button>
            {open && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <Textarea className="resize-none focus-visible:ring-0 w-full p-4 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" placeholder="Type your reply..." />
                    <button className="mt-2 text-xs font-bold text-primary uppercase underline" onClick={() => setOpen(false)}>Submit</button>
                </div>
            )}
        </div>
    );
}