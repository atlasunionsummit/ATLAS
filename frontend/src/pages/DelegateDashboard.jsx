import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getDelegates,
  saveDelegates,
  getDelegateNotes,
  saveDelegateNotes,
  getBroadcastHistory,
  subscribeToBroadcasts,
  sendChatMessage,
  subscribeToChat,
  getAIChatHistory,
  saveAIChatHistory,
  getDelegateTasks,
  saveDelegateTasks,
  getConferenceSettings
} from "@/lib/atlasApi";
import { toast } from "sonner";
import { load } from '@cashfreepayments/cashfree-js';
import CoachellaDashboard, { UrgentSafetyContact } from "@/pages/CoachellaDashboard";
import PortfolioMatrixViewer from "@/components/atlas/PortfolioMatrixViewer";
import TermsAndConditions from "@/components/atlas/TermsAndConditions";

export default function DelegateDashboard({ onRequestAccess }) {
  const navigate = useNavigate();
  const [delegate, setDelegate] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [shownNotifications, setShownNotifications] = useState(new Set());

  // Atlas Plus Upgrade state
  const [showUpgradePay, setShowUpgradePay] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [atlasPlusPrice, setAtlasPlusPrice] = useState(600);

  // Redirect if not signed in
  useEffect(() => {
    const session = localStorage.getItem("aus_delegate_session");
    if (!session) {
      toast.error("UNAUTHORIZED ACCESS", { description: "Operator credentials missing. Redirecting..." });
      navigate("/");
    } else {
      try {
        setDelegate(JSON.parse(session));
      } catch {
        localStorage.removeItem("aus_delegate_session");
        navigate("/");
      }
    }
    
    // Fetch dynamic atlas plus price
    getConferenceSettings().then(settings => {
      if (settings?.atlas_plus_price) {
        setAtlasPlusPrice(settings.atlas_plus_price);
      }
    }).catch(console.error);
  }, [navigate]);

  // Read admin broadcasts for push notifications
  useEffect(() => {
    if (!delegate) return;

    const unsubscribe = subscribeToBroadcasts((broadcasts) => {
      setNotifications(prev => {
        // Filter out notifications that we have already shown
        const newAlerts = broadcasts.filter(b => !shownNotifications.has(b.id));
        if (newAlerts.length > 0) {
          newAlerts.forEach(b => {
            setShownNotifications(shown => {
              const updated = new Set(shown);
              updated.add(b.id);
              return updated;
            });
            toast.info("COMMAND BROADCAST RECEIVED", {
              description: b.subject,
            });
          });
          return [...prev, ...newAlerts];
        }
        return prev;
      });
    });

    return () => unsubscribe();
  }, [delegate, shownNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("aus_delegate_session");
    setDelegate(null);
    toast.success("LOGGED OUT", { description: "Session disconnected." });
    navigate("/");
  };

  const handleProfileUpdate = async (updatedDossier) => {
    setDelegate(updatedDossier);
    localStorage.setItem("aus_delegate_session", JSON.stringify(updatedDossier));
    
    // Update in global delegates list
    if (updatedDossier.role === "delegate" || updatedDossier.role === "admin") {
      try {
        const globalDelegates = await getDelegates();
        const updatedList = globalDelegates.map(d => d.email.toLowerCase() === updatedDossier.email.toLowerCase() ? { ...d, ...updatedDossier } : d);
        await saveDelegates(updatedList);
        toast.success("PROFILE UPDATED", { description: "Dossier credentials synchronized with Command." });
      } catch {
        toast.error("SYNC ERROR");
      }
    } else {
      toast.success("PROFILE UPDATED", { description: "Local profile synchronized for Observer session." });
    }
  };

  const handleCashfreeUpgrade = async (e) => {
    if (e) e.preventDefault();
    setUpgradeLoading(true);
    try {
      const orderId = `AUS-UPG-${Date.now()}`;
      const payload = {
        ...delegate,
        is_upgrade: true,
        registration_id: orderId,
        package_name: "Atlas Plus Tier",
        timestamp: new Date().toISOString(),
      };

      // Save to localStorage for verify step
      localStorage.setItem("pending_upgrade_payload", JSON.stringify(payload));

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_amount: atlasPlusPrice,
          order_id: orderId,
          customer_details: {
            customer_id: delegate.id || `CUST_${Date.now()}`,
            customer_phone: delegate.phone_number || "9999999999",
            customer_email: delegate.email,
            customer_name: delegate.full_name
          },
          order_meta: {
            return_url: `${window.location.origin}/verify-upgrade?order_id=${orderId}`
          },
          delegate_payload: payload
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to initiate Cashfree payment");
      }

      // Initialize Checkout using NPM package
      const cashfree = await load({ mode: "production" });
      
      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self"
      });

    } catch (err) {
      console.error("CASHFREE UPGRADE ERROR:", err);
      toast.error("GATEWAY ERROR", { description: err.message || String(err) });
      setUpgradeLoading(false);
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!delegate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--atlas-black)] text-[#F5F1FF] flex font-mono select-none relative">
      {/* Mobile sidebar backdrop overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}
      {/* Floating Push Notification Banner overlay */}
      <div className="fixed top-20 right-6 z-[200] w-[320px] space-y-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.95 }}
              className="pointer-events-auto bg-[#0a0212]/95 border border-[var(--atlas-cyan)]/35 rounded-md p-4 shadow-[0_0_15px_rgba(30,220,240,0.15)] flex flex-col gap-2 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--atlas-cyan)]" />
              <div className="flex justify-between items-start">
                <span className="text-[8.5px] tracking-widest text-[var(--atlas-cyan)] font-bold">
                  🔔 COMMAND DISPATCH
                </span>
                <button
                  onClick={() => dismissNotification(n.id)}
                  className="text-white/45 hover:text-white text-[10px]"
                >
                  ✕
                </button>
              </div>
              <h5 className="font-display text-white font-bold text-xs">{n.subject}</h5>
              <p className="text-[10px] text-white/70 leading-relaxed">{n.body}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sidebar navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/45 backdrop-blur-md border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0 shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 shrink-0">
          <div className="flex flex-col">
            <span className="font-mono text-xs tracking-[0.25em] text-[var(--atlas-cyan)] font-bold">
              ATLAS DELEGATE
            </span>
            <span className="text-[8px] tracking-[0.3em] text-[var(--atlas-gold)] mt-0.5">
              CLEARANCE · ELITE
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/60 hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto scrollbar-none">
          {[
            { id: "profile", label: "01 OPERATOR DOSSIER", icon: "👤" },
            { id: "agenda", label: "02 ACCOUNTING TASKS", icon: "📅" },
            { id: "announcements", label: "03 COMMAND DISPATCHES", icon: "📢" },
            { id: "messaging", label: "04 ENCRYPTED CHAT", icon: "💬" },
            { id: "notes", label: "05 SECURE NOTES", icon: "📝" },
            { id: "ai", label: "06 COMMAND AI", icon: "🤖" },
            { id: "atlasplus", label: "07 ATLAS PLUS", icon: "✨" },
            { id: "accommodation", label: "08 ACCOMMODATION", icon: "🏨" },
            { id: "data", label: "09 REGISTRATION DATA", icon: "🗄️" },
            { id: "library", label: "10 ATLAS LIBRARY", icon: "📚" },
            { id: "safety", label: "11 URGENT SAFETY CONTACT", icon: "🚨" },
            { id: "matrix", label: "12 PORTFOLIO MATRIX", icon: "🗺️" },
            { id: "terms", label: "13 TERMS & CONDITIONS", icon: "⚖️" },
          ].filter(tab => !(tab.id === "atlasplus" && delegate?.committee === "Coachella (Simulated Crisis)"))
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded font-mono text-[10.5px] tracking-widest text-left transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--atlas-purple)]/20 text-[var(--atlas-cyan)] border-l-2 border-[var(--atlas-cyan)]"
                  : "text-white/55 hover:text-white hover:bg-white/[0.02]"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/5 p-4 space-y-3 bg-black/10 shrink-0">
          <button
            onClick={() => navigate("/")}
            className="w-full py-2 border border-white/10 hover:bg-white/5 text-white/80 font-mono text-[10.5px] tracking-wider rounded transition-all"
          >
            RETURN TO SUMMIT
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2 border border-red-500/35 hover:bg-red-500/10 text-red-400 font-mono text-[10.5px] tracking-wider rounded transition-colors"
          >
            SECURE LOGOUT
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <main className="flex-grow min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 px-4 sm:px-6 flex items-center justify-between bg-black/20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/60 hover:text-white lg:hidden shrink-0"
            >
              ☰
            </button>
            <span className="font-display text-sm sm:text-lg tracking-wider text-white truncate">
              DELEGATE CONTROL DESK
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0 ml-2">
              <div className="text-[#a58d60] text-[8px] sm:text-[10px] tracking-[0.2em] uppercase font-bold hidden md:block">
                Classification • Advisory Node (Groq)
              </div>
          </div>
        </header>

        {/* Tab view portal */}
        <div className="flex-grow overflow-y-auto p-6 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === "profile" && (
                <ProfileDesk delegate={delegate} onUpdate={handleProfileUpdate} />
              )}
              {activeTab === "agenda" && (
                <RestrictedOverlay delegate={delegate} onRequestAccess={onRequestAccess}>
                  <AccountingCalendar delegate={delegate} />
                </RestrictedOverlay>
              )}
              {activeTab === "announcements" && (
                <AnnouncementsDesk delegate={delegate} />
              )}
              {activeTab === "messaging" && (
                <EncryptedChat delegate={delegate} />
              )}
              {activeTab === "notes" && (
                <RestrictedOverlay delegate={delegate} onRequestAccess={onRequestAccess}>
                  <NotepadConsole delegate={delegate} />
                </RestrictedOverlay>
              )}
              {activeTab === "ai" && (
                <RestrictedOverlay delegate={delegate} onRequestAccess={onRequestAccess}>
                  <AIChatbot delegate={delegate} />
                </RestrictedOverlay>
              )}
              {activeTab === "atlasplus" && (
                <div className="flex flex-col h-full space-y-6 max-w-[800px]">
                  <div className="border-b border-white/5 pb-4 shrink-0">
                    <span className="classified-label text-[var(--atlas-gold)] text-xs block">
                      / 06 — ATLAS PLUS
                    </span>
                    <h3 className="font-display text-white text-2xl">THE PREMIUM EXPERIENCE</h3>
                  </div>

                  <div className="flex-grow overflow-y-auto min-h-0 space-y-6 scrollbar-thin pr-4 pt-2 pb-8">
                    <p className="text-white/70 text-sm font-mono leading-[1.8]">
                      Atlas Plus is our exclusive all-access experience, designed for participants who wish to explore every aspect of the Atlas ecosystem beyond the committee room. It is not simply a delegate pass. It is your gateway to diplomacy, culture, entertainment, networking and premium experiences—all on one stage.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="glass rounded border border-white/5 p-5">
                        <div className="text-2xl mb-3">🏛️</div>
                        <h4 className="font-display text-white text-lg mb-4 tracking-wider">PREMIUM CONFERENCE EXPERIENCE</h4>
                        <ul className="space-y-4">
                          <li>
                            <strong className="text-[var(--atlas-gold)] font-mono text-[10px] tracking-widest block mb-1">PREMIUM ATLAS ACCREDITATION</strong>
                            <span className="text-white/60 text-xs leading-relaxed">Receive an exclusive Atlas Plus identity badge and accreditation.</span>
                          </li>
                          <li>
                            <strong className="text-[var(--atlas-gold)] font-mono text-[10px] tracking-widest block mb-1">BRANDED ATLAS PASSPORT</strong>
                            <span className="text-white/60 text-xs leading-relaxed">A specially designed premium Atlas Passport, created as both a conference companion and a collectible memory.</span>
                          </li>
                          <li>
                            <strong className="text-[var(--atlas-gold)] font-mono text-[10px] tracking-widest block mb-1">PRIORITY CHECK-IN & ASSISTANCE</strong>
                            <span className="text-white/60 text-xs leading-relaxed">Dedicated registration and fast-track entry for a seamless arrival experience, with dedicated support throughout the summit.</span>
                          </li>
                        </ul>
                      </div>

                      <div className="glass rounded border border-white/5 p-5">
                        <div className="text-2xl mb-3">🛋️</div>
                        <h4 className="font-display text-white text-lg mb-4 tracking-wider">ATLAS DELEGATE LOUNGE</h4>
                        <p className="text-white/60 text-xs leading-relaxed mb-4">
                          Atlas Plus members receive access to the exclusive Delegate Lounge.
                        </p>
                        <ul className="space-y-2 font-mono text-[10.5px] text-white/70 tracking-wide">
                          <li className="flex items-center gap-2"><span className="text-[var(--atlas-cyan)]">◇</span> Fully Air-Conditioned Environment</li>
                          <li className="flex items-center gap-2"><span className="text-[var(--atlas-cyan)]">◇</span> Comfortable Seating Areas</li>
                          <li className="flex items-center gap-2"><span className="text-[var(--atlas-cyan)]">◇</span> Networking Spaces</li>
                          <li className="flex items-center gap-2"><span className="text-[var(--atlas-cyan)]">◇</span> Gaming & Interactive Zones</li>
                        </ul>
                      </div>
                    </div>

                    <div className="glass rounded border border-white/5 p-5 mb-4">
                      <div className="text-2xl mb-3">🥂</div>
                      <h4 className="font-display text-white text-lg mb-4 tracking-wider">EXCLUSIVE SOCIAL EVENTS</h4>
                      <p className="text-white/60 text-xs leading-relaxed">
                        Atlas Plus Members get exclusive access to our evening social events, including the Delegate Ball and the Cultural Night.
                      </p>
                    </div>

                    <div className="mt-8 border-t border-white/10 pt-8 pb-4">
                      {delegate?.is_atlas_plus ? (
                        <div className="p-4 glass border border-[var(--atlas-cyan)]/40 rounded flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--atlas-cyan)]/20 flex items-center justify-center">
                              <span className="text-xl">✨</span>
                            </div>
                            <div>
                              <h4 className="font-display text-white text-lg tracking-wider">ATLAS PLUS ACTIVATED</h4>
                              <p className="text-white/60 text-xs font-mono">Your premium pass is active.</p>
                            </div>
                          </div>
                        </div>
                      ) : delegate?.upgrade_pending ? (
                        <div className="p-4 glass border border-[var(--atlas-gold)]/40 rounded flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--atlas-gold)]/20 flex items-center justify-center animate-pulse">
                            <span className="text-xl">⏳</span>
                          </div>
                          <div>
                            <h4 className="font-display text-[var(--atlas-gold)] text-lg tracking-wider">UPGRADE PENDING</h4>
                            <p className="text-white/60 text-xs font-mono">Your UTR is being verified by the secretariat.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 glass border border-[var(--atlas-gold)]/40 rounded">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                              <h4 className="font-display text-[var(--atlas-gold)] text-xl mb-1 tracking-wider">UPGRADE TO ATLAS PLUS</h4>
                              <div className="text-[var(--atlas-gold)] font-mono text-sm tracking-widest mb-4 border-b border-[var(--atlas-gold)]/20 pb-3 inline-block">
                                ₹{atlasPlusPrice} / INVITATION ONLY
                              </div>
                            </div>
                            <button onClick={handleCashfreeUpgrade} disabled={upgradeLoading} className="btn-atlas shrink-0">
                              {upgradeLoading ? "INITIALIZING SECURE GATEWAY..." : "UPGRADE NOW ↗"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "accommodation" && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="w-20 h-20 bg-[var(--atlas-cyan)]/10 rounded-full flex items-center justify-center border border-[var(--atlas-cyan)]/30 animate-pulse">
                    <span className="text-4xl">🏨</span>
                  </div>
                  <div>
                    <h2 className="font-display text-white text-3xl mb-2">ACCOMMODATION</h2>
                    <p className="text-[var(--atlas-gold)] font-mono text-sm tracking-widest uppercase">
                      Coming Soon
                    </p>
                  </div>
                  <div className="max-w-md bg-black/40 border border-white/10 rounded-lg p-6 glass">
                    <p className="text-white/60 text-xs leading-relaxed font-mono">
                      Logistics for accommodation and boarding are currently being finalized by the secretariat. Information regarding partnered hotels and stays will be updated here shortly.
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "data" && (
                <div className="flex flex-col h-full space-y-6 max-w-[800px]">
                  <div className="border-b border-white/5 pb-4 shrink-0">
                    <span className="classified-label text-[var(--atlas-cyan)] text-xs block">
                      / 08 — REGISTRATION DATA
                    </span>
                    <h3 className="font-display text-white text-2xl">YOUR RAW DOSSIER</h3>
                    <p className="text-white/50 text-xs mt-1 font-mono">This is the exact data payload you transmitted during registration.</p>
                  </div>

                  <div className="flex-grow overflow-y-auto min-h-0 scrollbar-thin pr-4 pt-2 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(delegate).map(([key, value]) => {
                        if (key === 'id_proof_base64') return null; // Skip image in main grid
                        return (
                          <div key={key} className="glass rounded border border-white/5 p-4 flex flex-col">
                            <span className="text-white/40 font-mono text-[9px] tracking-widest uppercase mb-1">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-white text-sm font-mono break-words">
                              {String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {delegate.id_proof_base64 && (
                      <div className="mt-6 glass rounded border border-white/5 p-4">
                        <span className="text-white/40 font-mono text-[9px] tracking-widest uppercase mb-3 block">
                          ID PROOF BASE64 (PREVIEW)
                        </span>
                        <img src={delegate.id_proof_base64} alt="ID" className="max-w-[300px] h-auto rounded border border-white/10" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "library" && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="w-20 h-20 bg-[var(--atlas-cyan)]/10 rounded-full flex items-center justify-center border border-[var(--atlas-cyan)]/30 animate-pulse">
                    <span className="text-4xl">📚</span>
                  </div>
                  <div>
                    <h2 className="font-display text-white text-3xl mb-2">ATLAS LIBRARY</h2>
                    <p className="text-[var(--atlas-gold)] font-mono text-sm tracking-widest uppercase">
                      Coming Soon
                    </p>
                  </div>
                  <div className="max-w-md bg-black/40 border border-white/10 rounded-lg p-6 glass">
                    <p className="text-white/60 text-sm leading-relaxed font-mono uppercase">
                      Get access to best in class resources for research and excellency.
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "safety" && (
                <UrgentSafetyContact delegate={delegate} />
              )}
              {activeTab === "matrix" && (
                <PortfolioMatrixViewer open={true} onClose={() => setActiveTab("profile")} />
              )}
              {activeTab === "terms" && (
                <div className="h-full overflow-y-auto pr-4 scrollbar-thin">
                  <TermsAndConditions />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ----------------------------------------------------
// Tab Sub-component: ProfileDesk (Profile management)
// ----------------------------------------------------
function ProfileDesk({ delegate, onUpdate }) {
  const [form, setForm] = useState({ ...delegate });
  const [passData, setPassData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    import("@/lib/atlasApi").then(({ getPassByEmail }) => {
      getPassByEmail(delegate.email).then((pass) => {
        if (pass) {
          setPassData(pass);
        }
      });
    });
  }, [delegate.email]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(form);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("FILE TOO LARGE", { description: "Maximum image size is 5MB." });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        
        // crop to center square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setForm({ ...form, profile_pic: dataUrl });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-[600px]">
      <div className="border-b border-white/5 pb-4 flex items-start justify-between">
        <div>
          <span className="classified-label text-[var(--atlas-gold)] text-xs block">
            / OPERATOR CREDENTIALS
          </span>
          <h3 className="font-display text-white text-2xl">DOSSIER SETTINGS</h3>
        </div>
        {passData && (
          <a
            href={`/p/${passData.pass_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-atlas !px-4 !py-2 !text-[10px] shrink-0"
          >
            VIEW E-PASSPORT <span>↗</span>
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass rounded border border-white/5 p-6 space-y-5">
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-white/5">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden bg-black/40 flex items-center justify-center">
              {form.profile_pic ? (
                <img src={form.profile_pic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*"
              className="hidden" 
              onChange={handleImageUpload} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono font-bold tracking-widest text-[var(--atlas-cyan)]"
            >
              UPLOAD
            </button>
            {form.profile_pic && (
              <button 
                type="button"
                onClick={() => setForm({ ...form, profile_pic: null })}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500/80 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          <div>
            <h4 className="font-display text-white text-lg tracking-wider">IDENTITY AVATAR</h4>
            <p className="text-white/40 text-xs font-mono mt-1">Upload a circular profile photo for your passport and chat identity.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="FULL NAME"
            value={form.full_name}
            onChange={(v) => setForm({ ...form, full_name: v })}
          />
          <Field
            label="CALLSIGN / NICKNAME"
            value={form.nickname}
            onChange={(v) => setForm({ ...form, nickname: v })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="TELEPHONE SECURE LINE"
            value={form.phone_number}
            onChange={(v) => setForm({ ...form, phone_number: v })}
          />
          <Field
            label="CITY OF RESIDENCE"
            value={form.city_of_residence}
            onChange={(v) => setForm({ ...form, city_of_residence: v })}
          />
        </div>

        <Field
          label="PAST EXPERIENCE LOGS"
          isTextArea
          rows={3}
          value={form.past_experience}
          onChange={(v) => setForm({ ...form, past_experience: v })}
        />

        <Field
          label="DIETARY REQUIREMENTS"
          isTextArea
          rows={2}
          value={form.dietary_instructions}
          onChange={(v) => setForm({ ...form, dietary_instructions: v })}
        />

        <div className="border-t border-white/5 pt-4">
          <button type="submit" className="btn-atlas">
            SAVE OPERATOR DOSSIER
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------
// Tab Sub-component: AccountingCalendar
// ----------------------------------------------------
function AccountingCalendar({ delegate }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const data = await getDelegateTasks(delegate.id);
      setTasks(data);
      setLoading(false);
    };
    fetchTasks();
  }, [delegate.id]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      time: newTaskTime.trim() || "TBD",
      completed: false,
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTaskTitle("");
    setNewTaskTime("");
    await saveDelegateTasks(delegate.id, updatedTasks);
    toast.success("TASK SCHEDULED", { description: "Accounting task saved." });
  };

  const toggleTask = async (id) => {
    const updatedTasks = tasks.map((t) => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);
    await saveDelegateTasks(delegate.id, updatedTasks);
  };

  const deleteTask = async (id) => {
    const updatedTasks = tasks.filter((t) => t.id !== id);
    setTasks(updatedTasks);
    await saveDelegateTasks(delegate.id, updatedTasks);
    toast.success("TASK REMOVED");
  };

  if (loading) {
    return <div className="text-white/50 text-xs font-mono">LOADING SCHEDULES...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-cyan)] text-xs block">
          / ACCOUNTING SCHEDULES
        </span>
        <h3 className="font-display text-white text-2xl">FINANCE & LOGISTICS TO-DO</h3>
      </div>

      <div className="max-w-[700px] space-y-6">
        <form onSubmit={handleAddTask} className="glass rounded border border-white/5 p-5 space-y-4">
          <h4 className="font-mono text-xs text-white/50 uppercase tracking-widest">Schedule New Task</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Task Description..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[var(--atlas-cyan)] transition-colors placeholder:text-white/30 font-mono"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Time / Deadline"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[var(--atlas-cyan)] transition-colors placeholder:text-white/30 font-mono"
              />
            </div>
          </div>
          <button type="submit" className="btn-atlas w-full !text-xs !py-2">
            ADD TASK
          </button>
        </form>

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="glass rounded p-8 border border-white/5 text-center text-white/30 text-xs font-mono">
              NO ACCOUNTING TASKS CONFIGURED
            </div>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                className={`glass rounded border p-4 flex items-center justify-between gap-4 transition-all ${
                  t.completed
                    ? "border-emerald-500/20 bg-emerald-500/[0.02] opacity-65"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                <div 
                  className="flex-grow cursor-pointer space-y-1" 
                  onClick={() => toggleTask(t.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] tracking-widest text-[var(--atlas-cyan)] font-bold font-mono">
                      {t.time}
                    </span>
                  </div>
                  <h4 className={`font-display text-white text-sm sm:text-base ${t.completed ? "line-through text-white/50" : ""}`}>
                    {t.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleTask(t.id)}
                    className={`w-6 h-6 rounded border flex items-center justify-center font-mono text-xs transition-colors ${
                      t.completed
                        ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                        : "border-white/15 text-transparent hover:border-white/40"
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="w-6 h-6 rounded border border-red-500/30 text-red-400 hover:bg-red-500/20 flex items-center justify-center text-xs transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Sub-component: AnnouncementsDesk (Command Dispatches)
// ----------------------------------------------------
function AnnouncementsDesk() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await getBroadcastHistory();
        setAnnouncements(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (err) {
        console.error("Failed to load announcements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 15000); // Check for new updates every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-white/50 text-xs font-mono">FETCHING DISPATCHES...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-cyan)] text-xs block">
          / COMMAND DISPATCHES
        </span>
        <h3 className="font-display text-white text-2xl uppercase">EVENT ANNOUNCEMENTS</h3>
        <p className="text-white/50 text-xs font-mono mt-1">Live updates broadcasted from the Secretariat Command Center.</p>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="glass rounded border border-white/5 p-8 text-center text-white/30 text-xs font-mono">
            NO DISPATCHES AVAILABLE
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="glass rounded border border-[var(--atlas-cyan)]/20 p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--atlas-cyan)] opacity-50" />
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-display text-white text-lg tracking-wider">{a.subject}</h4>
                <span className="text-[10px] text-white/40 font-mono shrink-0 ml-4">
                  {new Date(a.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-white/70 text-sm font-mono leading-relaxed whitespace-pre-wrap">{a.body}</p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--atlas-cyan)] animate-pulse" />
                <span className="text-[9px] font-mono text-[var(--atlas-cyan)] tracking-widest font-bold">VERIFIED SENDER: COMMAND SECRETARIAT</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Sub-component: EncryptedChat (Global Live Chat)
// ----------------------------------------------------
function EncryptedChat({ delegate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messageEndRef = useRef(null);

  // Subscribe to Global Chat
  useEffect(() => {
    const unsubscribe = subscribeToChat("GLOBAL", (newMessages) => {
      setMessages(newMessages);
    });
    return () => unsubscribe();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    await sendChatMessage("GLOBAL", delegate, text);
  };

  return (
    <div className="h-full flex flex-col border border-white/5 rounded-md overflow-hidden glass">
      {/* Active Contact Header */}
      <div className="p-3 md:p-4 border-b border-white/5 bg-black/10 shrink-0 flex items-center justify-between">
        <div>
          <h4 className="text-white text-sm font-bold font-mono tracking-widest">
            GLOBAL LOBBY
          </h4>
          <span className="text-[8.5px] tracking-widest text-[var(--atlas-cyan)] block mt-0.5">
            STATUS · LIVE MULTIPLAYER TERMINAL
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--atlas-cyan)] animate-pulse shadow-[0_0_8px_var(--atlas-cyan)]" />
          <span className="text-[9px] text-[var(--atlas-cyan)] font-mono tracking-widest font-bold">ONLINE</span>
        </div>
      </div>

      {/* Message Logs */}
      <div className="flex-grow overflow-y-auto p-4 space-y-5 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const isUser = m.sender_id === delegate.id;
            return (
              <motion.div
                key={m.id || m.timestamp}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="shrink-0 w-8 h-8 rounded-full border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden self-end mb-1">
                    {m.sender_profile_pic ? (
                      <img src={m.sender_profile_pic} alt="PFP" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px]">👤</span>
                    )}
                  </div>
                  <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <span className="text-[8px] md:text-[9px] text-white/40 font-mono tracking-widest mb-1 px-1">
                      {m.sender_name} ({m.sender_country}) · {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <div
                      className={`rounded-2xl p-3 md:p-3.5 text-xs md:text-sm leading-relaxed shadow-xl ${
                        isUser
                          ? "bg-[var(--atlas-cyan)]/20 border border-[var(--atlas-cyan)]/40 text-white rounded-br-none"
                          : "bg-[#140b1e]/90 border border-white/10 text-white/90 rounded-bl-none"
                      }`}
                      style={{ backdropFilter: "blur(4px)" }}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messageEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 border-t border-white/5 bg-black/20 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2 md:gap-3 relative">
          <input
            type="text"
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--atlas-cyan)]/50 transition-colors"
            placeholder="Broadcast to all delegates..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 bg-[var(--atlas-cyan)] text-black px-5 md:px-6 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-bold tracking-widest hover:bg-white hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center min-w-[80px]"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Sub-component: NotepadConsole
// ----------------------------------------------------
function NotepadConsole({ delegate }) {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotes = async () => {
      const data = await getDelegateNotes(delegate.id);
      setNotes(data);
      if (data.length > 0) {
        setActiveNoteId(data[0].id);
      }
      setLoading(false);
    };
    loadNotes();
  }, [delegate]);

  const handleCreateNote = async () => {
    const newNote = {
      id: Date.now().toString(),
      title: "New Secure Note",
      content: "",
      updated_at: new Date().toISOString()
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setActiveNoteId(newNote.id);
    await saveDelegateNotes(delegate.id, updated);
  };

  const handleSave = async (id, field, value) => {
    setSaving(true);
    const updated = notes.map(n => 
      n.id === id ? { ...n, [field]: value, updated_at: new Date().toISOString() } : n
    );
    setNotes(updated);
    await saveDelegateNotes(delegate.id, updated);
    setTimeout(() => setSaving(false), 500);
  };

  const handleDelete = async (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (activeNoteId === id) {
      setActiveNoteId(updated.length > 0 ? updated[0].id : null);
    }
    await saveDelegateNotes(delegate.id, updated);
    toast.success("NOTE ERASED", { description: "Memory scrubbed securely." });
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  if (loading) return <div className="text-white/50 font-mono text-xs">DECRYPTING MEMORY BANKS...</div>;

  return (
    <div className="space-y-6 h-full flex flex-col max-w-[1000px]">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
        <div>
          <span className="classified-label text-amber-400 text-xs block">
            / SECURE MEMORY DESK
          </span>
          <h3 className="font-display text-white text-2xl">DELEGATE NOTEPAD</h3>
        </div>

        <button onClick={handleCreateNote} className="btn-atlas !py-2 !text-xs">
          + NEW NOTE
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-grow min-h-[500px]">
        {/* Notes Index / History */}
        <div className="w-full md:w-[250px] shrink-0 space-y-2 overflow-y-auto pr-2 scrollbar-thin">
          {notes.length === 0 ? (
            <div className="text-white/30 text-xs font-mono p-4 glass rounded border border-white/5 text-center">
              NO NOTES FOUND
            </div>
          ) : (
            notes.map(n => (
              <div 
                key={n.id}
                onClick={() => setActiveNoteId(n.id)}
                className={`p-3 rounded border cursor-pointer transition-all flex justify-between items-start group ${
                  activeNoteId === n.id 
                    ? "bg-amber-500/10 border-amber-500/30" 
                    : "glass border-white/5 hover:border-white/10"
                }`}
              >
                <div className="overflow-hidden">
                  <h4 className="text-white text-sm font-bold truncate">{n.title || "Untitled Note"}</h4>
                  <p className="text-white/40 text-[9px] font-mono mt-1">
                    {new Date(n.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Active Note Editor */}
        {activeNote ? (
          <div className="glass rounded border border-white/5 p-4 flex flex-col flex-grow relative">
            <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-3">
              <input 
                type="text" 
                value={activeNote.title}
                onChange={(e) => handleSave(activeNote.id, "title", e.target.value)}
                placeholder="Note Title"
                className="bg-transparent outline-none text-white font-display text-xl w-full"
              />
              <span className="text-[9.5px] font-mono tracking-widest text-white/35 shrink-0 ml-4">
                {saving ? "SAVING..." : "AUTO-SAVED"}
              </span>
            </div>
            <textarea
              value={activeNote.content}
              onChange={(e) => handleSave(activeNote.id, "content", e.target.value)}
              placeholder="Begin typing session logs, resolution clause outlines, debate points, or caucusing notes here..."
              className="w-full flex-grow bg-transparent outline-none border-none text-white font-mono text-sm leading-relaxed resize-none scrollbar-thin placeholder:text-white/20"
            />
          </div>
        ) : (
          <div className="glass rounded border border-white/5 p-4 flex flex-col flex-grow items-center justify-center text-white/20 font-mono text-xs">
            SELECT OR CREATE A NOTE TO BEGIN
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Sub-component: AIChatbot (Command AI w/ Gemini)
// ----------------------------------------------------
function AIChatbot({ delegate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const hist = await getAIChatHistory(delegate.id);
      if (hist.length > 0) {
        setMessages(hist);
      } else {
        const welcomeMsg = [{ sender: "System", text: "Welcome to MUN AI Command. Powered by Groq Llama-3. Ask me about MUN rules of procedure, crisis points, or resolution planning.", timestamp: new Date().toISOString() }];
        setMessages(welcomeMsg);
        await saveAIChatHistory(delegate.id, welcomeMsg);
      }
      setHistoryLoaded(true);
    };
    fetchHistory();
  }, [delegate.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !historyLoaded) return;

    const userMsg = {
      sender: "You",
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    await saveAIChatHistory(delegate.id, updated);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are MUN Cognitive Command, an AI assistant for the Atlas Union Summit 2026. 
You are currently assisting ${delegate?.name || "a Delegate"}, representing ${delegate?.country || "their nation"} in the ${delegate?.committee || "GUEST"} committee. 
Help them with Model UN rules of procedure, resolution drafting, and diplomacy. 
Keep your responses concise, professional, and slightly futuristic/cybernetic in tone.`
            },
            ...updated.map((msg) => ({
              role: msg.sender === "You" ? "user" : "assistant",
              content: msg.text,
            }))
          ]
        })
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error && errData.error.message) {
            errorMsg = errData.error.message;
          }
        } catch {
          // keep default errorMsg
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const reply = data.choices[0].message.content;

      const finalMessages = [...updated, {
        sender: "AI COMMAND",
        text: reply,
        timestamp: new Date().toISOString(),
      }];
      setMessages(finalMessages);
      await saveAIChatHistory(delegate.id, finalMessages);
    } catch (error) {
      console.error("Groq Error:", error);
      const finalMessages = [...updated, {
        sender: "System",
        text: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      }];
      setMessages(finalMessages);
      await saveAIChatHistory(delegate.id, finalMessages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[700px] h-[70vh] max-h-[550px] min-h-[380px] border border-white/5 rounded-md flex flex-col glass overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-black/10 shrink-0 flex justify-between items-center">
        <div>
          <h4 className="text-white text-xs font-bold font-mono">MUN COGNITIVE COMMAND</h4>
          <span className="text-[8.5px] tracking-widest text-[var(--atlas-gold)] block">
            CLASSIFICATION · ADVISORY NODE (GEMINI)
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((m, idx) => {
          const isUser = m.sender === "You";
          const isSystem = m.sender === "System";
          return (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] ${
                isUser ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <span className="text-[8.5px] text-white/30 font-mono tracking-wider mb-1">
                {m.sender} · {new Date(m.timestamp).toLocaleTimeString()}
              </span>
              <div
                className={`rounded p-3 text-xs leading-relaxed ${
                  isUser
                    ? "bg-[var(--atlas-cyan)]/10 border border-[var(--atlas-cyan)]/25 text-white"
                    : isSystem
                    ? "bg-white/[0.02] border border-white/5 text-white/50 italic"
                    : "bg-[#0b0212]/80 border border-[var(--atlas-gold)]/25 text-[var(--atlas-gold)] shadow-[0_0_8px_rgba(201,164,76,0.08)] whitespace-pre-wrap"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="mr-auto items-start max-w-[80%]">
            <span className="text-[8.5px] text-white/30 font-mono tracking-wider">
              AI COMMAND is computing...
            </span>
            <div className="rounded p-3 bg-[#0b0212]/80 border border-[var(--atlas-gold)]/20 text-[var(--atlas-gold)]/40 text-xs italic mt-1">
              Querying Gemini neural protocol nodes...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-black/10 shrink-0 flex gap-2">
        <input
          disabled={loading}
          placeholder="Ask MUN advisor a query..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow bg-transparent border border-white/10 rounded px-3 py-2 outline-none text-xs text-white focus:border-[var(--atlas-gold)] disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-atlas !py-2 !px-4 !text-xs shrink-0 disabled:opacity-45"
        >
          QUERY
        </button>
      </form>
    </div>
  );
}


// Global Form Field helper
function Field({
  label,
  placeholder = "",
  type = "text",
  required = false,
  isTextArea = false,
  rows = 3,
  value = "",
  onChange,
  className = "",
}) {
  return (
    <div className={className}>
      <label className="text-[9.5px] tracking-widest text-white/50 block font-mono">
        {label}
      </label>
      {isTextArea ? (
        <textarea
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full mt-1.5 bg-transparent border-b border-white/10 focus:border-[var(--atlas-cyan)] outline-none py-2 text-white text-xs leading-relaxed transition-all placeholder:text-white/20 font-mono"
        />
      ) : (
        <input
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full mt-1.5 bg-transparent border-b border-white/10 focus:border-[var(--atlas-cyan)] outline-none py-2 text-white text-xs transition-all placeholder:text-white/20 font-mono"
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// Sub-component: RestrictedOverlay
// ----------------------------------------------------
function RestrictedOverlay({ delegate, onRequestAccess, children }) {
  if (delegate.role === "admin" || delegate.role === "delegate") {
    return <>{children}</>;
  }

  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full pointer-events-none filter blur-[6px] opacity-25 select-none transition-all duration-500">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-strong rounded-md p-8 max-w-[420px] w-full border border-[var(--atlas-gold)]/20 shadow-[0_0_30px_rgba(201,164,76,0.1)] flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border border-[var(--atlas-gold)]/40 flex items-center justify-center text-[var(--atlas-gold)] text-xl mb-5 bg-[var(--atlas-gold)]/5">
            🔒
          </div>
          <h3 className="font-display text-white text-2xl mb-3">ACCESS RESTRICTED</h3>
          <p className="text-white/60 font-mono text-[11px] mb-6 leading-[1.8]">
            {delegate.role === "pending" 
              ? "Your payment is pending approval. Command registry is verifying your dossier."
              : "these tools are really really tools, aren't they? Register now!"}
          </p>
          {delegate.role !== "pending" && (
            <button onClick={onRequestAccess} className="btn-atlas w-full text-center flex justify-center py-3">
              ATLAS PAY INTERFACE <span>↗</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
