import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ATLAS } from "@/constants/testIds";
import { unlockClassified } from "@/lib/atlasApi";
import { toast } from "sonner";

const LOCKED = [
  { key: "collab", title: "MAJOR COLLABORATION" },
  { key: "intl", title: "INTERNATIONAL EXPERIENCE" },
  { key: "innovation", title: "INNOVATION ZONE" },
  { key: "premium", title: "PREMIUM OPPORTUNITY" },
  { key: "classified", title: "CLASSIFIED REVEAL" },
];

export default function ClassifiedArchives() {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!code.trim()) {
      toast.error("ENTER CIPHER", { description: "All zones remain locked." });
      return;
    }
    setLoading(true);
    try {
      const r = await unlockClassified(code.trim());
      if (r.unlocked) {
        setUnlocked(r.reveals);
        toast.success("ACCESS GRANTED", {
          description: "Classified zones now visible.",
        });
      }
    } catch (e) {
      toast.error("INVALID CIPHER", { description: "Try again, operator." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="classified"
      className="relative py-28 lg:py-36 px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <span className="classified-label text-[var(--atlas-gold)]">
            / 05 — CLASSIFIED ARCHIVES
          </span>
          <h2
            className="font-display mt-3 text-white"
            style={{ fontSize: "clamp(40px, 5.5vw, 80px)", lineHeight: 0.92 }}
          >
            LOCKED. <span className="outlined">WAITING.</span>
          </h2>
          <p className="text-white/60 mt-3 max-w-[460px] leading-[1.7]">
            Access unlocking soon. Operators in possession of the cipher may
            decrypt the dossier early.
          </p>
        </div>

        <div className="glass-strong rounded-full flex items-center pl-4 pr-1 py-1 gap-2">
          <span className="font-mono text-[10px] tracking-[0.26em] text-white/55">
            CIPHER
          </span>
          <input
            data-testid={ATLAS.unlockInput}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="• • • •"
            className="bg-transparent outline-none w-28 font-mono tracking-[0.4em] text-center text-[var(--atlas-gold)] placeholder:text-white/20"
          />
          <button
            data-testid={ATLAS.unlockSubmit}
            onClick={submit}
            disabled={loading}
            className="btn-atlas !py-2 !px-4 !text-[10.5px]"
          >
            {loading ? "DECRYPTING…" : "DECRYPT"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {LOCKED.map((l, i) => {
          const open = unlocked?.[i];
          return (
            <motion.div
              key={l.key}
              data-testid={ATLAS.lockedCard(l.key)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className={`${
                open ? "glass-strong" : "locked-card"
              } rounded-md p-5 min-h-[210px] flex flex-col justify-between relative overflow-hidden`}
            >
              <AnimatePresence mode="wait">
                {open ? (
                  <motion.div
                    key="open"
                    data-testid={ATLAS.unlockedReveal}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  >
                    <span className="classified-label text-[var(--atlas-cyan)]">
                      ◇ DECRYPTED
                    </span>
                    <h4
                      className="font-display text-white mt-2"
                      style={{ fontSize: "20px", lineHeight: 1 }}
                    >
                      {open.title}
                    </h4>
                    <p className="font-mono text-[10px] tracking-[0.22em] text-[var(--atlas-gold)] mt-1">
                      {open.subtitle.toUpperCase()}
                    </p>
                    <p className="text-white/70 text-[13px] leading-[1.6] mt-4">
                      {open.body}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="locked"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-[var(--atlas-gold)] text-xl">⟁</span>
                    <h4
                      className="font-display mt-3 text-white/85"
                      style={{ fontSize: "20px", lineHeight: 1 }}
                    >
                      🔒 {l.title}
                    </h4>
                    <p className="font-mono text-[10px] tracking-[0.22em] text-white/55 mt-3">
                      ACCESS UNLOCKING SOON
                    </p>
                    <p className="font-mono text-[10px] tracking-[0.2em] text-white/30 mt-6">
                      CIPHER REQUIRED
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
