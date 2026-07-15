import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { signOutUser } from "@/lib/atlasApi";

// Coachella Specific Components
function PassInfo({ delegate }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-gold)] text-xs block mb-1">
          / IDENTITY VERIFICATION
        </span>
        <h3 className="font-display text-white text-2xl uppercase tracking-wider">
          ARTIST PASS INFO
        </h3>
      </div>
      
      <div className="flex-1 glass-strong rounded p-8 border border-white/5 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        {/* Pass Visual */}
        <div className="w-full lg:w-1/3 aspect-[3/4] rounded-lg bg-gradient-to-br from-[#c9a44c]/20 to-black border border-[#c9a44c]/50 flex flex-col items-center justify-center p-6 relative overflow-hidden shadow-[0_0_30px_rgba(201,164,76,0.15)]">
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#c9a44c]"></div>
          <h2 className="font-display text-[#c9a44c] text-3xl mb-8 tracking-widest text-center">COACHELLA<br/>2026</h2>
          
          <div className="w-24 h-24 rounded bg-black/40 border border-white/10 mb-6 flex items-center justify-center">
            <span className="text-4xl">🎟️</span>
          </div>
          
          <div className="text-center w-full mt-auto">
            <div className="font-display text-white text-xl truncate">{delegate.full_name}</div>
            <div className="font-mono text-xs text-[#c9a44c] mt-2 uppercase tracking-widest border-t border-white/10 pt-2">
              {delegate.portfolio || "GENERAL ADMISSION"}
            </div>
            <div className="font-mono text-[9px] text-white/40 mt-1 uppercase tracking-widest">
              ID: {delegate.id}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="w-full lg:w-2/3 space-y-6">
           <div className="bg-white/5 border border-white/10 rounded p-6">
             <h4 className="font-mono text-[10px] tracking-widest text-[#c9a44c] mb-4">ACCESS CREDENTIALS</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
               <div>
                 <span className="text-white/40 block text-[9px] mb-1">EMAIL</span>
                 <span className="text-white">{delegate.email}</span>
               </div>
               <div>
                 <span className="text-white/40 block text-[9px] mb-1">STATUS</span>
                 <span className="text-emerald-400">VERIFIED ACTIVE</span>
               </div>
               <div>
                 <span className="text-white/40 block text-[9px] mb-1">PHONE</span>
                 <span className="text-white">{delegate.phone || "N/A"}</span>
               </div>
               <div>
                 <span className="text-white/40 block text-[9px] mb-1">TICKET TIER</span>
                 <span className="text-[#c9a44c]">ALL ACCESS VIP</span>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function Lineup() {
  const artists = [
    { time: "18:00", name: "THE WEEKND", stage: "MAIN STAGE" },
    { time: "20:00", name: "ARCTIC MONKEYS", stage: "MAIN STAGE" },
    { time: "22:00", name: "DAFT PUNK", stage: "SAHARA TENT" },
    { time: "00:00", name: "TAME IMPALA", stage: "MAIN STAGE" }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-cyan)] text-xs block mb-1">
          / LINEUP & PERFORMANCES
        </span>
        <h3 className="font-display text-white text-2xl uppercase tracking-wider">
          ARTIST ROSTER
        </h3>
      </div>
      
      <div className="grid gap-4">
        {artists.map((artist, idx) => (
          <div key={idx} className="glass rounded p-6 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-white/5 transition-colors group">
            <div>
              <h4 className="font-display text-2xl text-white group-hover:text-[var(--atlas-cyan)] transition-colors">{artist.name}</h4>
              <p className="font-mono text-xs text-white/40 mt-1 tracking-widest">{artist.stage}</p>
            </div>
            <div className="mt-4 sm:mt-0 px-4 py-2 border border-[var(--atlas-cyan)]/30 text-[var(--atlas-cyan)] bg-[var(--atlas-cyan)]/10 rounded font-mono text-xl">
              {artist.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Schedule() {
  const timings = [
    { time: "14:00", event: "GATES OPEN" },
    { time: "15:00", event: "FOOD & DRINK STANDS OPEN" },
    { time: "17:30", event: "OPENING CEREMONY" },
    { time: "18:00", event: "LIVE PERFORMANCES BEGIN" },
    { time: "02:00", event: "CURFEW / GATES CLOSE" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-cyan)] text-xs block mb-1">
          / FESTIVAL SCHEDULE
        </span>
        <h3 className="font-display text-white text-2xl uppercase tracking-wider">
          TIMINGS & ITINERARY
        </h3>
      </div>
      
      <div className="space-y-4">
        {timings.map((t, idx) => (
          <div key={idx} className="flex items-center gap-6 glass rounded p-4 border border-white/5 relative">
            <div className="w-16 shrink-0 font-mono text-lg text-[#c9a44c]">
              {t.time}
            </div>
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
            <div className="font-mono text-xs sm:text-sm tracking-widest text-white/80">
              {t.event}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UrgentSafetyContact({ delegate }) {
  const executives = [
    { name: "EXECUTIVE DIRECTOR", number: "+12345678901", role: "Primary Emergency Contact" },
    { name: "HEAD OF SECURITY", number: "+19876543210", role: "Safety & Medical Escalation" },
    { name: "LOGISTICS COORDINATOR", number: "+11223344556", role: "Venue & Access Issues" }
  ];

  const handleWhatsAppClick = (number) => {
    const message = `URGENT: I am facing an issue at the ATLAS Summit and require immediate assistance. My details: 
Name: ${delegate.full_name}
ID: ${delegate.id}`;
    
    const url = `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-red-500/20 pb-4">
        <span className="classified-label text-red-500 text-xs block mb-1">
          / PRIORITY ESCALATION
        </span>
        <h3 className="font-display text-red-400 text-2xl uppercase tracking-wider">
          URGENT SAFETY CONTACT
        </h3>
        <p className="font-mono text-xs text-white/40 mt-2">
          If you are experiencing an emergency, require medical assistance, or face a severe logistical issue, contact our executive team immediately.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {executives.map((exec, idx) => (
          <div key={idx} className="glass border border-red-500/20 rounded p-6 flex flex-col justify-between">
            <div>
              <h4 className="font-display text-white text-lg tracking-wider mb-1">{exec.name}</h4>
              <p className="font-mono text-[9px] text-red-400/80 uppercase tracking-widest mb-4">{exec.role}</p>
            </div>
            <button
              onClick={() => handleWhatsAppClick(exec.number)}
              className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] tracking-widest rounded transition-all flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              WHATSAPP CONNECT
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CoachellaDashboard() {
  const navigate = useNavigate();
  const [delegate, setDelegate] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = "COACHELLA DASHBOARD · ATLAS";
    const session = localStorage.getItem("aus_delegate_session");
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.committee !== "Coachella (Simulated Crisis)") {
        navigate("/dashboard");
      } else {
        setDelegate(parsed);
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem("aus_delegate_session");
    try {
      await signOutUser();
    } catch (e) {
      console.error(e);
    }
    setDelegate(null);
    toast.success("DISCONNECTED", { description: "You have securely logged out." });
    navigate("/");
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

      {/* Sidebar navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/45 backdrop-blur-md border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0 shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 border-b border-[#c9a44c]/30 flex items-center justify-between px-6 bg-[#c9a44c]/5 shrink-0">
          <div className="flex flex-col">
            <span className="font-display tracking-widest text-[#c9a44c] font-bold text-lg">
              COACHELLA
            </span>
            <span className="text-[8px] tracking-[0.3em] text-white/50 mt-0.5 uppercase">
              ATTENDEE DASHBOARD
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
            { id: "profile", label: "01 ARTIST PASS INFO", icon: "🎟️" },
            { id: "lineup", label: "02 CONCERT LINEUP", icon: "🎸" },
            { id: "schedule", label: "03 FESTIVAL TIMINGS", icon: "⏱️" },
            { id: "safety", label: "04 URGENT SAFETY CONTACT", icon: "🚨" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded font-mono text-[10.5px] tracking-widest text-left transition-all ${
                activeTab === tab.id
                  ? "bg-[#c9a44c]/20 text-[#c9a44c] border-l-2 border-[#c9a44c]"
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
              COACHELLA LIVE HUB
            </span>
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
              {activeTab === "profile" && <PassInfo delegate={delegate} />}
              {activeTab === "lineup" && <Lineup />}
              {activeTab === "schedule" && <Schedule />}
              {activeTab === "safety" && <UrgentSafetyContact delegate={delegate} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
