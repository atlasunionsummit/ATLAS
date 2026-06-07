import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * Section wrapper that performs a cinematic reveal:
 * - subtle scale-down + opacity for entry
 * - parallax-y inner content
 * - "scanline wipe" overlay at the bottom while transitioning in
 */
export default function SectionFade({ children, id, className = "" }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.35, 1, 1, 0.35]);

  return (
    <motion.section
      id={id}
      ref={ref}
      style={reduceMotion ? {} : { opacity }}
      className={`relative ${className}`}
    >
      <motion.div style={reduceMotion ? {} : { y }} className="relative">
        {children}
      </motion.div>
    </motion.section>
  );
}

/**
 * Full-screen "scan wipe" that briefly plays between sections during fast-scroll.
 * Detects scroll velocity; on fast scroll, flashes a subtle purple scanline overlay.
 */
export function ScanWipe() {
  const [active, setActive] = useState(false);
  const last = useRef({ y: 0, t: 0 });

  useEffect(() => {
    const onScroll = () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - last.current.y);
      const dt = now - last.current.t;
      const v = dy / Math.max(1, dt);
      last.current = { y: window.scrollY, t: now };
      if (v > 3.2) {
        setActive(true);
        clearTimeout(window.__atlas_wipe);
        window.__atlas_wipe = setTimeout(() => setActive(false), 380);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      aria-hidden
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[70] pointer-events-none mix-blend-screen"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(91,27,255,0.18) 48%, rgba(201,164,76,0.15) 50%, rgba(91,27,255,0.18) 52%, transparent 100%)",
      }}
    />
  );
}
