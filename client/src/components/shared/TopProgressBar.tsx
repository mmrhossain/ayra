"use client";

import { useEffect, useState } from "react";

type TopProgressBarProps = {
  active: boolean;
};

export function TopProgressBar({ active }: TopProgressBarProps) {
  const [visible, setVisible] = useState(active);
  const [width, setWidth] = useState(active ? 12 : 0);
  const [fading, setFading] = useState(false);
  const [previousActive, setPreviousActive] = useState(active);

  if (active !== previousActive) {
    setPreviousActive(active);
    if (active) {
      setVisible(true);
      setFading(false);
      setWidth(12);
    }
  }

  useEffect(() => {
    if (active) {
      const grow = window.setTimeout(() => setWidth(72), 40);
      const settle = window.setTimeout(() => setWidth(88), 700);
      return () => {
        window.clearTimeout(grow);
        window.clearTimeout(settle);
      };
    }

    if (!visible) return;

    const start = window.setTimeout(() => setWidth(100), 0);
    const fade = window.setTimeout(() => setFading(true), 180);
    const hide = window.setTimeout(() => {
      setVisible(false);
      setWidth(0);
      setFading(false);
    }, 420);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(fade);
      window.clearTimeout(hide);
    };
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[10000] h-[2px] overflow-hidden"
      role="progressbar"
      aria-hidden={!active}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div
        className="h-full origin-left bg-sky-color shadow-[0_0_8px_var(--color-sky-color)]"
        style={{
          width: `${width}%`,
          opacity: fading ? 0 : 1,
          transition: fading
            ? "opacity 220ms ease-out"
            : "width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}
