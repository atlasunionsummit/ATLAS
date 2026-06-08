import { motion } from "framer-motion";
import { GUARDIAN_MNEMOSA } from "@/lib/atlasAssets";

const PILLARS = [
  {
    code: "01",
    label: "DIPLOMACY",
    body: "A precision crafted simulation circuit modelled on real geopolitical pressure.",
  },
  {
    code: "02",
    label: "INNOVATION",
    body: "Founders, operators and engineers entering the same room as policy.",
  },
  {
    code: "03",
    label: "CULTURE",
    body: "A constellation of music, cinema, art and after-circuit nightlife.",
  },
  {
    code: "04",
    label: "LEGACY",
    body: "Membership into an alumni intelligence network that compounds for life.",
  },
];

export default function Ecosystem() {
  return (
    <section
      id="ecosystem"
      className="relative py-28 lg:py-40 px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-8 lg:gap-12 items-start">
        <div className="lg:sticky lg:top-32">
          <span className="classified-label text-[var(--atlas-gold)]">
            / 01 — ECOSYSTEM
          </span>
          <h2
            className="font-display mt-3"
            style={{
              fontSize: "clamp(48px, 6vw, 92px)",
              lineHeight: 0.92,
              color: "var(--atlas-white)",
            }}
          >
            A DIGITAL <br /> UNIVERSE. <br />
            <span className="outlined">NOT AN EVENT.</span>
          </h2>
          <p className="mt-6 text-white/70 max-w-[420px] leading-[1.7]">
            Atlas is a classified circuit — a living network where the future
            architecture of diplomacy, technology, capital and culture is
            rehearsed in real time.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 relative aspect-[4/5] max-w-[360px] glass rounded-md overflow-hidden"
          >
            <img
              src={GUARDIAN_MNEMOSA}
              alt="Atlas Guardian — Culture"
              className="w-full h-full object-cover opacity-95"
            />
            <div className="absolute inset-0 grid-bg opacity-25" />
            <div className="absolute bottom-3 left-3 right-3 flex justify-between font-mono text-[9.5px] tracking-[0.28em] text-white/80">
              <span>GUARDIAN · COACHELLA</span>
              <span className="text-[var(--atlas-gold)]">CULTURE CORPS</span>
            </div>
          </motion.div>
        </div>

        <div className="space-y-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.code}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.05 }}
              className="glass rounded-md p-6 lg:p-8 group hover:border-[var(--atlas-gold)]/40 transition-colors"
              style={{ borderColor: "rgba(245,241,255,0.08)" }}
            >
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8">
                <span className="font-mono text-[12px] tracking-[0.3em] text-[var(--atlas-gold)] sm:pt-2">
                  {p.code}
                </span>
                <div className="flex-1">
                  <h3
                    className="font-display text-white"
                    style={{ fontSize: "clamp(28px, 3vw, 44px)", lineHeight: 1 }}
                  >
                    {p.label}
                  </h3>
                  <p className="mt-3 text-white/65 max-w-[520px] leading-[1.7]">
                    {p.body}
                  </p>
                </div>
                <span className="hidden sm:block font-mono text-white/30 group-hover:text-[var(--atlas-gold)] transition-colors text-xl">
                  ↗
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
