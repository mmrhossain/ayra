"use client";

import { useState } from "react";
import PlayIcon from "@/components/shared/PlayIcon";

const VideoPlayer = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <div className="">
            {/* Play button */}
            <button
                onClick={() => setIsOpen(true)}
                className="outline-0 flex items-center justify-center w-16 h-16 cursor-pointer text-white z-50 animate-pulse bg-primary rounded-full hover:scale-105 transition-all duration-300 hover:bg-dark-color"
            >
                <PlayIcon className="w-8 h-8 text-white" />
            </button>

            {/* Video modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
                    <div className="relative w-full max-w-4xl aspect-video">
                        <iframe
                            src="https://player.vimeo.com/video/115041822?autoplay=1&muted=0"
                            className="w-full h-full rounded-lg"
                            allow="autoplay fullscreen"
                            allowFullScreen
                        />
                        {/* Close button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute -top-10 right-0 text-white text-2xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
