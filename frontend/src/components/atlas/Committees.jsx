import { motion } from "framer-motion";
import { ATLAS } from "@/constants/testIds";
import { COMMITTEE_GUARDIAN } from "@/lib/atlasAssets";

const COMMITTEES = [
  {
    key: "unsc",
    name: "UNSC",
    theme: "War Room",
    level: "Advanced",
    atmosphere: "Tactical · Satellite Maps · Red Light",
    quote: "Power is exercised in silence.",
    image: COMMITTEE_GUARDIAN.unsc,
    accent: "#FF3B5C",
    tag: "CLASSIFIED · LEVEL V",
  },
  {
    key: "unga",
    name: "UNGA",
    theme: "Global Assembly",
    level: "Intermediate",
    atmosphere: "Diplomatic Lighting · World Map",
    quote: "Every word becomes geopolitics.",
    image: COMMITTEE_GUARDIAN.unga,
    accent: "#C9A44C",
    tag: "ASSEMBLY · OPEN",
  },
  {
    key: "aippm",
    name: "AIPPM",
    theme: "Indian Parliament",
    level: "Intermediate",
    atmosphere: "Media Cameras · Election Graphics",
    quote: "Democracy is a performance art.",
    image: COMMITTEE_GUARDIAN.aippm,
    accent: "#FF8A3D",
    tag: "DOMESTIC · LIVE FEED",
  },
  {
    key: "uncsw",
    name: "UNCSW",
    theme: "Justice & Human Rights",
    level: "Intermediate",
    atmosphere: "Elegant · Editorial Light",
    quote: "Equity is not a question.",
    image: COMMITTEE_GUARDIAN.uncsw,
    accent: "#B98CFF",
    tag: "JURIDICAL",
  },
  {
    key: "unfccc",
    name: "UNFCCC",
    theme: "Climate Technology",
    level: "Advanced",
    atmosphere: "Future Earth · Scientific Visuals",
    quote: "We negotiate with time itself.",
    image: COMMITTEE_GUARDIAN.unfccc,
    accent: "#4DFFE9",
    tag: "EARTH · OPERATIONS",
  },
  {
    key: "coachella",
    name: "COACHELLA",
    theme: "Culture, Media & Entertainment",
    level: "Beginner",
    atmosphere: "Neon · Backstage · Press",
    quote: "Where attention becomes power.",
    image: COMMITTEE_GUARDIAN.coachella,
    accent: "#FF4DD2",
    tag: "CULTURE · NEON",
  },
  {
    key: "ip",
    name: "INTERNATIONAL PRESS",
    theme: "Photography & Journalism",
    level: "Open",
    atmosphere: "Editorial · Newsroom · Field",
    quote: "Bear witness. Then write the world.",
    image: COMMITTEE_GUARDIAN.ip,
    accent: "#C9A44C",
    tag: "PRESS · 24/7",
  },
];

export default function Committees() {
  return (
    <section
      id="committees"
      className="relative py-28 lg:py-40 px-4 sm:px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
        <div>
          <span className="classified-label text-[var(--atlas-gold)]">
            / 02 — COMMITTEES
          </span>
          <h2
            className="font-display mt-3 text-white"
            style={{ fontSize: "clamp(48px, 6.5vw, 96px)", lineHeight: 0.9 }}
          >
            SEVEN <br />
            <span className="outlined">CIRCUITS.</span>
          </h2>
        </div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-white/55 max-w-[360px] leading-[1.8]">
          ◇ EACH COMMITTEE IS AN AESTHETIC. <br />
          ◇ EACH ROOM IS A DIFFERENT OPERATING SYSTEM. <br />
          ◇ HOVER TO ENTER.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {COMMITTEES.map((c, i) => (
          <motion.article
            key={c.key}
            data-testid={ATLAS.committee(c.key)}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: (i % 3) * 0.06 }}
            className="cmt-card relative glass rounded-md overflow-hidden h-[440px] flex flex-col"
          >
            <div className="relative h-[60%] overflow-hidden">
              <img
                src={c.image}
                alt={c.name}
                className="cmt-image w-full h-full object-cover object-center opacity-95"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, transparent 40%, var(--atlas-black) 100%), radial-gradient(circle at 50% 30%, ${c.accent}33, transparent 65%)`,
                }}
              />
              <div className="absolute top-3 left-3 right-3 flex justify-between font-mono text-[9.5px] tracking-[0.3em] text-white/80">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: c.accent, boxShadow: `0 0 10px ${c.accent}` }}
                  />
                  {c.tag}
                </span>
                <span className="text-[var(--atlas-gold)]">{c.level}</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h3
                  className="font-display text-white"
                  style={{ fontSize: "clamp(28px, 3vw, 40px)", lineHeight: 0.95 }}
                >
                  {c.name}
                </h3>
                <p className="font-mono text-[10.5px] tracking-[0.24em] text-white/75 mt-1">
                  {c.theme.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-between">
              <p className="font-serif-italic text-[var(--atlas-gold)] text-[16px] leading-snug">
                “{c.quote}”
              </p>
              <div className="flex items-end justify-between gap-3 mt-4">
                <p className="font-mono text-[10px] tracking-[0.22em] text-white/55 leading-[1.7]">
                  {c.atmosphere}
                </p>
              </div>
            </div>

            {/* Corner marks */}
            {["top-2 left-2","top-2 right-2","bottom-2 left-2","bottom-2 right-2"].map((p,k)=>(
              <span
                key={k}
                className={`absolute ${p} w-2.5 h-2.5 pointer-events-none`}
                style={{
                  borderColor: c.accent,
                  borderTopWidth: p.includes("top") ? 1 : 0,
                  borderBottomWidth: p.includes("bottom") ? 1 : 0,
                  borderLeftWidth: p.includes("left") ? 1 : 0,
                  borderRightWidth: p.includes("right") ? 1 : 0,
                  borderStyle: "solid",
                }}
              />
            ))}
          </motion.article>
        ))}
      </div>
    </section>
  );
}
