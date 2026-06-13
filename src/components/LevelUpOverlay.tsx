import { useEffect, useState } from "react";

export function LevelUpOverlay({ title, onDone }: { title: string; onDone: () => void }) {
  const [phase, setPhase] = useState<"flash" | "show">("flash");
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("show"), 200);
    const t2 = setTimeout(onDone, 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const dist = 200 + Math.random() * 100;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      color: ["#F59E0B", "#3B82F6", "#22C55E", "#EF4444", "#06B6D4", "#FCD34D"][i % 6],
    };
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {phase === "flash" && <div className="absolute inset-0 bg-white animate-flash" />}
      {phase === "show" && (
        <>
          <div className="absolute inset-0 bg-slate-900/70" />
          <div className="relative text-center">
            <h1 className="font-display text-4xl md:text-5xl text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]">
              LEVEL UP!
            </h1>
            <p className="mt-4 font-display text-xl text-slate-100">{title}</p>
            {particles.map((p, i) => (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full animate-confetti"
                style={
                  {
                    backgroundColor: p.color,
                    ["--dx" as string]: `${p.dx}px`,
                    ["--dy" as string]: `${p.dy}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
