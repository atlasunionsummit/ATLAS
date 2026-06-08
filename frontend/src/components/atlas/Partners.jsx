import { motion } from "framer-motion";

export default function Partners() {
  return (
    <section
      id="partners"
      className="relative py-24 lg:py-32 px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="glass-strong rounded-md p-10 lg:p-16 relative overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-[60vmax] h-[60vmax] rounded-full pointer-events-none opacity-50"
          style={{
            background:
              "radial-gradient(circle, rgba(91,27,255,0.25), transparent 60%)",
            filter: "blur(60px)",
          }}
        />
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
          <div>
            <span className="classified-label text-[var(--atlas-gold)]">
              / 07 — ECOSYSTEM PARTNERS
            </span>
            <h2
              className="font-display mt-3 text-white"
              style={{ fontSize: "clamp(36px, 5vw, 72px)", lineHeight: 0.95 }}
            >
              A GROWING <br /> <span className="outlined">ECOSYSTEM.</span>
            </h2>
          </div>
          <div>
            <p className="text-white/75 leading-[1.8] text-[15px]">
              A growing ecosystem of academic institutions, innovation
              communities, entrepreneurship networks and youth organisations.
              Expected participation from leading academic ecosystems across
              Delhi and beyond.
            </p>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="aspect-[3/2] rounded-sm flex items-center justify-center font-mono text-[10px] tracking-[0.3em] text-white/40 border border-white/10 hover:border-[var(--atlas-gold)]/40 transition-colors"
                  style={{
                    background:
                      "repeating-linear-gradient(135deg, rgba(245,241,255,0.02) 0, rgba(245,241,255,0.02) 6px, transparent 6px, transparent 12px)",
                  }}
                >
                  · CLASSIFIED ·
                </motion.div>
              ))}
            </div>
            <p className="font-mono text-[10px] tracking-[0.24em] text-white/40 mt-6">
              ◇ COLLABORATIONS REVEALED IN PHASES · STAY CONNECTED
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
