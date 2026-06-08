import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ATLAS } from "@/constants/testIds";

const Q = [
  {
    q: "Is Atlas a Model UN?",
    a: "No. Atlas is a multi-disciplinary diplomacy and innovation circuit. MUN is one of seven languages we speak.",
  },
  {
    q: "Who is the delegate Atlas is built for?",
    a: "Operators. Future-leaders in policy, capital, technology, sport and culture. We index for ambition, not titles.",
  },
  {
    q: "Where and when does it run?",
    a: "Delhi Circuit · 2026. Full schedule and venue manifest will be revealed phase by phase.",
  },
  {
    q: "How do I get in?",
    a: "Use REQUEST ACCESS. Atlas reviews every operator manually. Passports are issued only after verification.",
  },
  {
    q: "Are partners and brands disclosed?",
    a: "No. Atlas reveals collaborations in waves. The mystery is part of the operation.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section
      id="faq"
      className="relative py-28 lg:py-40 px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="grid lg:grid-cols-[0.6fr_1.4fr] gap-12">
        <div className="lg:sticky lg:top-32 self-start">
          <span className="classified-label text-[var(--atlas-gold)]">
            / 08 — FAQ
          </span>
          <h2
            className="font-display mt-3 text-white"
            style={{ fontSize: "clamp(40px, 5.5vw, 80px)", lineHeight: 0.95 }}
          >
            FREQUENTLY <br />
            <span className="outlined">DECLASSIFIED.</span>
          </h2>
        </div>
        <div>
          {Q.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                data-testid={ATLAS.faqItem(i)}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="border-b border-white/10"
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full text-left py-6 flex items-start gap-4 sm:gap-6"
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--atlas-gold)] pt-2">
                    0{i + 1}
                  </span>
                  <span
                    className="flex-1 font-display text-white"
                    style={{ fontSize: "clamp(22px, 2.6vw, 32px)", lineHeight: 1.15 }}
                  >
                    {item.q}
                  </span>
                  <span
                    className={`font-mono text-xl text-white/55 transition-transform ${
                      isOpen ? "rotate-45 text-[var(--atlas-gold)]" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-7 pl-[42px] sm:pl-[58px] pr-4 sm:pr-10 text-white/70 leading-[1.8] max-w-[640px]">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
