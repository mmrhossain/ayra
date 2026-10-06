"use client";

import {useEffect, useState} from "react";

export const useCountDown = (targetDate: number) => {
    // Start with a deterministic value so SSR and hydration output match.
    const [countDown, setCountDown] = useState<number | null>(null);

    useEffect(() => {
        const updateTimeLeft = () => {
            setCountDown(Math.max(0, targetDate - Date.now()));
        };

        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    if (countDown === null || countDown <= 0) {
        return [0, 0, 0, 0] as const;
    }

    const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor(
        (countDown % (1000 * 60 * 60)) / (1000 * 60),
    );
    const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

    return [days, hours, minutes, seconds] as const;
};
