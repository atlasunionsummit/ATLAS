import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
          venue: "Taj Palace, New Delhi, India",
          time: "09:00 AM IST"
        },
        created_at: new Date().toISOString(),
        expiry_date: "2026-10-19T00:00:00Z"
      };

      await savePass(newPass);
      setPass(newPass);
      toast.success("DIGITAL PASS GENERATED", {
        description: "Your secure Wallet Pass is active."
      });
    } catch (e) {
      toast.error("GENERATION FAILED");
    } finally {
      setGenerating(false);
    }
  };

  // Google Wallet format file download
  const handleDownloadFile = () => {
    if (!pass) return;

    const walletPayload = {
      class: {
        id: "286476979504.atlas_mun_2026",
        issuerName: "Atlas Union MUN",
        eventName: "Atlas Union Summit 2026",
        logoUrl: ATLAS_LOGO_CLEAN,
        venue: {
          name: "Taj Palace",
          address: "Sardar Patel Marg, Diplomatic Enclave, Chanakyapuri, New Delhi, Delhi 110021"
        },
        dateTime: "2026-10-16T09:00:00Z"
      },
      object: {
        id: `286476979504.${pass.pass_id}`,
        classId: "286476979504.atlas_mun_2026",
        state: pass.status === "revoked" ? "REVOKED" : "ACTIVE",
        barcode: {
          type: "QR_CODE",
          value: pass.pass_id
        },
        ticketHolderName: pass.delegate_name,
        textModulesData: [
          { header: "COMMITTEE", body: pass.committee },
          { header: "COUNTRY", body: pass.country },
          { header: "POSITION", body: pass.position }
        ]
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(walletPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `atlas_pass_${pass.pass_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    toast.success("JSON PASS FILE DOWNLOADED", {
      description: "Standard Google Wallet event ticket format."
    });
  };

  const handleWalletSaveComplete = async () => {
    if (!pass) return;
    const updatedPass = {
      ...pass,
      wallet_status: "added"
    };
    await savePass(updatedPass);
    setPass(updatedPass);
    setSimulatorOpen(false);
    toast.success("ADDED TO GOOGLE WALLET", {
      description: "Pass saved successfully to your digital wallet."
    });
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
                The Delegate Wallet Pass generation system is restricted to authorized operators. Verify your credentials using Google Authentication to load your passport details.
              </p>
            </div>
            <button
              onClick={() => setLoginOpen(true)}
              className="btn-atlas w-full text-center py-3 text-xs tracking-[0.2em] font-mono"
            >
              SIGN IN TO UNLOCK ↗
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
              Generate your official event wallet pass. This integrates with your mobile phone's digital wallet (Google Wallet API eventTicket class schema) for instant check-in.
            </p>
            <button
              onClick={handleGeneratePass}
              disabled={generating}
              className="btn-atlas w-full text-center py-3 text-xs"
            >
              {generating ? "GENERATING PASS..." : "GENERATE WALLET PASS ↗"}
            </button>
          </motion.div>
        ) : (
          /* Pass Display Screen */
          <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-center w-full">
            <div className="space-y-6">
              <span className="classified-label text-[var(--atlas-gold)]">/ 06 — DIGITAL WALLET PASS</span>
              <h2 className="font-display text-white text-5xl lg:text-6xl leading-none">
                SUMMIT <br />ENTRY PASS.
              </h2>
              <p className="text-white/60 font-mono text-xs leading-relaxed max-w-[480px]">
                Your holographic digital passport and wallet pass are active. Tap "Add to Google Wallet" to save it directly to your mobile device for seamless at-venue NFC/QR validation at Chanakyapuri command check-ins.
              </p>

              <div className="space-y-3 pt-4 max-w-[480px]">
                <button
                  onClick={() => setSimulatorOpen(true)}
                  className="w-full bg-black border border-white/10 hover:border-[var(--atlas-gold)] rounded-lg py-3 flex items-center justify-center gap-3 transition-colors group shadow-lg"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Wallet_Icon_%282022%29.svg"
                    alt="Google Wallet"
                    className="w-6 h-6"
                  />
                  <span className="font-mono text-xs text-white group-hover:text-[var(--atlas-gold)] tracking-widest font-semibold transition-colors">
                    ADD TO GOOGLE WALLET
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadFile}
                    className="py-2.5 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded font-mono text-[10.5px] tracking-wider text-white transition-colors"
                  >
                    DOWNLOAD JSON PASS
                  </button>
                  <Link
                    to="/dashboard"
                    className="py-2.5 border border-[var(--atlas-cyan)] text-[var(--atlas-cyan)] hover:bg-[var(--atlas-cyan)]/10 rounded font-mono text-[10.5px] tracking-wider text-center transition-colors"
                  >
                    GO TO DASHBOARD
                  </Link>
                </div>
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

            {/* Google Wallet Look Card */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ rotateY: -10, rotateX: 5 }}
                animate={{ rotateY: 0, rotateX: 0 }}
                className="w-full max-w-[380px] bg-[#0c0316] rounded-2xl border border-[var(--atlas-gold)]/35 overflow-hidden shadow-[0_0_40px_rgba(201,164,76,0.12)] p-6 font-mono text-xs flex flex-col justify-between aspect-[1/1.58]"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <img src={ATLAS_LOGO_CLEAN} alt="logo" className="h-6" />
                    <span className="font-display text-[10px] tracking-[0.25em] text-white">ATLAS MUN 2026</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded border text-[8px] tracking-widest uppercase ${
                      pass.status === "revoked"
                        ? "bg-red-500/10 text-red-400 border-red-500/25"
                        : pass.status === "used"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                        : "bg-cyan-500/10 text-cyan-400 border-cyan-500/25"
                    }`}
                  >
                    {pass.status}
                  </span>
                </div>

                {/* Profile Block */}
                <div className="flex gap-4 items-center mt-6">
                  <img
                    src={pass.avatar_url}
                    alt="avatar"
                    className="w-14 h-14 rounded-full border border-white/10 bg-black/40"
                  />
                  <div>
                    <span className="text-white/40 text-[9px] block tracking-widest">TICKET HOLDER</span>
                    <span className="text-white font-display text-lg font-bold leading-none block mt-1">{pass.delegate_name.toUpperCase()}</span>
                    <span className="text-[var(--atlas-cyan)] text-[10px] block mt-1 tracking-wider">{pass.position.toUpperCase()}</span>
                  </div>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-6 text-[10px] tracking-wider border-t border-b border-white/5 py-4">
                  <div>
                    <span className="text-white/40 block text-[8px] tracking-widest">COMMITTEE</span>
                    <span className="text-white block mt-0.5 truncate">{pass.committee}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8px] tracking-widest">COUNTRY</span>
                    <span className="text-[var(--atlas-gold)] block mt-0.5">{pass.country}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8px] tracking-widest">DATE & TIME</span>
                    <span className="text-white block mt-0.5 text-[9px]">OCT 16, 2026 · 09:00 AM</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8px] tracking-widest">VENUE LOCATION</span>
                    <span className="text-white block mt-0.5 text-[9px] truncate">Taj Palace, Delhi</span>
                  </div>
                </div>

                {/* Scanner Barcode / QR */}
                <div className="flex flex-col items-center mt-6">
                  <div className="p-2 bg-white rounded-md shadow">
                    <img src={qrURL} alt="QR Code Scanner" className="w-[100px] h-[100px]" />
                  </div>
                  <span className="text-white/45 text-[8.5px] tracking-widest mt-2">{pass.pass_id}</span>
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

      {/* Google Wallet Simulator App Overlay */}
      <AnimatePresence>
        {simulatorOpen && pass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="absolute inset-0" onClick={() => setSimulatorOpen(false)} />
            <motion.div
              initial={{ y: 50, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 30, scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[390px] h-[80vh] bg-[#1a1b1f] rounded-[36px] overflow-hidden border-[6px] border-[#37383a] shadow-2xl flex flex-col justify-between font-sans text-white select-none"
            >
              {/* Phone Status Bar */}
              <div className="h-10 bg-black flex justify-between items-center px-6 text-[11px] font-medium text-white/80 shrink-0">
                <span>19:26</span>
                <div className="flex gap-1.5 items-center">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* Wallet Header */}
              <div className="p-6 pb-2 flex items-center gap-3 border-b border-white/5 bg-black/10 shrink-0">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Wallet_Icon_%282022%29.svg"
                  alt="Wallet"
                  className="w-7 h-7"
                />
                <span className="text-base font-semibold tracking-wide">Google Wallet</span>
              </div>

              {/* Simulator Content Body */}
              <div className="flex-grow overflow-y-auto px-6 py-4 flex flex-col items-center justify-center space-y-6 scrollbar-none">
                <WalletAddingSimulator
                  pass={pass}
                  onComplete={handleWalletSaveComplete}
                  onCancel={() => setSimulatorOpen(false)}
                />
              </div>

              {/* Home Navigation Pill Bar */}
              <div className="h-6 bg-black flex items-center justify-center shrink-0">
                <div className="w-28 h-1 bg-white/40 rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------
// Google Wallet Adding Simulation UI State machine
// ----------------------------------------------------
function WalletAddingSimulator({ pass, onComplete, onCancel }) {
  const [addingStep, setAddingStep] = useState(1); // Steps: 1 = Confirm, 2 = Animating, 3 = Success

  const triggerAddFlow = () => {
    setAddingStep(2);
    setTimeout(() => {
      setAddingStep(3);
    }, 2500);
  };

  return (
    <div className="w-full flex flex-col items-center text-center">
      {addingStep === 1 && (
        <div className="space-y-6 w-full">
          <div>
            <h4 className="text-xl font-bold">Add Event Ticket?</h4>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              Save this digital pass securely to your Google Account for quick offline access on your phone.
            </p>
          </div>

          {/* Mini ticket preview inside phone */}
          <div className="bg-[#0b0312] border border-[var(--atlas-gold)]/20 p-4 rounded-xl text-left font-mono space-y-3 shadow-md mx-auto max-w-[280px]">
            <div className="flex items-center gap-1.5 text-[9px] tracking-wider text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--atlas-gold)]" />
              ATLAS UNION SUMMIT 2026
            </div>
            <div className="text-xs font-bold text-white truncate uppercase">
              {pass.delegate_name}
            </div>
            <div className="text-[10px] text-white/60">
              ID: {pass.pass_id}
            </div>
            <div className="text-[9px] text-[var(--atlas-cyan)]">
              COMMITTEE: {pass.committee}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-4">
            <button
              onClick={triggerAddFlow}
              className="w-full bg-[#1a73e8] hover:bg-[#155cb0] text-white py-3 rounded-full font-semibold text-xs tracking-wider transition-colors shadow"
            >
              SAVE TO GOOGLE WALLET
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-full border border-white/10 hover:bg-white/5 font-semibold text-xs tracking-wider text-white/70 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {addingStep === 2 && (
        <div className="space-y-6">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#1a73e8] border-white/10 animate-spin mx-auto" />
          <div>
            <h4 className="text-lg font-bold">Saving to Google Wallet...</h4>
            <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
              Creating secure credential keys on your device. Do not close this panel.
            </p>
          </div>
        </div>
      )}

      {addingStep === 3 && (
        <div className="space-y-6 w-full">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-3xl mx-auto animate-bounce">
            ✓
          </div>
          <div>
            <h4 className="text-xl font-bold text-emerald-400">Pass Saved Successfully!</h4>
            <p className="text-xs text-white/55 mt-1.5 leading-relaxed max-w-[250px] mx-auto">
              Your ticket is saved in Google Wallet. You can present this screen or your phone NFC during registration.
            </p>
          </div>
          <button
            onClick={onComplete}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-full font-semibold text-xs tracking-widest mt-4 shadow transition-colors"
          >
            DONE
          </button>
        </div>
      )}
    </div>
  );
}
