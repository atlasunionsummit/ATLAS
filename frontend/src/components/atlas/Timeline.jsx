import { motion } from "framer-motion";

const STAGES = [
  { label: "ACCESS", code: "T-00", body: "Identity verification. Passport issuance." },
  { label: "OPENING", code: "T-01", body: "Ceremony · cinematic broadcast · first signal." },
  { label: "COMMITTEES", code: "T-02", body: "Seven circuits. Seven aesthetics. Real time." },
  { label: "OPERATIONS", code: "T-03", body: "Apex · Dynasty · Vaidya · Foundry · Atlas." },
  { label: "NETWORKING", code: "T-04", body: "Private dossiers, encrypted introductions." },
  { label: "SOCIALS", code: "T-05", body: "After-circuit lounges. Off the record." },
  { label: "CULTURAL CONSTELLATION", code: "T-06", body: "Music. Cinema. Light installations." },
  { label: "LEGACY", code: "T-07", body: "Alumni intelligence. Lifetime membership." },
];

export default function Timeline() {
  return (
    <section
      id="timeline"
      className="relative py-28 lg:py-40 px-4 sm:px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="flex items-end justify-between flex-wrap gap-4 mb-14">
        <div>
          <span className="classified-label text-[var(--atlas-gold)]">
            / 06 — DELEGATE EXPERIENCE
          </span>
          <h2
            className="font-display mt-3 text-white"
            style={{ fontSize: "clamp(48px, 6.5vw, 96px)", lineHeight: 0.9 }}
          >
            THE <span className="outlined">CIRCUIT.</span>
          </h2>
        </div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-white/55 max-w-[360px] leading-[1.8]">
          ◇ A LIVING TIMELINE. <br />
          ◇ ONE OPERATOR. ONE STORY ARC. <br />
          ◇ NO TWO DELEGATES EXIT THE SAME.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-[28px] sm:left-1/2 top-0 bottom-0 w-[1.5px] timeline-line" />
        <div className="space-y-10">
          {STAGES.map((s, i) => {
            const flip = i % 2 === 1;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7 }}
                className={`relative sm:grid sm:grid-cols-2 gap-10 items-center ${
                  flip ? "" : ""
                }`}
              >
                <div
                  className={`${
                    flip ? "sm:col-start-2 sm:text-left" : "sm:text-right"
                  } pl-16 sm:pl-0 sm:pr-12`}
                >
                  <p className="classified-label text-[var(--atlas-gold)]">
                    {s.code}
                  </p>
                  <h3
                    className="font-display text-white mt-1"
                    style={{ fontSize: "clamp(28px, 3.4vw, 44px)", lineHeight: 1 }}
                  >
                    {s.label}
                  </h3>
                  <p className="text-white/65 mt-2 leading-[1.7] max-w-[420px] sm:ml-auto">
                    {s.body}
                  </p>
                </div>
                <div
                  className={`${
                    flip ? "sm:col-start-1 sm:row-start-1" : ""
                  } hidden sm:block`}
                />
                <span
                  className="absolute left-[20px] sm:left-1/2 -translate-x-1/2 top-2 w-4 h-4 rounded-full glass-strong"
                  style={{ boxShadow: "0 0 18px var(--atlas-purple)" }}
                >
                  <span
                    className="absolute inset-[3px] rounded-full"
                    style={{ background: "var(--atlas-gold)" }}
                  />
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
