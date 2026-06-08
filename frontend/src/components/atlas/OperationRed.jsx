import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ATLAS } from "@/constants/testIds";

const FEED = [
  "› 03:42 UTC · INCOMING — UNVERIFIED SIGNAL · SECTOR 7",
  "› 03:43 UTC · COMM RELAY OPEN · PRIORITY ALPHA",
  "› 03:45 UTC · ASSET MOVEMENT DETECTED · GRID 5B-1B",
  "› 03:48 UTC · CIVILIAN CORRIDOR · STATUS DEGRADED",
  "› 03:51 UTC · DIPLOMATIC CHANNEL · STANDBY",
  "› 03:55 UTC · RESPONSE WINDOW · CLOSING",
  "› 03:58 UTC · COMMAND DECISION REQUIRED",
];

function Typewriter() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  useEffect(() => {
    let i = 0;
    const line = FEED[idx];
    const t = setInterval(() => {
      i++;
      setText(line.slice(0, i));
      if (i >= line.length) {
        clearInterval(t);
        setTimeout(() => {
          setIdx((p) => (p + 1) % FEED.length);
          setText("");
        }, 1600);
      }
    }, 22);
    return () => clearInterval(t);
  }, [idx]);
  return (
    <span className="cursor-blink font-mono text-[12px] tracking-[0.06em] text-[#FFB1B8]">
      {text}
    </span>
  );
}

const BULLETS = [
  "Real-time developments.",
  "Intelligence briefings.",
  "Diplomatic negotiations.",
  "Strategic command.",
];

const OUTCOMES = [
  "No fixed outcome.",
  "No scripted victory.",
  "Only decisions.",
  "Only consequences.",
];

export default function OperationRed() {
  return (
    <section
      id="operation-red"
      data-testid={ATLAS.operationRed}
      className="relative py-32 lg:py-44 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,0,32,0.18), transparent 60%), linear-gradient(180deg, #08000F 0%, #150003 50%, #08000F 100%)",
      }}
    >
      {/* Diagonal classified stripes */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background:
            "repeating-linear-gradient(135deg, rgba(255,59,92,0.18) 0 22px, transparent 22px 44px)",
          maskImage:
            "linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent)",
        }}
      />

      {/* Satellite grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <radialGradient id="sat" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF3B5C" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FF3B5C" stopOpacity="0" />
            </radialGradient>
          </defs>
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={"h" + i}
              x1="0"
              x2="800"
              y1={i * 50}
              y2={i * 50}
              stroke="#FF3B5C"
              strokeOpacity="0.08"
            />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line
              key={"v" + i}
              y1="0"
              y2="600"
              x1={i * 50}
              x2={i * 50}
              stroke="#FF3B5C"
              strokeOpacity="0.08"
            />
          ))}
          {[
            [180, 220, 90],
            [420, 380, 120],
            [620, 180, 70],
            [560, 460, 100],
          ].map(([cx, cy, r], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill="url(#sat)" />
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="#FF3B5C"
                strokeOpacity="0.5"
                strokeDasharray="3 6"
              >
                <animate attributeName="r" values={`${r * 0.6};${r};${r * 0.6}`} dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx={cx} cy={cy} r="2.5" fill="#FF3B5C" />
            </g>
          ))}
        </svg>
      </div>

      {/* Scan-line interference */}
      <motion.div
        className="absolute inset-x-0 h-[120px] pointer-events-none"
        animate={{ y: ["-10%", "110%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(255,59,92,0.16), transparent)",
        }}
      />

      {/* Rotating emergency beacon corners */}
      {["top-6 left-6", "top-6 right-6", "bottom-6 left-6", "bottom-6 right-6"].map((p, i) => (
        <div
          key={i}
          className={`absolute ${p} flex items-center gap-2 font-mono text-[10px] tracking-[0.26em] text-[#FF6680]`}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background: "#FF3B5C",
              boxShadow: "0 0 16px #FF3B5C",
              animation: "redpulse 1.2s ease-in-out infinite",
            }}
          />
          {["UPLINK · OK", "ENCRYPT · AES-256", "SECTOR · 7", "CLEARANCE · TOP"][i]}
        </div>
      ))}

      <div className="relative z-10 max-w-[1240px] mx-auto px-6 lg:px-10">
        {/* TOP BANNER */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{
                background: "#FF3B5C",
                boxShadow: "0 0 18px #FF3B5C",
                animation: "redpulse 1.2s ease-in-out infinite",
              }}
            />
            <span className="font-mono text-[11px] tracking-[0.32em] text-[#FF6680]">
              /// PRIORITY · ALPHA · RED-LINE OPEN
            </span>
          </div>
          <div className="font-mono text-[11px] tracking-[0.28em] text-[#FFB1B8]">
            FILE NO. 2A·004D · CONFIDENTIAL
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          {/* LEFT — Title & body */}
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.32em] text-[#FF3B5C] mb-5">
              <span className="px-2 py-0.5 border border-[#FF3B5C]/50 rounded-sm">
                TOP SECRET
              </span>
              <span className="px-2 py-0.5 bg-[#FF3B5C] text-black rounded-sm">
                CLASSIFIED ACCESS
              </span>
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: "clamp(60px, 9vw, 152px)",
                lineHeight: 0.84,
                color: "#FFE6E6",
                textShadow: "0 0 40px rgba(255,59,92,0.35)",
              }}
            >
              <span className="block">OPERATION</span>
              <span
                className="block"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "1.6px #FF3B5C",
                }}
              >
                RED.
              </span>
            </h2>

            <div className="mt-6 font-mono text-[11px] tracking-[0.28em] text-[#FF6680]">
              INTELLIGENCE · DEFENCE · CRISIS
            </div>

            <p className="mt-7 text-white/80 max-w-[560px] leading-[1.8] text-[15.5px]">
              A high-pressure strategic simulation designed around rapidly
              evolving geopolitical and humanitarian emergencies.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {BULLETS.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 font-mono text-[12px] tracking-[0.06em] text-white/85"
                >
                  <span className="text-[#FF3B5C]">▌</span> {b}
                </div>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {OUTCOMES.map((b) => (
                <div
                  key={b}
                  className="font-mono text-[12px] tracking-[0.06em] text-[#FFB1B8]"
                >
                  {b}
                </div>
              ))}
            </div>

            <p className="font-serif-italic mt-10 text-[#FF6680] text-[20px] leading-snug max-w-[560px]">
              “When the signal turns red, history belongs to those who act.”
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#access"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector('[data-testid="nav-request-access"]')
                    ?.click?.();
                }}
                data-testid={ATLAS.operationRedCta}
                className="inline-flex items-center gap-3 rounded-full px-6 py-3.5 font-mono text-[11px] tracking-[0.28em] uppercase"
                style={{
                  background: "linear-gradient(135deg, #FF3B5C, #A30020)",
                  color: "#0a0204",
                  border: "1px solid rgba(255,180,190,0.6)",
                  boxShadow: "0 18px 50px rgba(255,59,92,0.45)",
                }}
              >
                REQUEST CLEARANCE <span aria-hidden>↗</span>
              </a>
              <a
                href="#classified"
                className="inline-flex items-center gap-3 rounded-full px-6 py-3.5 font-mono text-[11px] tracking-[0.28em] uppercase border border-[#FF3B5C]/40 text-[#FFB1B8] hover:text-white hover:border-[#FF3B5C]"
              >
                VIEW DOSSIER →
              </a>
            </div>
          </div>

          {/* RIGHT — classified folder + live feed */}
          <div className="space-y-5">
            <div
              className="rounded-md p-5 relative"
              style={{
                background: "rgba(30,0,8,0.7)",
                border: "1px solid rgba(255,59,92,0.35)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] tracking-[0.28em] text-[#FFB1B8]">
                  // LIVE INTEL FEED
                </span>
                <span className="font-mono text-[10px] tracking-[0.28em] text-[#FF3B5C]">
                  CH-07
                </span>
              </div>
              <div className="min-h-[120px] font-mono text-[12px] leading-[1.9] text-[#FFB1B8]">
                <Typewriter />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[9.5px] tracking-[0.22em] text-white/60">
                <div className="bg-black/30 rounded-sm p-2">
                  <div className="text-[#FF6680]">SIGNAL</div>
                  <div className="text-white mt-0.5">97.2%</div>
                </div>
                <div className="bg-black/30 rounded-sm p-2">
                  <div className="text-[#FF6680]">LATENCY</div>
                  <div className="text-white mt-0.5">12 MS</div>
                </div>
                <div className="bg-black/30 rounded-sm p-2">
                  <div className="text-[#FF6680]">NODES</div>
                  <div className="text-white mt-0.5">41 / 41</div>
                </div>
              </div>
            </div>

            <div
              className="rounded-md p-5 relative overflow-hidden"
              style={{
                background: "rgba(30,0,8,0.5)",
                border: "1px solid rgba(255,59,92,0.25)",
              }}
            >
              <div className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.28em] text-[#FF3B5C]">
                ⟁ SEALED
              </div>
              <span className="font-mono text-[10px] tracking-[0.28em] text-[#FFB1B8]">
                FILE · 2A-004D
              </span>
              <h3 className="font-display text-white mt-2 text-2xl">
                DOSSIER · RED.A1
              </h3>
              <div className="mt-3 space-y-2 font-mono text-[11px] tracking-[0.04em] text-white/70">
                <div className="flex justify-between">
                  <span>Clearance</span>
                  <span className="text-[#FF6680]">TOP SECRET</span>
                </div>
                <div className="flex justify-between">
                  <span>Theatre</span>
                  <span className="text-white">UNDISCLOSED</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="text-white">CONTINUOUS</span>
                </div>
                <div className="flex justify-between">
                  <span>Briefing</span>
                  <span className="text-white">ON ENTRY ONLY</span>
                </div>
              </div>
              <div className="mt-4 h-[1px] bg-[#FF3B5C]/30" />
              <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 mt-3 leading-[1.7]">
                ◇ ROOM CONTENTS NOT DISCLOSED OFF-CIRCUIT. <br />
                ◇ ENTRY CONSTITUTES IMPLIED CONSENT.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {["RED-1", "RED-2", "RED-3", "RED-4"].map((c, i) => (
                <div
                  key={c}
                  className="rounded-sm p-3 font-mono text-[10px] tracking-[0.26em]"
                  style={{
                    background: i % 2 ? "rgba(255,59,92,0.1)" : "rgba(255,59,92,0.04)",
                    border: "1px dashed rgba(255,59,92,0.35)",
                  }}
                >
                  <div className="text-[#FF6680]">CELL {c}</div>
                  <div className="text-white/55 mt-1">
                    {["STANDBY", "ARMED", "LISTENING", "ENCRYPTED"][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes redpulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.7); opacity: 0.5; }
        }
      `}</style>
    </section>
  );
}
