import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ATLAS } from "@/constants/testIds";
import { generatePassport, saveGuestPassport } from "@/lib/atlasApi";
import { toast } from "sonner";
import { ATLAS_LOGO_CLEAN } from "@/lib/atlasAssets";

const COMMITTEES = [
  "UNCSW",
  "UNGA",
  "UNSC",
  "IPL",
  "IP",
  "COACHELLA",
  "F1",
];

export default function Passport({ delegateUser }) {
  const wrapRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start end", "end start"],
  });
  const rotY = useTransform(scrollYProgress, [0, 0.5, 1], [-22, 0, 22]);
  const rotX = useTransform(scrollYProgress, [0, 1], [8, -8]);

  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("INDIA");
  const [committee, setCommittee] = useState(COMMITTEES[3]);
  const [passport, setPassport] = useState({
    delegate_name: "OPERATOR NAME",
    delegate_id: "AUS-XXXX-2026",
    nationality: "INTERNATIONAL",
    committee: "UNCLASSIFIED",
    clearance: "ELITE",
    issued: "DEC 2025",
    expires: "31 DEC 2026",
    seal: "5B1B2A004D08",
    status: "APPROVED",
    qr_url:
      "https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=08000F&color=C9A44C&data=AUS::SAMPLE::ATLAS",
    signature: "AUS/2026",
  });
  const [loading, setLoading] = useState(false);
  const [showRegisterPromo, setShowRegisterPromo] = useState(false);

  useEffect(() => {
    if (delegateUser) {
      setPassport({
        delegate_name: delegateUser.full_name,
        delegate_id: delegateUser.id,
        nationality: delegateUser.country,
        committee: delegateUser.committee,
        clearance: "ELITE",
        issued: "OCT 2026",
        expires: "31 DEC 2026",
        seal: delegateUser.utr_number || "5B1B2A004D08",
        status: "APPROVED",
        qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=08000F&color=C9A44C&data=https://atlasunionsummit.com/p/${delegateUser.id}`,
        signature: "AUS/2026",
      });
      setShowRegisterPromo(false);
    } else {
      const guest = localStorage.getItem("aus_guest_passport");
      if (guest) {
        try {
          const parsed = JSON.parse(guest);
          setPassport(parsed);
          setName(parsed.delegate_name || "");
          setNationality(parsed.nationality || "INDIA");
          setCommittee(parsed.committee || COMMITTEES[3]);
          setShowRegisterPromo(true);
        } catch {
          localStorage.removeItem("aus_guest_passport");
        }
      } else {
        setPassport({
          delegate_name: "OPERATOR NAME",
          delegate_id: "AUS-XXXX-2026",
          nationality: "INTERNATIONAL",
          committee: "UNCLASSIFIED",
          clearance: "ELITE",
          issued: "DEC 2025",
          expires: "31 DEC 2026",
          seal: "5B1B2A004D08",
          status: "APPROVED",
          qr_url:
            "https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=08000F&color=C9A44C&data=AUS::SAMPLE::ATLAS",
          signature: "AUS/2026",
        });
        setShowRegisterPromo(false);
      }
    }
  }, [delegateUser]);

  const generate = async () => {
    if (!name.trim()) {
      toast.error("DELEGATE NAME REQUIRED");
      return;
    }
    if (!nationality.trim()) {
      toast.error("NATIONALITY REQUIRED");
      return;
    }
    setLoading(true);
    try {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const guestPassport = {
        delegate_name: name,
        delegate_id: `AUS-${randNum}-GUEST`,
        nationality: nationality.trim().toUpperCase(),
        committee: committee,
        clearance: "GUEST / NONE",
        issued: "DEC 2025",
        expires: "31 DEC 2026",
        seal: "UNVERIFIED",
        status: "USELESS",
        qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=08000F&color=C9A44C&data=https://atlasunionsummit.com/p/AUS-${randNum}-GUEST`,
        signature: "GUEST/AUS",
      };

      await saveGuestPassport(guestPassport);
      localStorage.setItem("aus_guest_passport", JSON.stringify(guestPassport));
      setPassport(guestPassport);
      setShowRegisterPromo(true);

      toast.success("GUEST PASS GENERATED", {
        description: "Status is useless (unverified). Register for summit access.",
      });
    } catch (e) {
      toast.error("ISSUANCE FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="passport"
      ref={wrapRef}
      className="relative py-28 lg:py-40 px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="grid lg:grid-cols-[1fr_1fr] gap-12 items-center">
        <div>
          <span className="classified-label text-[var(--atlas-gold)]">
            / 05 — IDENTITY
          </span>
          <h2
            className="font-display mt-3 text-white"
            style={{ fontSize: "clamp(48px, 6.5vw, 96px)", lineHeight: 0.9 }}
          >
            THE <br /> ATLAS <br />
            <span className="outlined">PASSPORT.</span>
          </h2>
          <p className="mt-6 text-white/70 max-w-[480px] leading-[1.7]">
            A holographic operator identity. Black matte. Purple glow. Gold
            details. Encrypted seal. Issued only to verified members of the
            circuit.
          </p>

          <div className="mt-10 glass rounded-md p-6 max-w-[480px]">
            {delegateUser ? (
              <div className="space-y-4 font-mono text-xs">
                <span className="classified-label text-[var(--atlas-cyan)]">✓ DOSSIER ACTIVE</span>
                <p className="text-white/85 leading-relaxed">
                  Welcome back, Operator. Your credentials have been verified by the command registry. Your holographic passport is fully active.
                </p>
                <div className="h-[1px] bg-white/10" />
                <p className="text-white/40 text-[9.5px] leading-relaxed">
                  ID: {delegateUser.id}<br />
                  COMMITTEE: {delegateUser.committee}<br />
                  STATUS: VERIFIED
                </p>
              </div>
            ) : (
              <>
                <p className="classified-label text-white/55">DELEGATE INPUT</p>
                <input
                  data-testid={ATLAS.passportNameInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ENTER OPERATOR NAME"
                  className="w-full mt-2 bg-transparent border-b border-white/15 focus:border-[var(--atlas-gold)] outline-none py-3 font-display text-2xl tracking-wide text-white placeholder:text-white/25 transition-colors"
                />
                <div className="mt-4">
                  <span className="classified-label text-white/55">NATIONALITY</span>
                  <input
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="ENTER NATIONALITY (e.g. INDIA)"
                    className="w-full mt-1 bg-transparent border-b border-white/15 focus:border-[var(--atlas-gold)] outline-none py-2 font-mono text-[11px] tracking-[0.1em] text-white placeholder:text-white/25 transition-colors"
                  />
                </div>
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <span className="classified-label text-white/55">COMMITTEE</span>
                  <select
                    data-testid={ATLAS.passportCommittee}
                    value={committee}
                    onChange={(e) => setCommittee(e.target.value)}
                    className="bg-transparent border border-white/15 rounded-sm px-3 py-2 font-mono text-[11px] tracking-[0.22em] text-white outline-none focus:border-[var(--atlas-gold)]"
                  >
                    {COMMITTEES.map((c) => (
                      <option key={c} value={c} className="bg-[var(--atlas-black)]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  data-testid={ATLAS.passportGenerate}
                  onClick={generate}
                  disabled={loading}
                  className="btn-atlas mt-6"
                >
                  {loading ? "ISSUING…" : "ISSUE PASSPORT"} <span>↗</span>
                </button>
                <p className="font-mono text-[10px] tracking-[0.24em] text-white/40 mt-4 leading-[1.7]">
                  ◇ COLLECTIBLE ◇ HOLOGRAPHIC ◇ ONE OF ONE
                </p>
              </>
            )}
          </div>
        </div>

        <div className="perspective flex flex-col items-center justify-center">
          <motion.div
            style={{ rotateY: rotY, rotateX: rotX, transformStyle: "preserve-3d" }}
            className="relative w-full max-w-[520px] aspect-[1.58/1] rounded-xl overflow-hidden holo glow-purple"
          >
            <div className="absolute inset-0 grid-bg opacity-25" />
            
            {/* Useless Watermark */}
            {(passport.status === "USELESS" || passport.status === "UNVERIFIED") && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none">
                <div className="border-[3px] border-red-600/40 text-red-600/40 font-mono text-3xl font-bold tracking-[0.25em] px-4 py-2 rounded -rotate-[15deg] uppercase">
                  USELESS / UNVERIFIED
                </div>
              </div>
            )}

            <div className="absolute inset-0 p-3 sm:p-4 md:p-6 flex flex-col justify-between">
              {/* header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[6px] sm:text-[8px] md:text-[9.5px] tracking-[0.3em] text-[var(--atlas-gold)]">
                    ATLAS UNION SUMMIT · 2026
                  </p>
                  <p className="font-display text-white text-sm sm:text-lg md:text-2xl mt-0.5 sm:mt-1 leading-none">
                    OPERATOR PASSPORT
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src={ATLAS_LOGO_CLEAN}
                    alt="atlas"
                    className="h-4 sm:h-5 md:h-7 opacity-90"
                  />
                </div>
              </div>

              {/* body */}
              <div className="flex gap-2 sm:gap-4 md:gap-5 items-end">
                <div
                  data-testid={ATLAS.passport}
                  className="flex-1"
                >
                  <p className="font-mono text-[6px] sm:text-[7.5px] md:text-[9px] tracking-[0.3em] text-white/55">
                    DELEGATE
                  </p>
                  <p
                    className="font-display text-white leading-none mt-1 truncate"
                    style={{ fontSize: "clamp(14px, 3.4vw, 34px)" }}
                  >
                    {passport.delegate_name}
                  </p>
                  <div className="mt-2 sm:mt-4 grid grid-cols-2 gap-x-2 gap-y-1 sm:gap-x-4 sm:gap-y-2 md:gap-x-5 md:gap-y-2 font-mono text-[6px] sm:text-[7.5px] md:text-[9px] tracking-[0.25em]">
                    <div className="truncate">
                      <span className="text-white/45 block">ID</span>
                      <div
                        data-testid={ATLAS.passportDelegateId}
                        className="text-[var(--atlas-gold)] truncate"
                      >
                        {passport.delegate_id}
                      </div>
                    </div>
                    <div className="truncate">
                      <span className="text-white/45 block">COMMITTEE</span>
                      <div className="text-white truncate">{passport.committee}</div>
                    </div>
                    <div className="truncate">
                      <span className="text-white/45 block">CLEARANCE</span>
                      <div className="text-[var(--atlas-cyan)] truncate">
                        {passport.clearance}
                      </div>
                    </div>
                    <div className="truncate">
                      <span className="text-white/45 block">NATIONALITY</span>
                      <div className="text-white truncate">{passport.nationality}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
                  <img
                    src={passport.qr_url}
                    alt="qr"
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-[88px] md:h-[88px] rounded-sm bg-black/40"
                  />
                  <p className="font-mono text-[5px] sm:text-[6.5px] md:text-[8px] tracking-[0.28em] text-white/55">
                    SEAL · {passport.seal.slice(0, 8)}
                  </p>
                </div>
              </div>

              {/* footer */}
              <div className="flex justify-between font-mono text-[6px] sm:text-[7.5px] md:text-[9px] tracking-[0.3em] text-white/55 border-t border-white/10 pt-2 sm:pt-3">
                <span>ISSUED · {passport.issued}</span>
                <span className={(passport.status === "UNVERIFIED" || passport.status === "USELESS") ? "text-red-500 font-bold tracking-widest animate-pulse" : "text-[var(--atlas-gold)]"}>
                  STATUS · {passport.status || "APPROVED"}
                </span>
                <span>EXP · {passport.expires}</span>
              </div>
            </div>
          </motion.div>


        </div>
      </div>
    </section>
  );
}
