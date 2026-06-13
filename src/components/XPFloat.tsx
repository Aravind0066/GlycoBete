import { useEffect, useState } from "react";

export function XPFloat({ amount, trigger }: { amount: number; trigger: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1000);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
      <span className="font-display text-2xl text-amber-400 animate-xp-float drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">
        +{amount} XP
      </span>
    </div>
  );
}
