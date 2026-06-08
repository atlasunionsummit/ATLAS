import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ATLAS } from "@/constants/testIds";

const NAV = [
  { label: "ECOSYSTEM", anchor: "#ecosystem", key: "ecosystem", testId: ATLAS.navEcosystem },
  { label: "COMMITTEES", anchor: "#committees", key: "committees", testId: ATLAS.navCommittees },
  { label: "SIGNATURE", anchor: "#signature", key: "signature", testId: ATLAS.navSignature },
  { label: "OPERATION RED", anchor: "#operation-red", key: "red", testId: ATLAS.navOperationRed, red: true },
  { label: "PASSPORT", anchor: "/passport", key: "passport", testId: ATLAS.navPassport, external: true },
  { label: "FAQ", anchor: "#faq", key: "faq", testId: ATLAS.navFaq },
];

export default function Navbar({
  onRequestAccess,
  onRequestDelegateLogin,
  delegateUser,
  onDelegateLogout,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      data-testid={ATLAS.navbar}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed top-4 left-0 right-0 z-[120] flex justify-center px-4 pointer-events-none"
    >
      <div
        className={`glass rounded-full pl-3 pr-1.5 py-1.5 flex items-center gap-1 pointer-events-auto max-w-[min(1150px,96vw)] transition-all ${
          scrolled ? "glow-purple" : ""
        }`}
      >
        <a href="#hero" data-testid={ATLAS.navAtlas} className="flex items-center gap-2 px-2 shrink-0">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{
              background: "var(--atlas-purple)",
              boxShadow: "0 0 12px var(--atlas-purple)",
            }}
          />
          <span className="font-display text-white text-[14px] tracking-[0.18em]">
            ATLAS
          </span>
        </a>

        {/* Desktop Menu */}
        <div className="hidden xl:flex items-center gap-0.5 mx-2">
          {NAV.map((n) =>
            n.external ? (
              <Link
                key={n.key}
                data-testid={n.testId}
                to={n.anchor}
                className="font-mono text-[10px] tracking-[0.22em] px-2.5 py-2 whitespace-nowrap text-white/70 hover:text-[var(--atlas-gold)] transition-colors"
              >
                {n.label}
              </Link>
            ) : (
              <a
                key={n.key}
                data-testid={n.testId}
                href={window.location.pathname === "/" ? n.anchor : `/${n.anchor}`}
                className={`font-mono text-[10px] tracking-[0.22em] px-2.5 py-2 whitespace-nowrap transition-colors ${
                  n.red
                    ? "text-[#FF6680] hover:text-[#FF3B5C]"
                    : "text-white/70 hover:text-[var(--atlas-gold)]"
                }`}
              >
                {n.red && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                    style={{
                      background: "#FF3B5C",
                      boxShadow: "0 0 10px #FF3B5C",
                      animation: "redpulse 1.2s ease-in-out infinite",
                    }}
                  />
                )}
                {n.label}
              </a>
            )
          )}
        </div>

        {/* Delegate Login / Access Action */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {delegateUser ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-mono text-[9px] tracking-wider text-[var(--atlas-cyan)] uppercase border border-[var(--atlas-cyan)]/35 rounded px-2 sm:px-2.5 py-1.5 bg-[var(--atlas-cyan)]/5 flex items-center gap-1">
                <span>👤</span>
                <span className="hidden sm:inline">{delegateUser.role === "admin" ? "ADMIN" : (delegateUser.nickname || delegateUser.full_name)}</span>
              </span>
              {delegateUser.role === "admin" ? (
                <Link
                  to="/admin"
                  className="font-mono text-[9.5px] text-[var(--atlas-gold)] hover:text-white px-2 sm:px-3 py-1.5 border border-[var(--atlas-gold)]/20 hover:border-white/20 rounded transition-all shrink-0"
                >
                  <span className="hidden sm:inline">ADMIN PANEL</span>
                  <span className="sm:hidden">ADMIN</span>
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="font-mono text-[9.5px] text-[var(--atlas-cyan)] hover:text-white px-2 sm:px-3 py-1.5 border border-[var(--atlas-cyan)]/20 hover:border-white/20 rounded transition-all shrink-0"
                >
                  <span className="hidden sm:inline">DASHBOARD</span>
                  <span className="sm:hidden">DASH</span>
                </Link>
              )}
              <button
                onClick={onDelegateLogout}
                className="btn-atlas !bg-red-500/10 hover:!bg-red-500/20 !border-red-500/35 !text-red-400 !py-1.5 !px-2 sm:!px-3 !text-[9.5px] shrink-0"
              >
                <span className="hidden sm:inline">LOGOUT</span>
                <span className="sm:hidden">OUT</span>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onRequestDelegateLogin}
                className="font-mono text-[9.5px] text-white/60 hover:text-white px-2 sm:px-3 py-1.5 border border-white/10 hover:border-white/20 rounded transition-all shrink-0"
              >
                SIGN IN
              </button>
              <button
                data-testid={ATLAS.navRequestAccess}
                onClick={onRequestAccess}
                className="btn-atlas !py-1.5 sm:!py-2 !px-2 sm:!px-3.5 !text-[9px] sm:!text-[10px] shrink-0"
              >
                <span className="hidden sm:inline">REQUEST ACCESS <span aria-hidden>→</span></span>
                <span className="sm:hidden">REQUEST <span aria-hidden>→</span></span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="xl:hidden ml-1 mr-1 w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-[var(--atlas-gold)]"
          aria-label="Menu"
        >
          <span className="font-mono text-base leading-none">{open ? "✕" : "≡"}</span>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="xl:hidden pointer-events-auto absolute top-16 left-4 right-4 glass-strong rounded-md py-3 px-2 flex flex-col"
        >
          {NAV.map((n) =>
            n.external ? (
              <Link
                key={n.key}
                data-testid={n.testId}
                to={n.anchor}
                onClick={() => setOpen(false)}
                className="font-mono text-[11px] tracking-[0.22em] px-3 py-2.5 text-white/80 hover:text-[var(--atlas-gold)]"
              >
                › {n.label}
              </Link>
            ) : (
              <a
                key={n.key}
                data-testid={n.testId}
                href={window.location.pathname === "/" ? n.anchor : `/${n.anchor}`}
                onClick={() => setOpen(false)}
                className={`font-mono text-[11px] tracking-[0.22em] px-3 py-2.5 ${
                  n.red ? "text-[#FF6680]" : "text-white/80 hover:text-[var(--atlas-gold)]"
                }`}
              >
                › {n.label}
              </a>
            )
          )}
        </motion.div>
      )}
    </motion.nav>
  );
}
