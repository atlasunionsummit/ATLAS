/**
 * Cinematic SVG/CSS Delhi Skyline — purple wireframe city, India Gate arch,
 * slow rotation, floating data rings, drifting particles.
 *
 * No WebGL dependency (visual-edits babel plugin conflicts with R3F primitives).
 */
import { useMemo } from "react";

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Buildings({ rng, count, w, h, y, opacity, color }) {
  const items = useMemo(() => {
    const arr = [];
    let x = 0;
    while (x < w) {
      const bw = 16 + rng() * 36;
      const bh = 30 + Math.pow(rng(), 1.6) * h;
      arr.push({ x, w: bw, h: bh });
      x += bw + 2;
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <g opacity={opacity}>
      {items.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${y - b.h})`}>
          {/* outline */}
          <rect
            x="0.5"
            y="0.5"
            width={b.w - 1}
            height={b.h - 1}
            fill="none"
            stroke={color}
            strokeWidth="0.7"
          />
          {/* windows */}
          {Array.from({ length: Math.floor(b.h / 9) }).map((_, ri) => (
            <line
              key={ri}
              x1="2"
              x2={b.w - 2}
              y1={6 + ri * 9}
              y2={6 + ri * 9}
              stroke={color}
              strokeWidth="0.4"
              opacity="0.25"
            />
          ))}
          {/* antenna on some */}
          {i % 4 === 0 && (
            <line
              x1={b.w / 2}
              y1="0"
              x2={b.w / 2}
              y2="-10"
              stroke="#C9A44C"
              strokeWidth="0.6"
            />
          )}
        </g>
      ))}
    </g>
  );
}

function IndiaGate({ cx, baseY }) {
  // Stylized arch + columns
  const w = 110;
  const h = 90;
  const top = baseY - h;
  return (
    <g>
      <path
        d={`M ${cx - w / 2} ${baseY} L ${cx - w / 2} ${top + 22} Q ${cx} ${top - 14} ${cx + w / 2} ${top + 22} L ${cx + w / 2} ${baseY}`}
        fill="none"
        stroke="#C9A44C"
        strokeWidth="1.2"
      />
      <line x1={cx - w / 2} y1={baseY} x2={cx - w / 2 + 14} y2={top + 28} stroke="#C9A44C" strokeWidth="0.6" />
      <line x1={cx + w / 2} y1={baseY} x2={cx + w / 2 - 14} y2={top + 28} stroke="#C9A44C" strokeWidth="0.6" />
      <circle cx={cx} cy={top + 4} r="3" fill="#C9A44C" />
    </g>
  );
}

export default function DelhiSkylineSVG() {
  const rngs = useMemo(
    () => ({
      far: mulberry32(11),
      mid: mulberry32(31),
      near: mulberry32(71),
    }),
    []
  );
  const W = 1600;
  const H = 700;
  const ground = 540;

  // particle dots
  const particles = useMemo(() => {
    const rng = mulberry32(99);
    return Array.from({ length: 80 }).map(() => ({
      x: rng() * W,
      y: rng() * (H - 120),
      r: 0.6 + rng() * 1.4,
      delay: rng() * 8,
      dur: 6 + rng() * 8,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Slow rotating data rings (CSS) */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "55%",
          width: "min(110vmax, 1300px)",
          height: "min(110vmax, 1300px)",
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              border: `1px solid ${["#C9A44C55", "#5B1BFF66", "#4DFFE940"][i]}`,
              transform: `rotate(${i * 12}deg) scale(${1 - i * 0.18})`,
              animation: `atlas-ring-${i} ${24 + i * 6}s linear infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes atlas-ring-0 { from {transform: rotate(0deg) scale(1);} to {transform: rotate(360deg) scale(1);} }
          @keyframes atlas-ring-1 { from {transform: rotate(20deg) scale(0.82);} to {transform: rotate(-340deg) scale(0.82);} }
          @keyframes atlas-ring-2 { from {transform: rotate(-30deg) scale(0.65);} to {transform: rotate(330deg) scale(0.65);} }
        `}</style>
      </div>

      {/* SVG cityscape */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-x-0 bottom-0 w-full"
        style={{ height: "70%" }}
        preserveAspectRatio="xMidYMax slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#08000F" stopOpacity="0" />
            <stop offset="70%" stopColor="#08000F" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#08000F" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="floorline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C9A44C" stopOpacity="0" />
            <stop offset="50%" stopColor="#C9A44C" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#C9A44C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* far layer */}
        <g style={{ animation: "skyline-far 90s linear infinite" }}>
          <Buildings
            rng={rngs.far}
            count={42}
            w={W * 2}
            h={120}
            y={ground - 20}
            opacity={0.35}
            color="#5B1BFF"
          />
        </g>

        {/* mid layer */}
        <g style={{ animation: "skyline-mid 70s linear infinite" }}>
          <Buildings
            rng={rngs.mid}
            count={38}
            w={W * 2}
            h={180}
            y={ground - 4}
            opacity={0.6}
            color="#7B3BFF"
          />
        </g>

        {/* India Gate as anchor */}
        <IndiaGate cx={W / 2} baseY={ground - 4} />

        {/* near layer */}
        <g style={{ animation: "skyline-near 50s linear infinite" }}>
          <Buildings
            rng={rngs.near}
            count={32}
            w={W * 2}
            h={240}
            y={ground + 12}
            opacity={0.85}
            color="#B98CFF"
          />
        </g>

        {/* ground line */}
        <line x1="0" y1={ground + 12} x2={W} y2={ground + 12} stroke="url(#floorline)" strokeWidth="1.2" />
        <line x1="0" y1={ground + 18} x2={W} y2={ground + 18} stroke="#5B1BFF" strokeOpacity="0.25" strokeWidth="0.6" />

        {/* haze fade */}
        <rect x="0" y="0" width={W} height={H} fill="url(#haze)" />

        {/* particles */}
        {particles.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill="#4DFFE9"
            opacity="0.6"
            style={{
              animation: `atlas-particle ${p.dur}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}

        <style>{`
          @keyframes skyline-far { from { transform: translateX(0); } to { transform: translateX(-${W}px); } }
          @keyframes skyline-mid { from { transform: translateX(0); } to { transform: translateX(-${W}px); } }
          @keyframes skyline-near { from { transform: translateX(0); } to { transform: translateX(-${W}px); } }
          @keyframes atlas-particle {
            0%, 100% { opacity: 0.15; transform: translateY(0); }
            50% { opacity: 0.9; transform: translateY(-14px); }
          }
        `}</style>
      </svg>

      {/* corner targeting reticles */}
      <div className="absolute top-6 left-6 w-10 h-10 pointer-events-none">
        <div className="absolute left-0 top-0 w-3 h-[1px] bg-[var(--atlas-gold)]" />
        <div className="absolute left-0 top-0 h-3 w-[1px] bg-[var(--atlas-gold)]" />
      </div>
      <div className="absolute top-6 right-6 w-10 h-10 pointer-events-none">
        <div className="absolute right-0 top-0 w-3 h-[1px] bg-[var(--atlas-gold)]" />
        <div className="absolute right-0 top-0 h-3 w-[1px] bg-[var(--atlas-gold)]" />
      </div>
    </div>
  );
}
