import { motion } from "framer-motion";
import { ATLAS } from "@/constants/testIds";

const ITEMS = [
  {
    key: "f1",
    icon: "🏎️",
    title: "FORMULA 1 STRATEGY SUMMIT",
    tags: ["MOTORSPORT", "CAPITAL", "STRATEGY"],
    intro:
      "A closed strategic environment inspired by the modern Formula One paddock.",
    bullets: [
      "Team Principals.",
      "Commercial Negotiations.",
      "Race Strategy.",
      "Regulatory Politics.",
      "Simulator Experiences.",
      "F1 Experts.",
    ],
    quote: "Championships are engineered before race day.",
    badge: "LIMITED ACCESS",
    accent: "#FF3B5C",
  },
  {
    key: "ipl",
    icon: "🏏",
    title: "IPL AUCTION",
    tags: ["SPORT", "BUSINESS", "NEGOTIATION"],
    intro: "A live franchise ecosystem where strategy meets capital.",
    bullets: [
      "Budget Management.",
      "Player Drafting.",
      "Live Bidding.",
      "Contract Negotiation.",
      "Team Building.",
    ],
    quote: "Every bid changes history.",
    badge: "LIMITED ACCESS",
    accent: "#C9A44C",
  },
  {
    key: "vaidya",
    icon: "🩺",
    title: "VAIDYA COUNCIL",
    tags: ["HEALTHCARE", "INNOVATION", "POLICY"],
    intro: "A next-generation healthcare committee.",
    bullets: [
      "Medical Innovation.",
      "Health Technology.",
      "Public Health.",
      "VR Experiences.",
      "Expert Interactions.",
      "Traditional & Modern Medicine.",
    ],
    quote:
      "The future of medicine belongs to those willing to redesign it.",
    badge: "LIMITED ACCESS",
    accent: "#4DFFE9",
  },
  {
    key: "founders",
    icon: "🎙️",
    title: "FOUNDERS' PRESS MEET",
    tags: ["ENTREPRENEURSHIP", "LEADERSHIP", "MEDIA"],
    intro:
      "A direct interaction platform connecting delegates with builders, founders and innovators.",
    bullets: ["Question.", "Challenge.", "Learn.", "Network."],
    quote: "Ideas become movements when someone chooses to build them.",
    accent: "#B98CFF",
  },
  {
    key: "constellation",
    icon: "🌌",
    title: "CULTURAL CONSTELLATION",
    tags: ["MUSIC", "ART", "CINEMA", "COMMUNITY"],
    intro: "The cultural heartbeat of Atlas.",
    bullets: [
      "Performances.",
      "Creative Expression.",
      "Fashion.",
      "Storytelling.",
      "Late-Circuit Experiences.",
    ],
    quote: "Every civilization leaves behind a story.",
    accent: "#FF4DD2",
  },
];

export default function SignatureCollection() {
  return (
    <section
      id="signature"
      className="relative py-28 lg:py-40 px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="flex items-end justify-between flex-wrap gap-4 mb-14">
        <div>
          <span className="classified-label text-[var(--atlas-gold)]">
            / 03 — SIGNATURE CIRCUITS
          </span>
          <h2
            className="font-display mt-3 text-white"
            style={{ fontSize: "clamp(48px, 6.5vw, 96px)", lineHeight: 0.9 }}
          >
            THE <br /> ATLAS <br /> SIGNATURE <br />
            <span className="outlined">COLLECTION.</span>
          </h2>
        </div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-white/65 max-w-[360px] leading-[1.9]">
          ◇ NOT SIDE EVENTS. <br />
          ◇ NOT EXTRAS. <br />
          ◇ BUILT AS IMMERSIVE FLAGSHIP EXPERIENCES. <br />
          ◇ LIMITED ACCESS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ITEMS.map((it, i) => (
          <motion.article
            key={it.key}
            data-testid={ATLAS.signature(it.key)}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: (i % 2) * 0.07 }}
            className="relative glass-strong rounded-md p-7 lg:p-9 overflow-hidden group transition-all hover:translate-y-[-4px]"
            style={{
              borderColor: "rgba(245,241,255,0.1)",
            }}
          >
            <div
              className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${it.accent}, transparent 70%)`,
                filter: "blur(28px)",
              }}
            />
            <div className="flex items-center justify-between mb-6">
              <span className="text-3xl" aria-hidden>
                {it.icon}
              </span>
              {it.badge && (
                <span
                  className="font-mono text-[9.5px] tracking-[0.28em] px-2.5 py-1 rounded-full"
                  style={{
                    color: it.accent,
                    border: `1px solid ${it.accent}55`,
                    background: `${it.accent}10`,
                  }}
                >
                  {it.badge}
                </span>
              )}
            </div>

            <h3
              className="font-display text-white"
              style={{ fontSize: "clamp(26px, 3.2vw, 40px)", lineHeight: 0.98 }}
            >
              {it.title}
            </h3>
            <div className="mt-2 font-mono text-[10.5px] tracking-[0.24em] text-[var(--atlas-gold)]">
              {it.tags.join(" • ")}
            </div>

            <p className="mt-6 text-white/75 leading-[1.75] text-[15px]">
              {it.intro}
            </p>

            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[11.5px] tracking-[0.06em] text-white/75">
              {it.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span
                    className="mt-1.5 inline-block w-1 h-1 rounded-full shrink-0"
                    style={{ background: it.accent }}
                  />
                  {b}
                </li>
              ))}
            </ul>

            <p className="font-serif-italic mt-7 text-[var(--atlas-gold)] text-[18px] leading-snug">
              “{it.quote}”
            </p>

            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
              <span className="font-mono text-[10px] tracking-[0.28em] text-white/45">
                CIRCUIT · 2026
              </span>
              <button
                className="font-mono text-[11px] tracking-[0.28em] text-white group-hover:text-[var(--atlas-gold)] transition-colors"
                data-testid={ATLAS.signatureEnter(it.key)}
              >
                ENTER →
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
