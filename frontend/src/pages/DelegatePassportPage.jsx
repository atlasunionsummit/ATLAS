import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/atlas/Navbar";
import Footer from "@/components/atlas/Footer";
import DelegateLoginDialog from "@/components/atlas/DelegateLoginDialog";
import { getPassByEmail, savePass, signOutUser } from "@/lib/atlasApi";
import { ATLAS_LOGO_CLEAN } from "@/lib/atlasAssets";

export default function DelegatePassportPage() {
  const navigate = useNavigate();
  const [delegateUser, setDelegateUser] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  // 3D Card Animation Hooks
  const wrapRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-15, 15]);

  const handleMouseMove = (e) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const loadSessionAndPass = async () => {
    setLoading(true);
    const session = localStorage.getItem("aus_delegate_session");
    if (session) {
      try {
        const user = JSON.parse(session);
        setDelegateUser(user);
        
        // Fetch pass from Firestore
        const passData = await getPassByEmail(user.email);
        setPass(passData);
      } catch (e) {
        console.error("Session load error:", e);
        localStorage.removeItem("aus_delegate_session");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Delegate Digital Pass · Atlas Union Summit";
    loadSessionAndPass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = (user) => {
    setDelegateUser(user);
    if (user.role === "admin") {
      navigate("/admin");
    } else {
      loadSessionAndPass();
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("aus_delegate_session");
    localStorage.removeItem("aus_admin_user");
    try {
      await signOutUser();
    } catch (e) {
      console.error(e);
    }
    setDelegateUser(null);
    setPass(null);
    toast.success("DISCONNECTED");
  };

  const handleGeneratePass = async () => {
    if (!delegateUser) return;
    setGenerating(true);
    try {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const passId = `AUS-PASS-${randNum}`;
      
      const newPass = {
        pass_id: passId,
        delegate_name: delegateUser.full_name,
        email: delegateUser.email.toLowerCase(),
        country: delegateUser.country,
        committee: delegateUser.committee,
        position: "Delegate",
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(delegateUser.full_name)}`,
        status: "active",
        entry_logs: [],
        wallet_status: "not_added",
        event_details: {
          date: "October 16 - 18, 2026",
          venue: "IIT Delhi (TBD)",
          time: "09:00 AM IST"
        },
        created_at: new Date().toISOString(),
        expiry_date: "2026-10-19T00:00:00Z"
      };

      await savePass(newPass);
      setPass(newPass);
      toast.success("DIGITAL PASS GENERATED", {
        description: "Your secure E-Passport is active."
      });
    } catch (e) {
      toast.error("GENERATION FAILED");
    } finally {
      setGenerating(false);
    }
  };



  const qrURL = pass
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=08000F&color=C9A44C&data=PASS::${pass.pass_id}`
    : "";

  return (
    <div className="App atlas-grain min-h-screen flex flex-col justify-between">
      <Navbar
        onRequestAccess={() => {}}
        onRequestDelegateLogin={() => setLoginOpen(true)}
        delegateUser={delegateUser}
        onDelegateLogout={handleLogout}
      />

      <main className="flex-grow pt-32 pb-20 px-6 max-w-[1240px] mx-auto w-full flex items-center justify-center">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 rounded-full border border-t-[var(--atlas-gold)] border-white/10 animate-spin mx-auto" />
            <p className="font-mono text-xs tracking-widest text-white/55 mt-4">FETCHING PASS teleMETRY...</p>
          </div>
        ) : !delegateUser ? (
          /* Gated Restricted Screen */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[480px] glass-strong rounded-md p-8 border border-white/5 text-center space-y-6"
          >
            <div className="flex justify-center">
              <span className="w-12 h-12 rounded-full border border-red-500/35 bg-red-500/5 flex items-center justify-center text-red-400 font-mono text-xl animate-pulse">
                🔒
              </span>
            </div>
            <div>
              <span className="classified-label text-red-500 block">/ ACCESS RESTRICTED</span>
              <h2 className="font-display text-white text-3xl mt-2">DELEGATE AUTHENTICATION GATED</h2>
              <p className="text-white/60 font-mono text-[11px] leading-relaxed mt-2.5">
                The Delegate E-Passport generation system is restricted to authorized operators. Verify your credentials using Google Authentication to load your passport details.
              </p>
            </div>
            <button
              onClick={() => setLoginOpen(true)}
              className="btn-atlas w-full text-center py-3 text-xs tracking-[0.2em] font-mono"
            >
              SIGN IN TO UNLOCK ↗
            </button>
          </motion.div>
        ) : delegateUser.role === "guest" || delegateUser.role === "pending" ? (
          /* Observer Access Screen */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[500px] glass rounded-md p-8 border border-white/5 text-center space-y-6"
          >
            <span className="classified-label text-[var(--atlas-cyan)] block">/ OBSERVER TERMINAL</span>
            <h2 className="font-display text-white text-3xl">GUEST ACCESS GRANTED</h2>
            <p className="text-white/60 font-mono text-xs leading-relaxed">
              Operator: <span className="text-white font-bold">{delegateUser.full_name}</span><br />
              Status: <span className="text-white uppercase">{delegateUser.role} / Observer</span>
            </p>
            <p className="text-white/40 font-mono text-[10.5px] leading-relaxed">
              Your official E-Passport and dossier are currently pending registration. However, you have been granted temporary access to the Global Lobby to communicate with active delegates.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-atlas w-full text-center py-3 text-xs"
            >
              ENTER GLOBAL LOBBY ↗
            </button>
          </motion.div>
        ) : !pass ? (
          /* Generate Pass Screen */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[500px] glass rounded-md p-8 border border-white/5 text-center space-y-6"
          >
            <span className="classified-label text-[var(--atlas-gold)] block">/ PASSPORT VERIFIED</span>
            <h2 className="font-display text-white text-3xl">GENERATE DIGITAL PASS</h2>
            <p className="text-white/60 font-mono text-xs leading-relaxed">
              Operator: <span className="text-white font-bold">{delegateUser.full_name}</span><br />
              Committee: <span className="text-white">{delegateUser.committee}</span>
            </p>
            <p className="text-white/40 font-mono text-[10.5px] leading-relaxed">
              Generate your official event digital passport for instant check-in.
            </p>
            <button
              onClick={handleGeneratePass}
              disabled={generating}
              className="btn-atlas w-full text-center py-3 text-xs"
            >
              {generating ? "GENERATING PASS..." : "GENERATE E-PASSPORT ↗"}
            </button>
          </motion.div>
        ) : (
          /* Pass Display Screen */
          <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-center w-full">
            <div className="space-y-6">
              <span className="classified-label text-[var(--atlas-gold)]">/ 06 — DIGITAL PASSPORT</span>
              <h2 className="font-display text-white text-5xl lg:text-6xl leading-none">
                SUMMIT <br />ENTRY PASS.
              </h2>
              <p className="text-white/60 font-mono text-xs leading-relaxed max-w-[480px]">
                Your holographic digital passport is active. Please present this screen along with the QR code at the Chanakyapuri command check-ins for verification.
              </p>

              <div className="space-y-3 pt-4 max-w-[480px]">
                <Link
                  to="/dashboard"
                  className="w-full bg-[var(--atlas-cyan)]/10 border border-[var(--atlas-cyan)] text-[var(--atlas-cyan)] hover:bg-[var(--atlas-cyan)]/20 rounded-lg py-3 flex items-center justify-center font-mono text-xs tracking-widest transition-colors shadow-lg"
                >
                  RETURN TO DASHBOARD
                </Link>
              </div>

              {pass.entry_logs && pass.entry_logs.length > 0 && (
                <div className="glass rounded border border-white/5 p-4 max-w-[480px]">
                  <span className="classified-label text-emerald-400 block mb-2">/ CHECK-IN ENTRY LOGS</span>
                  <div className="space-y-2 font-mono text-[10px] text-white/70">
                    {pass.entry_logs.map((log, index) => (
                      <div key={index} className="flex justify-between border-b border-white/5 pb-1">
                        <span className="uppercase text-emerald-400">◇ {log.type} recorded</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3D Holographic Passport Card */}
            <div 
              ref={wrapRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="perspective flex flex-col items-center justify-center w-full"
            >
              <motion.div
                style={{ rotateY: rotateY, rotateX: rotateX, transformStyle: "preserve-3d" }}
                className="relative w-full max-w-[520px] aspect-[1.58/1] rounded-xl overflow-hidden holo glow-purple shadow-2xl"
              >
                <div className="absolute inset-0 grid-bg opacity-25" />
                
                {pass.status === "revoked" && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none">
                    <div className="border-[3px] border-red-600/40 text-red-600/40 font-mono text-3xl font-bold tracking-[0.25em] px-4 py-2 rounded -rotate-[15deg] uppercase">
                      REVOKED
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 p-6 flex flex-col justify-between" style={{ transform: "translateZ(30px)" }}>
                  {/* header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-[9.5px] tracking-[0.3em] text-[var(--atlas-gold)]">
                        ATLAS UNION SUMMIT · 2026
                      </p>
                      <p className="font-display text-white text-2xl mt-1 leading-none">
                        OPERATOR PASSPORT
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src={ATLAS_LOGO_CLEAN}
                        alt="atlas"
                        className="h-7 opacity-90"
                      />
                    </div>
                  </div>

                  {/* body */}
                  <div className="flex gap-5 items-end">
                    <div className="flex-1">
                      <p className="font-mono text-[9px] tracking-[0.3em] text-white/55 uppercase">
                        {pass.position}
                      </p>
                      <p
                        className="font-display text-white leading-none mt-1 uppercase"
                        style={{ fontSize: "clamp(22px, 3.4vw, 34px)" }}
                      >
                        {pass.delegate_name}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 font-mono text-[9px] tracking-[0.25em]">
                        <div>
                          <span className="text-white/45">ID</span>
                          <div className="text-[var(--atlas-gold)]">
                            {pass.pass_id}
                          </div>
                        </div>
                        <div>
                          <span className="text-white/45">COMMITTEE</span>
                          <div className="text-white truncate max-w-[120px]">{pass.committee}</div>
                        </div>
                        <div>
                          <span className="text-white/45">CLEARANCE</span>
                          <div className="text-[var(--atlas-cyan)]">
                            ELITE
                          </div>
                        </div>
                        <div>
                          <span className="text-white/45">COUNTRY</span>
                          <div className="text-white truncate max-w-[120px]">{pass.country}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2" style={{ transform: "translateZ(40px)" }}>
                      <div className="p-1.5 bg-white rounded-md shadow-lg">
                        <img
                          src={qrURL}
                          alt="QR Code"
                          className="w-[82px] h-[82px]"
                        />
                      </div>
                      <p className="font-mono text-[8px] tracking-[0.28em] text-white/55 mt-1">
                        VALID // SCANNABLE
                      </p>
                    </div>
                  </div>

                  {/* footer */}
                  <div className="flex justify-between font-mono text-[9px] tracking-[0.3em] text-white/55 border-t border-white/10 pt-3">
                    <span>ISSUED · OCT 2026</span>
                    <span className={pass.status === "revoked" ? "text-red-500 font-bold tracking-widest animate-pulse" : "text-[var(--atlas-gold)]"}>
                      STATUS · {pass.status.toUpperCase()}
                    </span>
                    <span>EXP · {new Date(pass.expiry_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </main>

      <Footer onRequestAccess={() => {}} />

      <DelegateLoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />


    </div>
  );
}


