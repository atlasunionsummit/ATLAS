import { motion } from "framer-motion";

export default function ClassifiedArchives() {
  return (
    <section
      id="classified"
      className="relative py-28 lg:py-36 px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="flex flex-col items-center text-center mb-16">
        <span className="classified-label text-[var(--atlas-gold)]">
          / 05 — ATLAS PLUS
        </span>
        <h2
          className="font-display mt-3 text-white"
          style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.95 }}
        >
          THE PREMIUM <span className="outlined">EXPERIENCE.</span>
        </h2>
        <p className="text-white/75 mt-6 max-w-2xl leading-[1.8] text-sm md:text-base">
          Atlas Plus is our exclusive all-access experience, designed for participants who wish to explore every aspect of the Atlas ecosystem beyond the committee room. It is not simply a delegate pass. It is your gateway to diplomacy, culture, entertainment, networking and premium experiences—all on one stage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-strong rounded-md p-8 lg:p-10 relative overflow-hidden"
        >
          <div className="text-4xl mb-6">🏛️</div>
          <h3 className="font-display text-white text-2xl tracking-wider mb-6">PREMIUM CONFERENCE EXPERIENCE</h3>
          <ul className="space-y-6">
            <li>
              <h4 className="text-[var(--atlas-gold)] font-mono text-xs tracking-widest uppercase mb-2">Premium Atlas Accreditation</h4>
              <p className="text-white/60 text-sm leading-relaxed">Receive an exclusive Atlas Plus identity badge and accreditation.</p>
            </li>
            <li>
              <h4 className="text-[var(--atlas-gold)] font-mono text-xs tracking-widest uppercase mb-2">Branded Atlas Passport</h4>
              <p className="text-white/60 text-sm leading-relaxed">A specially designed premium Atlas Passport, created as both a conference companion and a collectible memory.</p>
            </li>
            <li>
              <h4 className="text-[var(--atlas-gold)] font-mono text-xs tracking-widest uppercase mb-2">Priority Check-in</h4>
              <p className="text-white/60 text-sm leading-relaxed">Dedicated registration and fast-track entry for a seamless arrival experience.</p>
            </li>
            <li>
              <h4 className="text-[var(--atlas-gold)] font-mono text-xs tracking-widest uppercase mb-2">Priority Assistance</h4>
              <p className="text-white/60 text-sm leading-relaxed">Dedicated support throughout the summit.</p>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-strong rounded-md p-8 lg:p-10 relative overflow-hidden flex flex-col"
        >
          <div className="text-4xl mb-6">🛋️</div>
          <h3 className="font-display text-white text-2xl tracking-wider mb-6">ATLAS DELEGATE LOUNGE</h3>
          <p className="text-white/75 text-sm leading-[1.8] mb-8">
            Atlas Plus members receive access to the exclusive Delegate Lounge. A dedicated space to unwind, connect, and prepare for your next committee session.
          </p>
          
          <div className="bg-black/30 border border-white/5 rounded-md p-6 flex-grow">
            <h4 className="font-mono text-xs text-[var(--atlas-cyan)] tracking-widest uppercase mb-4">Lounge Features Include:</h4>
            <ul className="space-y-4 font-mono text-xs text-white/70 tracking-wide">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--atlas-gold)]" />
                Fully Air-Conditioned Environment
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--atlas-gold)]" />
                Comfortable Seating Areas
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--atlas-gold)]" />
                Networking Spaces
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--atlas-gold)]" />
                Gaming & Interactive Zones
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
