import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getActivityLogs,
  getRegistrations,
  saveRegistrations,
  getDelegates,
  saveDelegates,
  getPayments,
  savePayments,
  getEvents,
  saveEvents,
  getConferenceSettings,
  saveConferenceSettings,
  getBroadcastHistory,
  saveBroadcastHistory,
  addActivityLog,
  signInWithGoogle,
  signOutUser,
  getPasses,
  revokePass,
  activatePass,
  scanPass,
  bulkGeneratePasses,
} from "@/lib/atlasApi";
import { toast } from "sonner";

const COMMITTEES = [
  "UNSC (United Nations Security Council)",
  "UNGA (United Nations General Assembly)",
  "AIPPM (All India Political Parties Meet)",
  "UNCSW (UN Commission on the Status of Women)",
  "UNFCCC (UN Framework Convention on Climate Change)",
  "Coachella (Simulated Crisis)",
  "International Press",
  "Vaidya Council (Premium)",
  "Simulation Corps (Premium)",
  "F1 Simulation (Premium)",
];

// Default admin settings / templates
const ADMIN_EMAIL = "atlasunionsummit@gmail.com";

export default function AdminPanel() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("aus_admin_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Core Data States
  const [delegates, setDelegates] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState({});
  const [broadcasts, setBroadcasts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all mock data
  const refreshData = async () => {
    setLoading(true);
    try {
      const [d, r, p, e, s, b, l] = await Promise.all([
        getDelegates(),
        getRegistrations(),
        getPayments(),
        getEvents(),
        getConferenceSettings(),
        getBroadcastHistory(),
        getActivityLogs(),
      ]);
      setDelegates(d);
      setRegistrations(r);
      setPayments(p);
      setEvents(e);
      setSettings(s);
      setBroadcasts(b);
      setActivityLogs(l);
    } catch (err) {
      toast.error("DATA FETCH FAILED");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  const handleLogout = async () => {
    localStorage.removeItem("aus_admin_user");
    try {
      await signOutUser();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    toast.success("LOGGED OUT", { description: "Session terminated." });
  };

  const handleLoginSuccess = (email) => {
    const adminUser = { email, token: "MOCK_TOKEN_" + Date.now() };
    localStorage.setItem("aus_admin_user", JSON.stringify(adminUser));
    setUser(adminUser);
    toast.success("ACCESS GRANTED", { description: `Logged in as ${email}` });
    addActivityLog(`Admin session started by ${email}`);
  };

  if (!user) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[var(--atlas-black)] text-[#F5F1FF] flex font-mono select-none">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={handleLogout}
        userEmail={user.email}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-black/20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/60 hover:text-white lg:hidden"
            >
              ☰
            </button>
            <span className="font-display text-lg tracking-wider">
              {settings.conference_name?.toUpperCase() || "ATLAS UNION MUN"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-[var(--atlas-cyan)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--atlas-cyan)] animate-pulse" />
              LIVE TELEMETRY
            </span>
            <button
              onClick={refreshData}
              className="px-2.5 py-1 rounded border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-[10px]"
            >
              REFRESH
            </button>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border border-t-[var(--atlas-gold)] border-white/10 animate-spin" />
              <span className="text-[10px] tracking-[0.2em] text-white/55">FETCHING ENCRYPTED DOSSIER...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === "dashboard" && (
                  <DashboardOverview
                    delegates={delegates}
                    registrations={registrations}
                    payments={payments}
                    events={events}
                    logs={activityLogs}
                  />
                )}
                {activeTab === "delegates" && (
                  <DelegateManager
                    delegates={delegates}
                    onUpdate={async (newDelegates) => {
                      setDelegates(newDelegates);
                      await saveDelegates(newDelegates);
                    }}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "payments" && (
                  <PaymentTracker
                    payments={payments}
                    onUpdate={async (newPayments) => {
                      setPayments(newPayments);
                      await savePayments(newPayments);
                    }}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "registrations" && (
                  <RegistrationAuditor
                    registrations={registrations}
                    delegates={delegates}
                    payments={payments}
                    emailTemplateConf={settings.email_template_confirmation}
                    emailTemplateRej={settings.email_template_rejection}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "events" && (
                  <EventManager
                    events={events}
                    delegates={delegates}
                    onUpdate={async (newEvents) => {
                      setEvents(newEvents);
                      await saveEvents(newEvents);
                    }}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "reports" && (
                  <ReportsAnalytics
                    delegates={delegates}
                    payments={payments}
                  />
                )}
                {activeTab === "broadcast" && (
                  <NotificationSender
                    broadcasts={broadcasts}
                    delegates={delegates}
                    onUpdate={async (newBroadcasts) => {
                      setBroadcasts(newBroadcasts);
                      await saveBroadcastHistory(newBroadcasts);
                    }}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "settings" && (
                  <ConferenceSettings
                    settings={settings}
                    onUpdate={async (newSettings) => {
                      setSettings(newSettings);
                      await saveConferenceSettings(newSettings);
                    }}
                  />
                )}
                {activeTab === "passes" && (
                  <PassLedgerAndScanner
                    delegates={delegates}
                    onRefresh={refreshData}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

// ----------------------------------------------------
// Component: AdminLogin
// ----------------------------------------------------
function AdminLogin({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user.email.toLowerCase() === ADMIN_EMAIL) {
        onLoginSuccess(user.email.toLowerCase());
      } else {
        await signOutUser();
        toast.error("ACCESS DENIED", {
          description: "This Google Account is not authorized to access the Admin Command.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("AUTHENTICATION FAILED", {
        description: "Google Auth was cancelled or encountered an error.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--atlas-black)] flex items-center justify-center p-4 relative font-mono select-none">
      <div className="absolute inset-0 grid-bg opacity-[0.03]" />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] glass-strong rounded-md p-8 border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--atlas-gold)] to-transparent" />
        
        <div className="text-center">
          <span className="text-[10px] tracking-[0.3em] text-[var(--atlas-gold)] font-bold">
            / ATLAS SECURE AUDIT
          </span>
          <h2 className="font-display text-white text-3xl mt-2">ADMIN LOGIN</h2>
          <p className="text-white/40 text-[10.5px] mt-1.5 leading-relaxed">
            Google Account Identity Authorization Required.<br />
            Only the command account <span className="text-[var(--atlas-cyan)]">{ADMIN_EMAIL}</span> is authorized.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn-atlas w-full text-center flex items-center justify-center py-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border border-t-[var(--atlas-gold)] border-white/20 animate-spin" />
                AUTHENTICATING...
              </span>
            ) : (
              "SIGN IN WITH GOOGLE ↗"
            )}
          </button>
        </div>

        <div className="mt-8 border-t border-white/5 pt-4 text-center">
          <span className="text-[8.5px] text-white/30 tracking-widest">
            ◇ SECURE CHANNEL ◇ END-TO-END AUDITED
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------
// Component: AdminSidebar
// ----------------------------------------------------
function AdminSidebar({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout, userEmail }) {
  const tabs = [
    { id: "dashboard", label: "01 DASHBOARD", icon: "⟁" },
    { id: "delegates", label: "02 DELEGATES", icon: "👤" },
    { id: "payments", label: "03 PAYMENTS", icon: "💳" },
    { id: "registrations", label: "04 REGISTRATIONS", icon: "📥" },
    { id: "events", label: "05 EVENTS", icon: "📅" },
    { id: "reports", label: "06 REPORTS", icon: "📊" },
    { id: "broadcast", label: "07 BROADCAST", icon: "📢" },
    { id: "settings", label: "08 SETTINGS", icon: "⚙" },
    { id: "passes", label: "09 WALLET PASSES", icon: "🎟️" },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/40 backdrop-blur-lg border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0 shrink-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20">
        <span className="font-mono text-xs tracking-[0.25em] text-[var(--atlas-gold)] font-bold">
          ATLAS PAY // COMMAND
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/60 hover:text-white lg:hidden"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded font-mono text-[11px] tracking-widest text-left transition-all ${
              activeTab === tab.id
                ? "bg-[var(--atlas-gold)]/10 text-[var(--atlas-gold)] border-l-2 border-[var(--atlas-gold)]"
                : "text-white/55 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Admin User Footer */}
      <div className="border-t border-white/5 p-4 space-y-3 bg-black/10 shrink-0">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] tracking-widest text-white/35">LOGGED IN AS</span>
          <span className="text-[10px] text-white/80 font-semibold truncate select-all">
            {userEmail}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-2 border border-red-500/35 hover:bg-red-500/10 text-red-400 font-mono text-[10.5px] tracking-wider rounded transition-colors"
        >
          DISCONNECT SESSION
        </button>
      </div>
    </aside>
  );
}

// ----------------------------------------------------
// Tab Component: DashboardOverview
// ----------------------------------------------------
function DashboardOverview({ delegates, registrations, payments, events, logs }) {
  const totalDelegates = delegates.length;
  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.price), 0);
  const pendingRegs = registrations.filter((r) => r.status === "pending_verification").length;
  const upcomingEvents = events.length;

  const kpis = [
    { title: "TOTAL DELEGATES", value: totalDelegates, color: "text-[var(--atlas-cyan)]", desc: "Approved dossiers" },
    { title: "TOTAL REVENUE", value: `₹${totalRevenue.toLocaleString()}`, color: "text-[var(--atlas-gold)]", desc: "Verified payments" },
    { title: "PENDING AUDITS", value: pendingRegs, color: "text-purple-400", desc: "Awaiting review" },
    { title: "ACTIVE EVENTS", value: upcomingEvents, color: "text-emerald-400", desc: "Scheduled sessions" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="glass rounded p-5 border border-white/5 flex flex-col justify-between min-h-[120px]">
            <div>
              <span className="text-[9px] tracking-widest text-white/45 block">{kpi.title}</span>
              <span className={`font-display text-3xl mt-2 block font-bold ${kpi.color}`}>
                {kpi.value}
              </span>
            </div>
            <span className="text-[9.5px] text-white/30 tracking-wider block mt-2 border-t border-white/5 pt-1.5">
              ◇ {kpi.desc}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Logs */}
        <div className="lg:col-span-2 glass rounded p-5 border border-white/5 flex flex-col h-[400px]">
          <span className="classified-label text-[var(--atlas-gold)] text-xs mb-4">
            / COMMAND AUDIT LOGS
          </span>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-white/30">
                NO ACTIONS LOGGED
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4 border-b border-white/5 pb-2 text-[11px]">
                  <span className="text-white/80 leading-relaxed">{log.text}</span>
                  <span className="text-white/35 text-[9px] shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="glass rounded p-5 border border-white/5 h-[400px] flex flex-col justify-between">
          <div>
            <span className="classified-label text-[var(--atlas-cyan)] text-xs block mb-4">
              / QUICK SHORTCUTS
            </span>
            <div className="space-y-3">
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded text-xs leading-relaxed">
                <span className="text-[var(--atlas-gold)] font-bold">SUMMIT DATES</span>
                <p className="text-white/60 mt-1">Oct 16 - 18, 2026</p>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded text-xs leading-relaxed">
                <span className="text-[var(--atlas-cyan)] font-bold">SUMMIT VENUE</span>
                <p className="text-white/60 mt-1">Taj Palace, New Delhi, India</p>
              </div>
            </div>
          </div>

          <div className="bg-black/30 border border-[var(--atlas-gold)]/20 rounded-md p-4 text-[10px] text-white/50 leading-relaxed">
            🛡️ <span className="text-white font-bold">LOCAL SESSION IS ENCRYPTED</span><br />
            Data is persisted within local storage. No active Firebase synchronization is configured.
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: DelegateManager
// ----------------------------------------------------
function DelegateManager({ delegates, onUpdate, onRefresh }) {
  const [search, setSearch] = useState("");
  const [filterCommittee, setFilterCommittee] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [editingDelegate, setEditingDelegate] = useState(null);
  const fileInputRef = useRef(null);

  // Filters
  const committees = Array.from(new Set(delegates.map((d) => d.committee)));
  const countries = Array.from(new Set(delegates.map((d) => d.country)));

  const filteredDelegates = delegates.filter((d) => {
    const matchesSearch =
      d.full_name.toLowerCase().includes(search.toLowerCase()) ||
      d.nickname?.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase());
    const matchesCommittee = !filterCommittee || d.committee === filterCommittee;
    const matchesCountry = !filterCountry || d.country === filterCountry;
    return matchesSearch && matchesCommittee && matchesCountry;
  });

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete Delegate: ${name}?`)) {
      const updated = delegates.filter((d) => d.id !== id);
      onUpdate(updated);
      toast.success("DELEGATE DELETED", { description: `${name} has been removed.` });
      addActivityLog(`Delegate ${name} (${id}) was deleted from the register`);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updated = delegates.map((d) => (d.id === editingDelegate.id ? editingDelegate : d));
    onUpdate(updated);
    toast.success("DOSSIER UPDATED");
    addActivityLog(`Delegate details updated for ${editingDelegate.full_name} (${editingDelegate.id})`);
    setEditingDelegate(null);
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ["ID", "Full Name", "Callsign", "Email", "Phone", "Country", "Residence", "Committee", "Experience", "Dietary", "Status", "Joined"];
    const rows = delegates.map((d) => [
      d.id,
      d.full_name,
      d.nickname || "",
      d.email,
      d.phone_number,
      d.country,
      d.city_of_residence,
      d.committee,
      d.past_experience || "",
      d.dietary_instructions || "",
      d.status,
      d.timestamp,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `atlas_delegates_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV DOWNLOADED");
  };

  // CSV Bulk Upload Mock
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        // Skip header
        const parsedDelegates = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
          if (cols.length >= 7) {
            const num = Math.floor(1000 + Math.random() * 9000);
            parsedDelegates.push({
              id: `AUS-DEL-${num}`,
              full_name: cols[1] || cols[0],
              nickname: cols[2] || "",
              email: cols[3] || "bulk@gmail.com",
              phone_number: cols[4] || "+91 XXXXX XXXXX",
              country: cols[5] || "INDIA",
              city_of_residence: cols[6] || "Delhi",
              committee: cols[7] || COMMITTEES[0],
              past_experience: cols[8] || "",
              dietary_instructions: cols[9] || "",
              status: "approved",
              timestamp: new Date().toISOString(),
            });
          }
        }

        if (parsedDelegates.length > 0) {
          const merged = [...delegates, ...parsedDelegates];
          onUpdate(merged);
          toast.success("BULK IMPORT COMPLETED", {
            description: `Imported ${parsedDelegates.length} delegates successfully.`,
          });
          addActivityLog(`Bulk imported ${parsedDelegates.length} delegates via CSV`);
        } else {
          toast.error("INVALID CSV FORMAT");
        }
      } catch (err) {
        toast.error("CSV PROCESSING ERROR");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="classified-label text-[var(--atlas-gold)] text-xs block">
            / OPERATOR REGISTRY
          </span>
          <h3 className="font-display text-white text-2xl">DELEGATE DOSSIERS</h3>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-3 py-1.5 border border-[var(--atlas-cyan)] text-[var(--atlas-cyan)] hover:bg-[var(--atlas-cyan)]/10 text-xs tracking-wider rounded transition-all"
          >
            IMPORT CSV
          </button>
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 border border-[var(--atlas-gold)] text-[var(--atlas-gold)] hover:bg-[var(--atlas-gold)]/10 text-xs tracking-wider rounded transition-all"
          >
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          placeholder="SEARCH BY NAME, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-b border-white/10 focus:border-[var(--atlas-gold)] outline-none py-2 text-xs text-white"
        />

        <select
          value={filterCommittee}
          onChange={(e) => setFilterCommittee(e.target.value)}
          className="bg-transparent border-b border-white/10 focus:border-[var(--atlas-gold)] outline-none py-2 text-xs text-white"
        >
          <option value="" className="bg-[var(--atlas-black)]">ALL COMMITTEES</option>
          {committees.map((c) => (
            <option key={c} value={c} className="bg-[var(--atlas-black)]">
              {c}
            </option>
          ))}
        </select>

        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="bg-transparent border-b border-white/10 focus:border-[var(--atlas-gold)] outline-none py-2 text-xs text-white"
        >
          <option value="" className="bg-[var(--atlas-black)]">ALL COUNTRIES</option>
          {countries.map((c) => (
            <option key={c} value={c} className="bg-[var(--atlas-black)]">
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Delegates List Table */}
      <div className="glass rounded border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-[11px] tracking-wide">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-white/50 text-[10px]">
                <th className="p-4 font-semibold">DELEGATE ID</th>
                <th className="p-4 font-semibold">NAME</th>
                <th className="p-4 font-semibold">COMMITTEE</th>
                <th className="p-4 font-semibold">COUNTRY</th>
                <th className="p-4 font-semibold">CITY</th>
                <th className="p-4 font-semibold">STATUS</th>
                <th className="p-4 text-right font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredDelegates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/30">
                    NO RECORD MATCHES CURRENT DATA
                  </td>
                </tr>
              ) : (
                filteredDelegates.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-[var(--atlas-cyan)] font-semibold">{d.id}</td>
                    <td className="p-4">
                      <span className="text-white font-medium block">{d.full_name}</span>
                      {d.nickname && <span className="text-white/40 text-[9.5px]">"{d.nickname}"</span>}
                    </td>
                    <td className="p-4 max-w-[200px] truncate">{d.committee}</td>
                    <td className="p-4 text-[var(--atlas-gold)]">{d.country}</td>
                    <td className="p-4 text-white/60">{d.city_of_residence}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase">
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => setEditingDelegate(d)}
                        className="text-[var(--atlas-gold)] hover:underline"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDelete(d.id, d.full_name)}
                        className="text-red-400 hover:underline"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing Dialog Modal */}
      {editingDelegate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingDelegate(null)} />
          <div className="relative w-full max-w-[500px] glass-strong rounded p-8 border border-white/5">
            <span className="classified-label text-[var(--atlas-gold)] text-xs block">/ EDIT DOSSIER</span>
            <h3 className="font-display text-white text-2xl mt-1">UPDATE RECORD</h3>

            <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="FULL NAME"
                  value={editingDelegate.full_name}
                  onChange={(v) => setEditingDelegate({ ...editingDelegate, full_name: v })}
                />
                <Field
                  label="CALLSIGN"
                  value={editingDelegate.nickname}
                  onChange={(v) => setEditingDelegate({ ...editingDelegate, nickname: v })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="COUNTRY"
                  value={editingDelegate.country}
                  onChange={(v) => setEditingDelegate({ ...editingDelegate, country: v })}
                />
                <Field
                  label="CITY OF RESIDENCE"
                  value={editingDelegate.city_of_residence}
                  onChange={(v) => setEditingDelegate({ ...editingDelegate, city_of_residence: v })}
                />
              </div>

              <div>
                <label className="classified-label text-white/50 text-[10px]">COMMITTEE</label>
                <select
                  value={editingDelegate.committee}
                  onChange={(e) => setEditingDelegate({ ...editingDelegate, committee: e.target.value })}
                  className="w-full bg-transparent border-b border-white/10 focus:border-[var(--atlas-gold)] py-2 outline-none text-white text-xs"
                >
                  {COMMITTEES.map((c) => (
                    <option key={c} value={c} className="bg-[var(--atlas-black)]">{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingDelegate(null)}
                  className="btn-ghost flex-1 text-center py-2.5"
                >
                  CANCEL
                </button>
                <button type="submit" className="btn-atlas flex-1 text-center py-2.5">
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: PaymentTracker
// ----------------------------------------------------
function PaymentTracker({ payments, onUpdate, onRefresh }) {
  const [manualForm, setManualForm] = useState({
    delegate_name: "",
    email: "",
    category: "STANDARD COMMITTEES",
    package_name: "Regular Phase",
    price: 1999,
    utr_number: "",
  });
  const [showManualModal, setShowManualModal] = useState(false);
  const [invoicePay, setInvoicePay] = useState(null);

  const totalCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.price), 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.price), 0);

  const handleRefund = (id, name, amount) => {
    if (confirm(`Process full refund of ₹${amount} to ${name}?`)) {
      const updated = payments.map((p) => (p.id === id ? { ...p, status: "refunded" } : p));
      onUpdate(updated);
      toast.success("REFUND INITIATED", { description: `Processed ₹${amount} refund.` });
      addActivityLog(`Refund processed for ${name} (Ref: ${id}, Amount: ₹${amount})`);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.delegate_name || !manualForm.email || !manualForm.utr_number) {
      toast.error("MISSING MANUAL FIELDS");
      return;
    }

    const newPayment = {
      id: "MAN-" + Math.floor(10000 + Math.random() * 90000),
      delegate_name: manualForm.delegate_name,
      email: manualForm.email,
      category: manualForm.category,
      package_name: manualForm.package_name,
      price: Number(manualForm.price),
      utr_number: manualForm.utr_number,
      status: "paid",
      timestamp: new Date().toISOString(),
    };

    onUpdate([newPayment, ...payments]);
    setShowManualModal(false);
    toast.success("PAYMENT RECORDED", { description: `Logged manual payment under ref ID ${newPayment.id}` });
    addActivityLog(`Manual cash/bank payment recorded for ${manualForm.delegate_name} (UTR: ${manualForm.utr_number})`);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="classified-label text-[var(--atlas-cyan)] text-xs block">
            / TREASURY LEDGER
          </span>
          <h3 className="font-display text-white text-2xl">FINANCIAL TRACKER</h3>
        </div>

        <button
          onClick={() => setShowManualModal(true)}
          className="px-3 py-1.5 border border-[var(--atlas-gold)] text-[var(--atlas-gold)] hover:bg-[var(--atlas-gold)]/10 text-xs tracking-wider rounded transition-all"
        >
          LOG MANUAL PAYMENT
        </button>
      </div>

      {/* Financial Analytics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass rounded border border-white/5 p-5 flex justify-between items-center">
          <div>
            <span className="text-[9px] tracking-widest text-white/45 block">TOTAL REVENUE COLLECTED</span>
            <span className="font-display text-2xl mt-1 block font-bold text-emerald-400">
              ₹{totalCollected.toLocaleString()}
            </span>
          </div>
          <span className="text-xs text-white/20">💰 PAID</span>
        </div>

        <div className="glass rounded border border-white/5 p-5 flex justify-between items-center">
          <div>
            <span className="text-[9px] tracking-widest text-white/45 block">TOTAL PENDING INVOICES</span>
            <span className="font-display text-2xl mt-1 block font-bold text-amber-400">
              ₹{totalPending.toLocaleString()}
            </span>
          </div>
          <span className="text-xs text-white/20">🕒 PENDING</span>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="glass rounded border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-[11px] tracking-wide">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-white/50 text-[10px]">
                <th className="p-4 font-semibold">TXN ID</th>
                <th className="p-4 font-semibold">DELEGATE NAME</th>
                <th className="p-4 font-semibold">UTR NUMBER</th>
                <th className="p-4 font-semibold">PACKAGE DETAILED</th>
                <th className="p-4 font-semibold">AMOUNT</th>
                <th className="p-4 font-semibold">STATUS</th>
                <th className="p-4 text-right font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/30">
                    NO PAYMENTS LOGGED YET
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-[var(--atlas-cyan)] font-semibold">{p.id}</td>
                    <td className="p-4">
                      <span className="text-white font-medium block">{p.delegate_name}</span>
                      <span className="text-white/40 text-[9.5px]">{p.email}</span>
                    </td>
                    <td className="p-4 font-semibold text-[var(--atlas-gold)]">{p.utr_number}</td>
                    <td className="p-4">
                      <span className="text-white/80 block">{p.package_name}</span>
                      <span className="text-white/40 text-[9.5px] uppercase">{p.category.replace("⚡ ", "")}</span>
                    </td>
                    <td className="p-4 font-semibold text-white">₹{p.price}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] uppercase border ${
                          p.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : p.status === "refunded"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => setInvoicePay(p)}
                        className="text-[var(--atlas-gold)] hover:underline"
                      >
                        RECEIPT
                      </button>
                      {p.status === "paid" && (
                        <button
                          onClick={() => handleRefund(p.id, p.delegate_name, p.price)}
                          className="text-red-400 hover:underline"
                        >
                          REFUND
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowManualModal(false)} />
          <div className="relative w-full max-w-[500px] glass-strong rounded p-8 border border-white/5">
            <span className="classified-label text-[var(--atlas-gold)] text-xs block">/ MANUAL ENTRY</span>
            <h3 className="font-display text-white text-2xl mt-1">RECORD PAYMENT</h3>

            <form onSubmit={handleManualSubmit} className="mt-6 space-y-4">
              <Field
                label="DELEGATE NAME"
                value={manualForm.delegate_name}
                onChange={(v) => setManualForm({ ...manualForm, delegate_name: v })}
              />

              <Field
                label="EMAIL ADDRESS"
                type="email"
                value={manualForm.email}
                onChange={(v) => setManualForm({ ...manualForm, email: v })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="UTR / CASH REF NUMBER"
                  value={manualForm.utr_number}
                  onChange={(v) => setManualForm({ ...manualForm, utr_number: v })}
                />
                <Field
                  label="PRICE STIPULATED (₹)"
                  type="number"
                  value={manualForm.price}
                  onChange={(v) => setManualForm({ ...manualForm, price: v })}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="btn-ghost flex-1 text-center py-2.5"
                >
                  CANCEL
                </button>
                <button type="submit" className="btn-atlas flex-1 text-center py-2.5">
                  LOG RECEIPT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {invoicePay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setInvoicePay(null)} />
          <div className="relative w-full max-w-[420px] bg-[#0c0514] rounded-lg p-6 border border-[var(--atlas-gold)]/30 text-xs tracking-wider">
            {/* Holographic digital invoice receipt */}
            <div className="text-center space-y-1">
              <span className="text-[9px] text-[var(--atlas-gold)] tracking-[0.3em] font-bold">ATLAS UNION SUMMIT 2026</span>
              <h4 className="font-display text-white text-lg font-bold">OFFICIAL PAYMENT INVOICE</h4>
              <p className="text-white/40 text-[9px]">{new Date(invoicePay.timestamp).toLocaleString()}</p>
            </div>

            <div className="h-[1px] border-b border-dashed border-white/20 my-4" />

            <div className="space-y-2.5 font-mono">
              <div className="flex justify-between">
                <span className="text-white/50">INVOICE REF</span>
                <span className="text-white font-semibold">{invoicePay.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">OPERATOR NAME</span>
                <span className="text-white font-semibold">{invoicePay.delegate_name.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">EMAIL</span>
                <span className="text-white">{invoicePay.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">TRANSACTION UTR</span>
                <span className="text-[var(--atlas-gold)] font-bold">{invoicePay.utr_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">TICKET DETAILS</span>
                <span className="text-white">{invoicePay.package_name}</span>
              </div>
              <div className="h-[1px] border-b border-dashed border-white/20 my-3" />
              <div className="flex justify-between text-sm">
                <span className="text-white font-bold">TOTAL PAID</span>
                <span className="text-[var(--atlas-cyan)] font-bold">₹{invoicePay.price}.00</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-white/50">STATUS STATUS</span>
                <span className="text-emerald-400 font-bold uppercase">{invoicePay.status}</span>
              </div>
            </div>

            <div className="h-[1px] border-b border-dashed border-white/20 my-4" />

            <div className="text-center text-[9px] text-white/30 leading-relaxed font-mono">
              ◇ DIGITAL RECEIPTS ARCHIVED ON DELHI COMMAND CIRCUITS ◇<br />
              This document serves as verification of summit access.
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  window.print();
                }}
                className="btn-atlas w-full text-center py-2"
              >
                PRINT RECEIPT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: RegistrationAuditor
// ----------------------------------------------------
function RegistrationAuditor({ registrations, delegates, payments, emailTemplateConf, emailTemplateRej, onRefresh }) {
  
  const handleApprove = async (reg) => {
    if (confirm(`Approve registration for ${reg.full_name}? This adds them to delegates and creates a payment transaction.`)) {
      // 1. Remove from registrations
      const updatedRegs = registrations.filter((r) => r.registration_id !== reg.registration_id);
      
      // 2. Create Delegate Entry
      const newDelegate = {
        id: `AUS-DEL-${Math.floor(1000 + Math.random() * 9000)}`,
        full_name: reg.full_name,
        nickname: reg.nickname || "",
        email: reg.email,
        phone_number: reg.phone_number,
        country: reg.country,
        city_of_residence: reg.city_of_residence,
        committee: reg.committee,
        past_experience: reg.past_experience || "",
        dietary_instructions: reg.dietary_instructions || "",
        status: "approved",
        timestamp: new Date().toISOString(),
      };
      
      // 3. Create Payment Entry
      const newPayment = {
        id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        delegate_name: reg.full_name,
        email: reg.email,
        category: reg.package_category,
        package_name: reg.package_name,
        price: reg.package_price,
        utr_number: reg.utr_number,
        status: "paid",
        timestamp: new Date().toISOString(),
      };

      // 4. Update Database
      saveRegistrations(updatedRegs);
      saveDelegates([newDelegate, ...delegates]);
      savePayments([newPayment, ...payments]);

      // 5. Mock Email Log details
      const emailContent = emailTemplateConf
        .replace("[NAME]", reg.full_name)
        .replace("[COMMITTEE]", reg.committee)
        .replace("[ID]", newDelegate.id);
      
      console.log(`[SIMULATED EMAIL DISPATCH TO ${reg.email}]:\n${emailContent}`);

      toast.success("DOSSIER APPROVED", {
        description: `Confirmation email dispatched to ${reg.email}.`,
      });
      addActivityLog(`Registration ${reg.registration_id} approved for ${reg.full_name}`);
      onRefresh();
    }
  };

  const handleReject = (reg) => {
    if (confirm(`Reject registration for ${reg.full_name}?`)) {
      const updatedRegs = registrations.filter((r) => r.registration_id !== reg.registration_id);
      saveRegistrations(updatedRegs);

      // Simulated email log
      const emailContent = emailTemplateRej.replace("[NAME]", reg.full_name);
      console.log(`[SIMULATED EMAIL DISPATCH TO ${reg.email}]:\n${emailContent}`);

      toast.error("DOSSIER REJECTED", {
        description: `Rejection email dispatched to ${reg.email}.`,
      });
      addActivityLog(`Registration ${reg.registration_id} rejected for ${reg.full_name}`);
      onRefresh();
    }
  };

  const pendingRegs = registrations.filter((r) => r.status === "pending_verification");

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-purple-400 text-xs block">
          / AUDITOR COMMAND
        </span>
        <h3 className="font-display text-white text-2xl">PENDING REGISTRATIONS</h3>
      </div>

      {pendingRegs.length === 0 ? (
        <div className="glass rounded p-12 border border-white/5 text-center text-white/35">
          🔒 NO REGISTRATIONS PENDING VERIFICATION
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingRegs.map((reg) => (
            <div key={reg.registration_id} className="glass rounded border border-white/5 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--atlas-cyan)] font-semibold text-[11px] font-mono">
                    {reg.registration_id}
                  </span>
                  <span className="text-white/30 text-[9.5px]">
                    {new Date(reg.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-display text-white text-lg font-bold">{reg.full_name}</h4>
                <p className="text-[10px] tracking-wide text-white/45 uppercase font-mono">
                  {reg.package_category.replace("⚡ ", "")} · {reg.package_name} (₹{reg.package_price})
                </p>
                <div className="text-[11px] font-mono leading-relaxed space-y-1 mt-3 text-white/75 bg-black/20 p-3 rounded border border-white/5">
                  <div><span className="text-white/45">Email:</span> {reg.email}</div>
                  <div><span className="text-white/45">Phone:</span> {reg.phone_number}</div>
                  <div><span className="text-white/45">Country/City:</span> {reg.country} / {reg.city_of_residence}</div>
                  <div><span className="text-white/45">Committee:</span> {reg.committee}</div>
                  {reg.past_experience && <div><span className="text-white/45">Exp:</span> {reg.past_experience}</div>}
                  {reg.dietary_instructions && <div><span className="text-white/45">Diet:</span> {reg.dietary_instructions}</div>}
                  <div className="mt-2 text-[var(--atlas-gold)] font-semibold border-t border-white/5 pt-2">
                    UTR: {reg.utr_number}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleReject(reg)}
                  className="flex-1 py-2 rounded border border-red-500/35 hover:bg-red-500/10 text-red-400 font-mono text-[10.5px] tracking-wider transition-colors"
                >
                  REJECT / DECLINE
                </button>
                <button
                  onClick={() => handleApprove(reg)}
                  className="flex-1 py-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10.5px] tracking-wider transition-all"
                >
                  VERIFY & APPROVE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: EventManager
// ----------------------------------------------------
function EventManager({ events, delegates, onUpdate, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ title: "", committee: "ALL", date: "", time: "", venue: "" });

  const handleDelete = (id, name) => {
    if (confirm(`Delete event "${name}"?`)) {
      const updated = events.filter((e) => e.id !== id);
      onUpdate(updated);
      toast.success("EVENT REMOVED");
      addActivityLog(`Event schedule removed: ${name}`);
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || !form.venue) {
      toast.error("ALL DETAILS REQUIRED");
      return;
    }

    const newEvent = {
      id: "EVT-" + Math.floor(100 + Math.random() * 900),
      ...form,
    };

    onUpdate([...events, newEvent]);
    setShowAddModal(false);
    setForm({ title: "", committee: "ALL", date: "", time: "", venue: "" });
    toast.success("EVENT ADDED");
    addActivityLog(`New schedule event added: ${form.title} (${form.time})`);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="classified-label text-emerald-400 text-xs block">
            / SUMMIT SCHEDULER
          </span>
          <h3 className="font-display text-white text-2xl">EVENT CALENDAR</h3>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 border border-[var(--atlas-gold)] text-[var(--atlas-gold)] hover:bg-[var(--atlas-gold)]/10 text-xs tracking-wider rounded transition-all"
        >
          CREATE SCHEDULE EVENT
        </button>
      </div>

      {/* Events schedule lists */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="glass rounded p-12 border border-white/5 text-center text-white/35">
            NO SESSIONS SCHEDULED
          </div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="glass rounded border border-white/5 p-5 flex flex-wrap justify-between items-center gap-4">
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--atlas-cyan)] font-semibold">{e.id}</span>
                  <span className="px-2 py-0.5 rounded border border-white/10 text-[9px] uppercase text-white/50">
                    {e.committee}
                  </span>
                </div>
                <h4 className="font-display text-white text-lg font-bold">{e.title}</h4>
                <div className="flex items-center gap-4 text-white/60 text-[11px]">
                  <span>📅 {e.date}</span>
                  <span>🕒 {e.time}</span>
                  <span>📍 {e.venue}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(e.id, e.title)}
                  className="px-3 py-1 text-red-400 hover:bg-red-500/10 rounded border border-red-500/25 transition-colors text-xs"
                >
                  REMOVE
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-[500px] glass-strong rounded p-8 border border-white/5">
            <span className="classified-label text-[var(--atlas-gold)] text-xs block">/ SCHEDULE EDITOR</span>
            <h3 className="font-display text-white text-2xl mt-1">ADD NEW SESSION</h3>

            <form onSubmit={handleAddSubmit} className="mt-6 space-y-4">
              <Field
                label="EVENT TITLE"
                placeholder="e.g. Session 1: Nuclear Disarmament"
                value={form.title}
                onChange={(v) => setForm({ ...form, title: v })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="DATE"
                  type="date"
                  value={form.date}
                  onChange={(v) => setForm({ ...form, date: v })}
                />
                <Field
                  label="TIMING SESSION"
                  placeholder="e.g. 10:00 - 12:30"
                  value={form.time}
                  onChange={(v) => setForm({ ...form, time: v })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="classified-label text-white/50 text-[10px]">COMMITTEE CATEGORY</label>
                  <select
                    value={form.committee}
                    onChange={(e) => setForm({ ...form, committee: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 focus:border-[var(--atlas-gold)] py-2 outline-none text-white text-xs mt-1"
                  >
                    <option value="ALL" className="bg-[var(--atlas-black)]">ALL DELEGATES</option>
                    {COMMITTEES.map((c) => (
                      <option key={c} value={c} className="bg-[var(--atlas-black)]">{c}</option>
                    ))}
                  </select>
                </div>
                <Field
                  label="VENUE / ROOM"
                  placeholder="e.g. Council Room B"
                  value={form.venue}
                  onChange={(v) => setForm({ ...form, venue: v })}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost flex-1 text-center py-2.5"
                >
                  CANCEL
                </button>
                <button type="submit" className="btn-atlas flex-1 text-center py-2.5">
                  PUBLISH SESSION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: ReportsAnalytics
// ----------------------------------------------------
function ReportsAnalytics({ delegates, payments }) {
  // Aggregate delegate distribution by country
  const countriesData = delegates.reduce((acc, curr) => {
    acc[curr.country] = (acc[curr.country] || 0) + 1;
    return acc;
  }, {});

  // Aggregate delegate distribution by committee
  const committeeData = delegates.reduce((acc, curr) => {
    acc[curr.committee] = (acc[curr.committee] || 0) + 1;
    return acc;
  }, {});

  const maxCountryCount = Math.max(...Object.values(countriesData), 1);
  const maxCommitteeCount = Math.max(...Object.values(committeeData), 1);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-gold)] text-xs block">
          / SUMMIT INTELLIGENCE
        </span>
        <h3 className="font-display text-white text-2xl">ANALYTICS & DISTRIBUTION REPORTS</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Country distribution */}
        <div className="glass rounded border border-white/5 p-5">
          <span className="classified-label text-[var(--atlas-cyan)] text-[10px] block mb-4">
            / DELEGATES DISTRIBUTION BY COUNTRY
          </span>
          <div className="space-y-4">
            {Object.keys(countriesData).length === 0 ? (
              <div className="text-center text-xs text-white/30 py-8">NO COUNTRY DISTRIBUTION</div>
            ) : (
              Object.entries(countriesData).map(([country, count]) => {
                const percent = (count / maxCountryCount) * 100;
                return (
                  <div key={country} className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-white/80">
                      <span>{country.toUpperCase()}</span>
                      <span className="font-bold">{count} ({Math.round(percent)}%)</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--atlas-cyan)] to-[var(--atlas-gold)] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Committee distribution */}
        <div className="glass rounded border border-white/5 p-5">
          <span className="classified-label text-purple-400 text-[10px] block mb-4">
            / DELEGATE TALLY BY COMMITTEE
          </span>
          <div className="space-y-4">
            {Object.keys(committeeData).length === 0 ? (
              <div className="text-center text-xs text-white/30 py-8">NO COMMITTEE RECORDS</div>
            ) : (
              Object.entries(committeeData).map(([comm, count]) => {
                const percent = (count / maxCommitteeCount) * 100;
                return (
                  <div key={comm} className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-white/80">
                      <span className="max-w-[200px] truncate">{comm}</span>
                      <span className="font-bold">{count} dossiers</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-[var(--atlas-gold)] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: NotificationSender
// ----------------------------------------------------
function NotificationSender({ broadcasts, delegates, onUpdate, onRefresh }) {
  const [form, setForm] = useState({ subject: "", targets: "All Delegates", body: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject || !form.body) {
      toast.error("MISSING BROADCAST DETAILS");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newBroadcast = {
        id: "BRD-" + Math.floor(100 + Math.random() * 900),
        subject: form.subject,
        targets: form.targets,
        body: form.body,
        timestamp: new Date().toISOString(),
      };

      onUpdate([newBroadcast, ...broadcasts]);
      setForm({ subject: "", targets: "All Delegates", body: "" });
      setLoading(false);
      toast.success("BROADCAST ANNOUNCED", {
        description: `Notification transmission dispatched to ${delegates.length} delegates.`,
      });
      addActivityLog(`Broadcast bulletin dispatched: ${newBroadcast.subject}`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-amber-400 text-xs block">
          / TELECOMMUNICATION CENTER
        </span>
        <h3 className="font-display text-white text-2xl">BULLETINS & MASS ANNOUNCEMENTS</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast dispatch form */}
        <div className="lg:col-span-1 glass rounded border border-white/5 p-5 h-fit">
          <span className="classified-label text-[var(--atlas-gold)] text-[10px] block mb-4">
            / DISPATCH NEW TRANSMISSION
          </span>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="BULLETIN SUBJECT"
              placeholder="e.g. Mandatory Check-In Security Protocols"
              value={form.subject}
              onChange={(v) => setForm({ ...form, subject: v })}
            />

            <div>
              <label className="classified-label text-white/50 text-[10px]">BROADCAST GROUP TARGET</label>
              <select
                value={form.targets}
                onChange={(e) => setForm({ ...form, targets: e.target.value })}
                className="w-full bg-transparent border-b border-white/10 focus:border-[var(--atlas-gold)] py-2 outline-none text-white text-xs mt-1"
              >
                <option value="All Delegates" className="bg-[var(--atlas-black)]">All Registered Operators ({delegates.length})</option>
                <option value="UNSC Only" className="bg-[var(--atlas-black)]">UNSC Committee Delegates</option>
                <option value="Premium Experiences Only" className="bg-[var(--atlas-black)]">Premium Experiences Only</option>
              </select>
            </div>

            <Field
              label="TRANSMISSION MESSAGE BODY"
              isTextArea
              rows={4}
              placeholder="Type announcement copy here..."
              value={form.body}
              onChange={(v) => setForm({ ...form, body: v })}
            />

            <button type="submit" disabled={loading} className="btn-atlas w-full text-center py-2.5 mt-2">
              {loading ? "TRANSMITTING BULLETINS..." : "DISPATCH BROADCAST ↗"}
            </button>
          </form>
        </div>

        {/* Dispatch logs */}
        <div className="lg:col-span-2 glass rounded border border-white/5 p-5 h-[400px] flex flex-col">
          <span className="classified-label text-[var(--atlas-cyan)] text-[10px] mb-4">
            / BROADCAST BULLETIN ARCHIVE
          </span>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {broadcasts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-white/30">
                NO BULLETIN HISTORY LOGGED
              </div>
            ) : (
              broadcasts.map((b) => (
                <div key={b.id} className="border-b border-white/5 pb-3 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[var(--atlas-cyan)] font-bold">{b.id}</span>
                    <span className="text-white/30">{new Date(b.timestamp).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-white font-bold">{b.subject}</h4>
                  <p className="text-white/45 text-[9px] uppercase">TARGETS: {b.targets}</p>
                  <p className="text-white/70 leading-relaxed mt-1.5">{b.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: ConferenceSettings
// ----------------------------------------------------
function ConferenceSettings({ settings, onUpdate }) {
  const [form, setForm] = useState(settings);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(form);
    toast.success("SYSTEM SETTINGS SAVED");
    addActivityLog("Conference settings and email templates updated");
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-gold)] text-xs block">
          / SUMMIT DIRECTIVES
        </span>
        <h3 className="font-display text-white text-2xl">SYSTEM SETTINGS</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-[650px] glass rounded border border-white/5 p-6">
        <span className="classified-label text-[var(--atlas-cyan)] text-[10px] block border-b border-white/5 pb-2">
          / SUMMIT GENERAL PARAMETERS
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="CONFERENCE DIRECTIVE NAME"
            value={form.conference_name}
            onChange={(v) => setForm({ ...form, conference_name: v })}
          />
          <Field
            label="CONFERENCE DATES"
            value={form.dates}
            onChange={(v) => setForm({ ...form, dates: v })}
          />
          <Field
            label="CONFERENCE VENUE TERMINAL"
            value={form.venue}
            onChange={(v) => setForm({ ...form, venue: v })}
          />
          <Field
            label="REGISTRATION TICKET RANGE"
            value={form.registration_fee}
            onChange={(v) => setForm({ ...form, registration_fee: v })}
          />
        </div>

        <span className="classified-label text-[var(--atlas-gold)] text-[10px] block border-b border-white/5 pb-2 mt-6">
          / SYSTEM NOTIFICATION EMAIL TEMPLATES
        </span>
        <div className="space-y-4">
          <Field
            label="CONFIRMATION / APPROVAL EMAIL COPY"
            isTextArea
            rows={5}
            value={form.email_template_confirmation}
            onChange={(v) => setForm({ ...form, email_template_confirmation: v })}
          />

          <Field
            label="DECLINED / REJECTION EMAIL COPY"
            isTextArea
            rows={5}
            value={form.email_template_rejection}
            onChange={(v) => setForm({ ...form, email_template_rejection: v })}
          />
        </div>

        <div className="border-t border-white/5 pt-4 mt-6">
          <button type="submit" className="btn-atlas">
            COMMIT CONFIGURATIONS
          </button>
        </div>
      </form>
    </div>
  );
}

// Helper Field Component
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
      <label className="text-[9.5px] tracking-widest text-white/50 block">
        {label}
      </label>
      {isTextArea ? (
        <textarea
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full mt-1.5 bg-transparent border-b border-white/10 focus:border-[var(--atlas-gold)] outline-none py-2 text-white text-xs leading-relaxed transition-all placeholder:text-white/20"
        />
      ) : (
        <input
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full mt-1.5 bg-transparent border-b border-white/10 focus:border-[var(--atlas-gold)] outline-none py-2 text-white text-xs transition-all placeholder:text-white/20"
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: PassLedgerAndScanner
// ----------------------------------------------------
export function PassLedgerAndScanner({ delegates, onRefresh }) {
  const [subTab, setSubTab] = useState("ledger"); // "ledger" or "scanner"
  const [passes, setPasses] = useState([]);
  const [loadingPasses, setLoadingPasses] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Scanner State
  const [scannerActive, setScannerActive] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualPassId, setManualPassId] = useState("");
  const [scannedPass, setScannedPass] = useState(null);
  const [scannerError, setScannerError] = useState("");
  const [scanningStatus, setScanningStatus] = useState("idle"); // "idle", "loading", "success", "failed"

  const fetchPassesList = async () => {
    setLoadingPasses(true);
    try {
      const pList = await getPasses();
      setPasses(pList);
    } catch (err) {
      toast.error("FAILED TO FETCH PASSES LEDGER");
    } finally {
      setLoadingPasses(false);
    }
  };

  useEffect(() => {
    fetchPassesList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bulk Generate
  const handleBulkGenerate = async () => {
    toast.loading("BULK GENERATING PASSES...", { id: "bulk-pass" });
    try {
      const generated = await bulkGeneratePasses();
      toast.success(`BULK GENERATION COMPLETE`, {
        id: "bulk-pass",
        description: `Generated ${generated} passes for approved delegates.`,
      });
      fetchPassesList();
      onRefresh();
    } catch (e) {
      toast.error("BULK GENERATION FAILED", { id: "bulk-pass" });
    }
  };

  // Revoke pass
  const handleRevokePass = async (passId, name) => {
    if (confirm(`Are you sure you want to REVOKE the pass for ${name}?`)) {
      const success = await revokePass(passId);
      if (success) {
        toast.success("PASS REVOKED");
        fetchPassesList();
      } else {
        toast.error("REVOCATION FAILED");
      }
    }
  };

  // Activate pass
  const handleActivatePass = async (passId, name) => {
    if (confirm(`Are you sure you want to ACTIVATE the pass for ${name}?`)) {
      const success = await activatePass(passId);
      if (success) {
        toast.success("PASS ACTIVATED");
        fetchPassesList();
      } else {
        toast.error("ACTIVATION FAILED");
      }
    }
  };

  // Handle Scan logic
  const handleScan = async (rawCode) => {
    setScanningStatus("loading");
    setScannerError("");
    
    // Extract pass ID
    let passId = rawCode.trim();
    if (passId.includes("PASS::")) {
      passId = passId.split("PASS::")[1];
    }
    
    try {
      const result = await scanPass(passId, "entry");
      if (result.success) {
        setScannedPass(result.pass);
        setScanningStatus("success");
        toast.success("PASS VALIDATED", { description: `${result.pass.delegate_name} checked-in.` });
        fetchPassesList();
      } else {
        setScanningStatus("failed");
        setScannedPass(null);
        if (result.error === "PASS_NOT_FOUND") {
          setScannerError("INVALID PASS ID: No registered passport found with this signature.");
        } else {
          setScannerError("ERROR CHECKING IN PASS");
        }
      }
    } catch (err) {
      setScanningStatus("failed");
      setScannerError("SCAN EXCEPTION ERROR: Check database connectivity.");
    }
  };

  // Exit Check-in log
  const handleExitScan = async (passId) => {
    try {
      const result = await scanPass(passId, "exit");
      if (result.success) {
        setScannedPass(result.pass);
        toast.success("EXIT RECORDED", { description: `${result.pass.delegate_name} exited venue.` });
        fetchPassesList();
      } else {
        toast.error("EXIT RECORDING FAILED");
      }
    } catch (e) {
      toast.error("DATABASE CONNECTION FAILURE");
    }
  };

  // Load html5-qrcode library script dynamically
  useEffect(() => {
    if (subTab === "scanner" && !window.Html5QrcodeScanner) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode";
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else if (window.Html5QrcodeScanner) {
      setScriptLoaded(true);
    }
  }, [subTab]);

  // Load and start/stop camera scanner
  useEffect(() => {
    let scanner;
    if (subTab === "scanner" && scriptLoaded && cameraActive) {
      try {
        scanner = new window.Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        scanner.render(
          async (decodedText) => {
            await handleScan(decodedText);
            scanner.clear().catch(e => console.error(e));
            setCameraActive(false);
          },
          (err) => {
            // silent fail
          }
        );
      } catch (e) {
        console.error("Scanner setup error:", e);
      }
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Scanner clean error:", e));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab, scriptLoaded, cameraActive]);

  // Filters
  const filteredPasses = passes.filter((p) => {
    const matchesSearch =
      p.delegate_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.pass_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab("ledger")}
            className={`px-4 py-2 border font-mono text-xs tracking-wider transition-all rounded ${
              subTab === "ledger"
                ? "bg-[var(--atlas-gold)]/15 border-[var(--atlas-gold)] text-[var(--atlas-gold)] font-bold"
                : "border-white/5 text-white/60 hover:text-white"
            }`}
          >
            🎟️ DIGITAL PASS LEDGER
          </button>
          <button
            onClick={() => setSubTab("scanner")}
            className={`px-4 py-2 border font-mono text-xs tracking-wider transition-all rounded ${
              subTab === "scanner"
                ? "bg-[var(--atlas-cyan)]/15 border-[var(--atlas-cyan)] text-[var(--atlas-cyan)] font-bold"
                : "border-white/5 text-white/60 hover:text-white"
            }`}
          >
            📹 VENUE CHECK-IN SCANNER
          </button>
        </div>

        {subTab === "ledger" && (
          <button
            onClick={handleBulkGenerate}
            className="px-3.5 py-1.5 border border-[var(--atlas-gold)] text-[var(--atlas-gold)] hover:bg-[var(--atlas-gold)]/10 text-xs tracking-wider rounded font-semibold transition-all"
          >
            BULK GENERATE PASSES
          </button>
        )}
      </div>

      {subTab === "ledger" ? (
        <div className="space-y-6">
          {/* Filters and search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              placeholder="SEARCH BY DELEGATE NAME, EMAIL, PASS ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-b border-white/10 focus:border-[var(--atlas-gold)] outline-none py-2 text-xs text-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-b border-white/10 focus:border-[var(--atlas-gold)] outline-none py-2 text-xs text-white"
            >
              <option value="" className="bg-[var(--atlas-black)]">ALL STATUSES</option>
              <option value="active" className="bg-[var(--atlas-black)]">ACTIVE</option>
              <option value="used" className="bg-[var(--atlas-black)]">USED / CHECKED-IN</option>
              <option value="revoked" className="bg-[var(--atlas-black)]">REVOKED</option>
            </select>
          </div>

          {/* Ledger Table */}
          <div className="glass rounded border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px] tracking-wide">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-white/50 text-[10px]">
                    <th className="p-4 font-semibold">PASS ID</th>
                    <th className="p-4 font-semibold">DELEGATE DETAILS</th>
                    <th className="p-4 font-semibold">COMMITTEE / POSITION</th>
                    <th className="p-4 font-semibold">PASS STATUS</th>
                    <th className="p-4 font-semibold">GOOGLE WALLET</th>
                    <th className="p-4 font-semibold text-center">ENTRIES</th>
                    <th className="p-4 text-right font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPasses ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-white/40">
                        <div className="w-5 h-5 rounded-full border border-t-[var(--atlas-gold)] border-white/10 animate-spin mx-auto mb-2" />
                        RETRIEVING PASS LEDGER ENTRIES...
                      </td>
                    </tr>
                  ) : filteredPasses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-white/30">
                        NO DIGITAL PASSES FOUND
                      </td>
                    </tr>
                  ) : (
                    filteredPasses.map((p) => (
                      <tr key={p.pass_id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 text-[var(--atlas-cyan)] font-semibold">{p.pass_id}</td>
                        <td className="p-4">
                          <span className="text-white font-medium block">{p.delegate_name}</span>
                          <span className="text-white/40 text-[9.5px]">{p.email}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-white/80 block">{p.committee}</span>
                          <span className="text-white/30 text-[9px] uppercase">{p.position}</span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] uppercase border ${
                              p.status === "active"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                : p.status === "used"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] text-white/60 flex items-center gap-1.5">
                            {p.wallet_status === "added" ? "💾 ADDED" : "❌ NOT ADDED"}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-white">
                          {p.entry_logs?.length || 0}
                        </td>
                        <td className="p-4 text-right space-x-2 shrink-0">
                          {p.status === "revoked" ? (
                            <button
                              onClick={() => handleActivatePass(p.pass_id, p.delegate_name)}
                              className="text-emerald-400 hover:underline"
                            >
                              ACTIVATE
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevokePass(p.pass_id, p.delegate_name)}
                              className="text-red-400 hover:underline"
                            >
                              REVOKE
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSubTab("scanner");
                              setManualPassId(p.pass_id);
                              handleScan(p.pass_id);
                            }}
                            className="text-[var(--atlas-cyan)] hover:underline ml-2"
                          >
                            SIMULATE SCAN
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Venue Scanner view */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          <div className="space-y-6">
            <div className="glass rounded border border-white/5 p-6 flex flex-col justify-between items-center text-center space-y-4">
              <span className="classified-label text-[var(--atlas-cyan)]">/ SECURE DELEGATE VALIDATION TERMINAL</span>
              
              {/* Dynamic Camera Scanner Box */}
              {cameraActive ? (
                <div className="w-full max-w-[350px] aspect-square rounded-lg overflow-hidden bg-black border border-white/10 relative">
                  <div id="reader" className="w-full h-full" />
                  <button
                    onClick={() => setCameraActive(false)}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-red-600 hover:bg-red-500 rounded text-[10px] tracking-wider font-semibold text-white z-10"
                  >
                    DISABLE CAMERA
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-[320px] aspect-square border border-dashed border-white/10 hover:border-[var(--atlas-cyan)]/30 rounded-lg flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer p-6 bg-black/10"
                     onClick={() => {
                       if (scriptLoaded) {
                         setCameraActive(true);
                       } else {
                         toast.error("SCANNER LIBRARY STILL LOADING...");
                       }
                     }}
                >
                  <span className="text-3xl text-white/30">📹</span>
                  <span className="font-mono text-xs text-white/60 tracking-wider">TAP TO LAUNCH DEVICE CAMERA</span>
                  <span className="text-[9px] text-white/30 max-w-[200px] leading-relaxed">
                    Uses local camera feed to parse delegate QR code and verify status.
                  </span>
                </div>
              )}

              {/* Manual Input form */}
              <div className="w-full max-w-[350px] border-t border-white/5 pt-4">
                <label className="text-[9.5px] tracking-widest text-white/55 block text-left mb-1.5">MANUAL KEY ENTRY</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ENTER PASS ID (e.g. AUS-PASS-1234)"
                    value={manualPassId}
                    onChange={(e) => setManualPassId(e.target.value.toUpperCase())}
                    className="flex-1 bg-black/40 border border-white/10 focus:border-[var(--atlas-cyan)] outline-none rounded py-2 px-3 text-xs text-white font-mono"
                  />
                  <button
                    onClick={() => handleScan(manualPassId)}
                    disabled={!manualPassId}
                    className="px-4 py-2 bg-[var(--atlas-cyan)] text-black font-semibold text-xs tracking-wider rounded font-mono hover:bg-[var(--atlas-cyan)]/85 transition-colors disabled:opacity-50"
                  >
                    SCAN
                  </button>
                </div>
              </div>

              {/* Simulator Scans dropdown helper */}
              <div className="w-full max-w-[350px] text-left pt-2">
                <span className="text-[9px] text-white/40 block mb-1">QUICK TEST SIMULATOR:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setManualPassId(e.target.value);
                      handleScan(e.target.value);
                    }
                  }}
                  className="w-full bg-black/30 border border-white/5 outline-none text-[10px] py-1 px-2 text-white/70 font-mono rounded"
                >
                  <option value="">-- SELECT AN ACTIVE TICKET --</option>
                  {passes.map((p) => (
                    <option key={p.pass_id} value={p.pass_id}>
                      {p.delegate_name} ({p.pass_id} - {p.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Scanner Detail Result Panel */}
          <div className="space-y-6">
            <div className="glass rounded border border-white/5 p-5 min-h-[400px] flex flex-col justify-between">
              <div>
                <span className="classified-label text-[var(--atlas-cyan)] text-[10px] block mb-4 border-b border-white/5 pb-2">
                  / VALIDATION FEEDBACK
                </span>

                {scanningStatus === "idle" && (
                  <div className="h-[250px] flex flex-col items-center justify-center text-center text-white/30 space-y-2">
                    <span className="text-2xl">⚡</span>
                    <span className="font-mono text-xs">AWAITING TRANSLATION</span>
                    <span className="text-[9px] max-w-[220px]">Scan a delegate ticket QR code or type their passcode ID to check credentials in.</span>
                  </div>
                )}

                {scanningStatus === "loading" && (
                  <div className="h-[250px] flex flex-col items-center justify-center text-center text-white/40 space-y-2">
                    <div className="w-8 h-8 rounded-full border border-t-[var(--atlas-cyan)] border-white/10 animate-spin" />
                    <span className="font-mono text-xs tracking-wider">VERIFYING SIGNATURE KEYS...</span>
                  </div>
                )}

                {scanningStatus === "failed" && (
                  <div className="h-[250px] flex flex-col items-center justify-center text-center text-red-400 space-y-3 p-4 border border-red-500/20 bg-red-500/5 rounded">
                    <span className="text-3xl font-bold">❌ ACCESS DENIED</span>
                    <p className="font-mono text-xs leading-relaxed">{scannerError}</p>
                    <button
                      onClick={() => setScanningStatus("idle")}
                      className="px-2.5 py-1 border border-red-500/35 hover:bg-red-500/10 rounded text-[9.5px] text-red-300"
                    >
                      RESET TERMINAL
                    </button>
                  </div>
                )}

                {scanningStatus === "success" && scannedPass && (
                  <div className="space-y-4">
                    {/* Visual Pass Card details */}
                    <div className={`p-4 rounded border flex flex-col gap-3 font-mono text-xs ${
                      scannedPass.status === "revoked"
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-emerald-500/5 border-emerald-500/20"
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--atlas-cyan)] font-bold">{scannedPass.pass_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase border ${
                          scannedPass.status === "revoked"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {scannedPass.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex gap-3 items-center">
                        <img
                          src={scannedPass.avatar_url}
                          alt="avatar"
                          className="w-11 h-11 rounded-full bg-black/40 border border-white/10 shrink-0"
                        />
                        <div>
                          <span className="text-white font-bold block truncate max-w-[200px]">{scannedPass.delegate_name.toUpperCase()}</span>
                          <span className="text-white/40 text-[9px] block truncate max-w-[200px]">{scannedPass.email}</span>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-2.5 text-[10px] space-y-1.5">
                        <div><span className="text-white/45">COMMITTEE:</span> {scannedPass.committee}</div>
                        <div><span className="text-white/45">COUNTRY:</span> {scannedPass.country}</div>
                        <div><span className="text-white/45">CLEARANCE:</span> {scannedPass.position.toUpperCase()}</div>
                      </div>

                      <div className="text-center pt-2.5 border-t border-dashed border-white/10 mt-1">
                        {scannedPass.status === "revoked" ? (
                          <span className="text-red-400 font-bold block text-[10.5px] tracking-widest animate-pulse">
                            ⚠️ BARRED / REVOKED ENTRY
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold block text-[10.5px] tracking-widest animate-pulse">
                            ✓ TICKET VALID / VERIFIED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Entry/Exit manual toggle buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleScan(scannedPass.pass_id)}
                        disabled={scannedPass.status === "revoked"}
                        className="flex-1 py-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 font-mono text-[10px] tracking-wider transition-all disabled:opacity-40"
                      >
                        LOG ENTRY
                      </button>
                      <button
                        onClick={() => handleExitScan(scannedPass.pass_id)}
                        disabled={scannedPass.status === "revoked"}
                        className="flex-1 py-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 font-mono text-[10px] tracking-wider transition-all disabled:opacity-40"
                      >
                        LOG EXIT
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanned pass entry history footer */}
              {scanningStatus === "success" && scannedPass && (
                <div className="border-t border-white/5 pt-3 mt-4 space-y-2">
                  <span className="text-[8.5px] tracking-widest text-white/40 block">CHECK-IN LEDGER HISTORY:</span>
                  <div className="max-h-[100px] overflow-y-auto space-y-1.5 scrollbar-thin pr-1 font-mono text-[9px] text-white/60">
                    {scannedPass.entry_logs && scannedPass.entry_logs.length > 0 ? (
                      [...scannedPass.entry_logs].reverse().map((log, i) => (
                        <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-white/80 uppercase">◇ {log.type} recorded</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-white/30 text-center py-2">NO ENTRY LOGS DISPATCHED</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
