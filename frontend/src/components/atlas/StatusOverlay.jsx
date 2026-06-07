import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { networkStats } from "@/lib/atlasApi";

export default function StatusOverlay() {
  const [time, setTime] = useState("");
  const [stats, setStats] = useState({
    operators: 2412,
    encrypted_nodes: 41,
    network_status: "LIVE",
  });

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const utc =
        String(d.getUTCHours()).padStart(2, "0") +
        ":" +
        String(d.getUTCMinutes()).padStart(2, "0") +
        ":" +
        String(d.getUTCSeconds()).padStart(2, "0");
      setTime(utc);
    };
    tick();
    const id = setInterval(tick, 1000);
    networkStats()
      .then(setStats)
      .catch(() => {});
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Left vertical rail */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-[90] hidden lg:flex flex-col items-center gap-3 classified-label"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg) translateY(-50%)" }}
      >
        <span>ATLAS // SECURE CHANNEL</span>
        <span className="text-[var(--atlas-gold)]">CLEARANCE · ELITE</span>
        <span>NIC · 8500</span>
      </motion.div>

      {/* Right vertical rail */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-[90] hidden lg:flex flex-col items-center gap-3 classified-label"
        style={{ writingMode: "vertical-rl" }}
      >
        <span>UTC · {time}</span>
        <span className="text-[var(--atlas-gold)]">
          NODES {stats.encrypted_nodes}
        </span>
        <span>{stats.network_status}</span>
      </motion.div>

      {/* Bottom ticker */}
      <div className="fixed bottom-0 left-0 right-0 z-[80] border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="marquee-wrap py-2">
          <div className="ticker-track flex gap-12 whitespace-nowrap font-mono text-[10.5px] tracking-[0.28em] text-white/55">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex gap-12">
                <span>◇ ATLAS UNION SUMMIT · 2026</span>
                <span>◇ DELHI CIRCUIT · OPERATIONS LIVE</span>
                <span>◇ विश्वम् एक मंचम् — WHERE DIPLOMACY MEETS INNOVATION</span>
                <span>◇ AUVREO INTERNATIONAL · MSME · NIC 8500</span>
                <span>◇ OPERATORS ONLINE · {stats.operators?.toLocaleString?.() ?? stats.operators}</span>
                <span>◇ ENCRYPTED NODES · {stats.encrypted_nodes}</span>
                <span>◇ CLEARANCE LEVEL · ELITE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
