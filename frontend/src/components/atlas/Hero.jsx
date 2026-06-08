import { motion } from "framer-motion";
import { ATLAS } from "@/constants/testIds";
import { GUARDIAN_HERO } from "@/lib/atlasAssets";
import DelhiSkylineSVG from "@/components/atlas/DelhiSkylineSVG";

export default function Hero({ onRequestAccess }) {
  return (
    <section
      id="hero"
      data-testid={ATLAS.hero}
      className="relative min-h-[100svh] pt-32 lg:pt-36 pb-24 overflow-hidden"
    >
      {/* Cinematic Delhi skyline */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <DelhiSkylineSVG />
      </div>
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(8,0,15,0) 0%, rgba(8,0,15,0.35) 65%, rgba(8,0,15,0.75) 100%)",
        }}
      />
      <div className="absolute inset-0 z-[1] grid-bg opacity-25 pointer-events-none" />
      <div
        className="absolute -top-40 -right-40 w-[60vmax] h-[60vmax] rounded-full pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(circle, rgba(91,27,255,0.25), transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-12 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
        {/* LEFT */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {["EDITION 2026", "DELHI CIRCUIT", "LIVE NETWORK", "AUVREO INTERNATIONAL"].map((t) => (
              <span
                key={t}
                className="classified-label glass rounded-full px-3 py-1 text-white/80"
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                  style={{ background: "var(--atlas-cyan)" }}
                />
                {t}
              </span>
            ))}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1 }}
            className="hero-type text-white"
            style={{ fontSize: "clamp(44px, 11vw, 156px)" }}
          >
            <span className="block">ATLAS</span>
            <span className="block text-glow-purple">UNION</span>
            <span className="block flex items-end gap-4 flex-wrap">
              <span>SUMMIT</span>
              <span className="outlined" style={{ fontSize: "clamp(32px, 8vw, 102px)" }}>
                2026
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="font-serif-italic mt-8 text-[var(--atlas-gold)]"
            style={{ fontSize: "clamp(18px, 3.5vw, 30px)" }}
          >
            “This is where it begins.”
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-6 max-w-[560px] text-white/75 text-[15px] leading-[1.65]"
          >
            A cinematic diplomacy universe engineered for the next generation of
            operators, innovators and leaders. Atlas is not a conference. Atlas
            is a circuit.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.85 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <button
              data-testid={ATLAS.heroCta}
              onClick={onRequestAccess}
              className="btn-atlas"
            >
              REQUEST ACCESS <span aria-hidden>↗</span>
            </button>
            <a
              data-testid={ATLAS.heroSecondary}
              href="#operations"
              className="btn-ghost"
            >
              ENTER THE CIRCUIT <span aria-hidden>→</span>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-12 flex flex-wrap gap-x-10 gap-y-3 font-mono text-[10.5px] tracking-[0.22em] text-white/55 uppercase"
          >
            <span>NIC CODE · 85</span>
            <span>SUB-CLASS · 8500</span>
            <span>REG · GOVT OF INDIA / MSME</span>
            <span className="text-[var(--atlas-gold)]">विश्वम् एक मंचम्</span>
          </motion.div>
        </div>

        {/* RIGHT — Guardian artwork (original blue-hair warrior) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative aspect-[3/4] w-full max-w-[520px] mx-auto"
        >
          <div className="absolute inset-0 glass-strong rounded-[6px] overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 30%, rgba(91,27,255,0.5), transparent 60%)",
                filter: "blur(20px)",
              }}
            />
            <img
              src={GUARDIAN_HERO}
              alt="Atlas Guardian"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-95 float"
            />
            <div className="absolute inset-0 grid-bg opacity-25" />
            <div className="scan-line" />

            <div className="absolute top-4 left-4 right-4 flex justify-between font-mono text-[9.5px] tracking-[0.3em] text-white/85">
              <span className="flex items-center gap-2">
                <span className="status-dot" />
                ATLAS / GUARDIAN_001
              </span>
              <span>CIPHER · 5B1B</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between font-mono text-[9.5px] tracking-[0.3em] text-white/85">
              <span>DELHI · LAT 28.6°</span>
              <span className="text-[var(--atlas-gold)]">CLEARANCE · ELITE</span>
            </div>

            {["top-2 left-2","top-2 right-2","bottom-2 left-2","bottom-2 right-2"].map((p,i)=>(
              <span
                key={i}
                className={`absolute ${p} w-3 h-3`}
                style={{
                  borderColor: "var(--atlas-gold)",
                  borderTopWidth: p.includes("top") ? 1 : 0,
                  borderBottomWidth: p.includes("bottom") ? 1 : 0,
                  borderLeftWidth: p.includes("left") ? 1 : 0,
                  borderRightWidth: p.includes("right") ? 1 : 0,
                  borderStyle: "solid",
                }}
              />
            ))}
          </div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -left-6 top-12 glass rounded-md px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-white/85 hidden md:block"
          >
            <div className="flex items-center gap-2">
              <span className="status-dot" /> SIGNAL — 98.2%
            </div>
            <div className="text-[var(--atlas-gold)] mt-1">ENCRYPTED</div>
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute -right-4 bottom-16 glass rounded-md px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-white/85 hidden md:block"
          >
            <div>ARCHIVE / 0x2A4D</div>
            <div className="text-[var(--atlas-cyan)] mt-1">NODES · 41</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
