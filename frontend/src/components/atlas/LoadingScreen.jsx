import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ATLAS } from "@/constants/testIds";

const PHASES = [
  "BOOTING ATLAS NETWORK",
  "ESTABLISHING SECURE LINK",
  "DECRYPTING DIPLOMATIC NODES",
  "VERIFYING CIRCUIT INTEGRITY",
  "ACCESS GRANTED",
];

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        const next = p + (Math.random() * 2.6 + 0.6);
        if (next >= 100) {
          clearInterval(t);
          setPhase(PHASES.length - 1);
          setTimeout(() => {
            setVisible(false);
            onDone && onDone();
          }, 900);
          return 100;
        }
        const ph = Math.min(
          PHASES.length - 1,
          Math.floor((next / 100) * PHASES.length)
        );
        setPhase(ph);
        return next;
      });
    }, 65);
    return () => clearInterval(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid={ATLAS.loadingScreen}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "var(--atlas-black)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
        >
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="scan-line" />

          {/* Corner markers */}
          {[
            "top-6 left-6",
            "top-6 right-6",
            "bottom-6 left-6",
            "bottom-6 right-6",
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} flex items-center gap-2 classified-label`}
            >
              <span className="status-dot" />
              <span>NODE {String(i + 1).padStart(2, "0")}</span>
            </div>
          ))}

          <div className="relative z-10 w-[min(560px,86vw)] text-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="classified-label mb-6 text-white/60"
            >
              ATLAS UNION SUMMIT · 2026 · DELHI CIRCUIT
            </motion.div>

            <motion.h1
              initial={{ letterSpacing: "0.4em", opacity: 0 }}
              animate={{ letterSpacing: "0.02em", opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="font-display text-white"
              style={{ fontSize: "clamp(56px, 9vw, 132px)", lineHeight: 0.85 }}
            >
              ATLAS
            </motion.h1>

            <div className="mt-10 mx-auto h-[2px] w-full bg-white/10 overflow-hidden">
              <motion.div
                data-testid={ATLAS.loadingProgress}
                className="h-full"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, var(--atlas-gold), var(--atlas-purple))",
                  boxShadow: "0 0 18px var(--atlas-purple)",
                }}
              />
            </div>

            <div className="mt-4 flex justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
              <span>{PHASES[phase]}</span>
              <span>{Math.floor(progress)}%</span>
            </div>

            <div className="mt-12 flex flex-col gap-1 text-left mx-auto max-w-[420px] font-mono text-[10px] tracking-[0.18em] text-white/40">
              {PHASES.slice(0, phase + 1).map((p, i) => (
                <motion.div
                  key={p}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between"
                >
                  <span>› {p}</span>
                  <span className="text-[var(--atlas-gold)]">OK</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
