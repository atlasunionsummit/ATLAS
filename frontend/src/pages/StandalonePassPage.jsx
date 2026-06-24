import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPassById } from "@/lib/atlasApi";
import { ATLAS_LOGO_CLEAN } from "@/lib/atlasAssets";

export default function StandalonePassPage() {
  const { id } = useParams();
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPass = async () => {
      setLoading(true);
      try {
        const passData = await getPassById(id);
        if (passData) {
          setPass(passData);
          document.title = `${passData.delegate_name} - Digital Pass`;
        } else {
          setError("PASS NOT FOUND OR INVALID ID");
        }
      } catch (err) {
        setError("ERROR FETCHING PASS");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchPass();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08000F] flex items-center justify-center font-mono text-white/50 text-xs tracking-widest">
        VERIFYING PASS CREDENTIALS...
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="min-h-screen bg-[#08000F] flex items-center justify-center font-mono text-red-500 text-xs tracking-widest text-center p-6">
        {error}
      </div>
    );
  }

  const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=08000F&color=C9A44C&data=https://atlasunionsummit.com/p/${pass.pass_id}`;

  return (
    <div className="min-h-screen bg-[#08000F] flex items-center justify-center p-4">
      <div className={`relative w-full max-w-[420px] aspect-[1.58/1] rounded-xl overflow-hidden ${
        pass.is_atlas_plus 
          ? "bg-[#0a0800] border border-[#C9A44C]/40 shadow-[0_0_50px_rgba(201,164,76,0.3)]" 
          : "holo glow-purple shadow-2xl border border-white/10"
      }`}>
        {pass.is_atlas_plus && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A44C]/20 via-transparent to-[#C9A44C]/10 mix-blend-overlay pointer-events-none" />
            <div className="absolute -inset-[100%] animate-[spin_8s_linear_infinite] opacity-30 bg-[conic-gradient(from_0deg,transparent_0_340deg,#C9A44C_360deg)] pointer-events-none" />
          </>
        )}
        <div className="absolute inset-0 grid-bg opacity-25" />
        
        {pass.status === "revoked" && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none">
            <div className="border-[3px] border-red-600/40 text-red-600/40 font-mono text-3xl font-bold tracking-[0.25em] px-4 py-2 rounded -rotate-[15deg] uppercase">
              REVOKED
            </div>
          </div>
        )}

        <div className="absolute inset-0 p-5 flex flex-col justify-between">
          {/* header */}
          <div className="flex items-start justify-between">
            <div>
              <p className={`font-mono text-[8px] tracking-[0.3em] ${pass.is_atlas_plus ? 'text-[#C9A44C] font-bold' : 'text-[#C9A44C]'}`}>
                ATLAS UNION SUMMIT · 2026
              </p>
              <p className={`font-display text-xl mt-1 leading-none ${pass.is_atlas_plus ? 'text-white' : 'text-white'}`}>
                {pass.is_atlas_plus ? 'ELITE PASSPORT' : 'OPERATOR PASSPORT'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <img
                src={ATLAS_LOGO_CLEAN}
                alt="atlas"
                className="h-6 opacity-90"
              />
            </div>
          </div>

          {/* body */}
          <div className="flex gap-4 items-end mt-4">
            <div className="shrink-0 relative">
              <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-black/40 ${pass.is_atlas_plus ? 'border-2 border-[#C9A44C] shadow-[0_0_10px_rgba(201,164,76,0.6)]' : 'border border-white/20'}`}>
                <img src={pass.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pass.delegate_name)}`} alt="Avatar" className="w-full h-full object-cover p-1.5" />
              </div>
              {pass.is_atlas_plus && (
                <div className="absolute -top-3 -right-2 text-xl drop-shadow-[0_0_5px_rgba(201,164,76,0.8)]">
                  👑
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-mono text-[7px] tracking-[0.3em] text-white/55 uppercase">
                {pass.position || "Delegate"}
              </p>
              <p
                className="font-display text-white leading-none mt-1 uppercase truncate"
                style={{ fontSize: "clamp(16px, 4vw, 22px)" }}
              >
                {pass.delegate_name}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[7px] tracking-[0.25em]">
                <div>
                  <span className="text-white/45 block">ID</span>
                  <div className="text-[#C9A44C] truncate">
                    {pass.pass_id}
                  </div>
                </div>
                <div>
                  <span className="text-white/45 block">COMMITTEE</span>
                  <div className="text-white truncate">{pass.committee}</div>
                </div>
                <div>
                  <span className="text-white/45 block">CLEARANCE</span>
                  <div className="text-[#3b82f6] truncate">
                    ELITE
                  </div>
                </div>
                <div>
                  <span className="text-white/45 block">COUNTRY</span>
                  <div className="text-white truncate">{pass.country || pass.nationality || "INDIA"}</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="p-1 bg-white rounded shadow-lg">
                <img
                  src={qrURL}
                  alt="QR Code"
                  className="w-14 h-14"
                />
              </div>
              <p className="font-mono text-[6px] tracking-[0.28em] text-white/55 mt-1 text-right">
                SCANNABLE
              </p>
            </div>
          </div>

          {/* footer */}
          <div className="flex justify-between font-mono text-[7px] tracking-[0.3em] text-white/55 border-t border-white/10 pt-2 mt-4">
            <span>ISSUED · OCT 2026</span>
            <span className={pass.status === "revoked" ? "text-red-500 font-bold tracking-widest animate-pulse" : "text-[#C9A44C]"}>
              STATUS · {pass.status ? pass.status.toUpperCase() : "APPROVED"}
            </span>
            <span>EXP · DEC 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
