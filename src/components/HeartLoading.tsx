import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STATUS_LINES = [
  "Syncing glucose data...",
  "Loading quest map...",
  "Calibrating health score...",
  "Powering up AI engine...",
];

const EXIT_MS = 320;

type HeartLoadingProps = {
  message?: string;
  active?: boolean;
  /** Extra time after `active` becomes false before unmounting (exit fade). */
  minDuration?: number;
};

function PixelGrid() {
  return (
    <div className="grid grid-cols-7 gap-2.5">
      {Array.from({ length: 49 }, (_, i) => (
        <motion.div
          key={i}
          className="h-3.5 w-3.5 rounded-sm bg-[var(--theme-accent)] shadow-[0_0_8px_color-mix(in_srgb,var(--theme-accent)_40%,transparent)]"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0.35],
            scale: [0, 1, 0.8],
          }}
          transition={{ delay: i * 0.022, duration: 0.5, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function OrbitRing({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 -m-10 rounded-full border border-dashed border-red-500/25"
      initial={{ opacity: 0, rotate: 0 }}
      animate={{ opacity: 1, rotate: 360 }}
      transition={{
        opacity: { delay, duration: 0.4 },
        rotate: { delay, duration: 8, repeat: Infinity, ease: "linear" },
      }}
    />
  );
}

function useLoadingPhases(active: boolean) {
  const [phase, setPhase] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    if (!active) return;

    setPhase(0);
    setStatusIdx(0);
    const reveal = setTimeout(() => setPhase(1), 520);
    const pulse = setTimeout(() => setPhase(2), 1080);
    return () => {
      clearTimeout(reveal);
      clearTimeout(pulse);
    };
  }, [active]);

  useEffect(() => {
    if (!active || phase < 2) return;
    const interval = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_LINES.length);
    }, 1100);
    return () => clearInterval(interval);
  }, [active, phase]);

  return { phase, statusIdx };
}

export function HeartLoading({
  message = "GlycoBete is thinking...",
  active = true,
  minDuration = 0,
}: HeartLoadingProps) {
  const [visible, setVisible] = useState(active);
  const hiddenAt = useRef<number | null>(null);
  const { phase, statusIdx } = useLoadingPhases(active);

  useEffect(() => {
    if (active) {
      hiddenAt.current = null;
      setVisible(true);
      return;
    }

    hiddenAt.current = Date.now();
    const timer = setTimeout(() => setVisible(false), minDuration + EXIT_MS);
    return () => clearTimeout(timer);
  }, [active, minDuration]);

  const statusText = phase < 2 ? message : STATUS_LINES[statusIdx];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: EXIT_MS / 1000 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          role="status"
          aria-live="polite"
          aria-label={statusText}
        >
          <div className="absolute inset-0 bg-[var(--theme-bg)]/94 backdrop-blur-lg" />
          <div className="absolute inset-0 animate-loading-scan pointer-events-none opacity-40" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(var(--theme-accent) 1px, transparent 1px), linear-gradient(90deg, var(--theme-accent) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 flex h-48 w-48 items-center justify-center">
            <AnimatePresence mode="wait">
              {phase === 0 ? (
                <motion.div
                  key="pattern"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2, filter: "blur(8px)" }}
                  transition={{ duration: 0.42 }}
                  className="absolute flex items-center justify-center"
                >
                  <PixelGrid />
                </motion.div>
              ) : (
                <motion.div
                  key="heart"
                  initial={{ scale: 0, opacity: 0, rotate: -14 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 17 }}
                  className="relative flex h-28 w-28 items-center justify-center"
                >
                  <div className="absolute -inset-10 rounded-full bg-red-500/20 blur-2xl animate-glow-pulse" />
                  <OrbitRing />
                  <OrbitRing delay={0.12} />
                  <motion.div
                    className="pointer-events-none absolute -inset-6 rounded-full border border-red-400/35"
                    animate={{ scale: [1, 1.14, 1], opacity: [0.55, 0.12, 0.55] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <Heart
                    className={`relative z-10 text-red-500 fill-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)] ${
                      phase === 2 ? "animate-heartbeat" : ""
                    }`}
                    size={80}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            className="relative z-10 mt-6 h-1.5 w-52 overflow-hidden rounded-full bg-[var(--theme-border)]"
            initial={{ opacity: 0, scaleX: 0.6 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-[var(--theme-accent)] to-red-500"
              initial={{ width: "6%" }}
              animate={{ width: phase === 2 ? "100%" : phase === 1 ? "68%" : "24%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="absolute inset-0 animate-shimmer opacity-60" />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.p
              key={statusText}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="relative z-10 mt-5 max-w-xs text-center font-display text-[9px] tracking-wider text-[var(--theme-muted)]"
            >
              {statusText}
            </motion.p>
          </AnimatePresence>

          <motion.div
            className="relative z-10 mt-4 flex gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 1 ? 1 : 0 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[var(--theme-accent)]"
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            animate={{ opacity: phase >= 1 ? 0.55 : 0, letterSpacing: "0.35em" }}
            transition={{ duration: 0.7 }}
            className="relative z-10 mt-6 font-display text-[7px] text-[var(--theme-accent)]"
          >
            GLYCOBETE
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
