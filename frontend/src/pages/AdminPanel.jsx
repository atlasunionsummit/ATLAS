import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  addBroadcast,
  addActivityLog,
  signInWithGoogle,
  signOutUser,
  getPasses,
  activatePass,
  scanPass,
  bulkGeneratePasses,
  getDiscountCodes,
  saveDiscountCode,
  deleteDiscountCode,
  getGoogleLogins,
  getCommittees,
  saveCommittees,
  getPortfolios,
  savePortfolios,
  getPressCrew,
  savePressCrew,
  revokeDelegate,
  grantDelegateAccess
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
  const [discountCodes, setDiscountCodes] = useState([]);
  const [googleLogins, setGoogleLogins] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [portfolios, setPortfolios] = useState({});
  const [pressCrew, setPressCrew] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all mock data
  const refreshData = async () => {
    setLoading(true);
    try {
      const [d, r, p, e, s, b, l, dc, gl, cm, pf, pc] = await Promise.all([
        getDelegates(),
        getRegistrations(),
        getPayments(),
        getEvents(),
        getConferenceSettings(),
        getBroadcastHistory(),
        getActivityLogs(),
        getDiscountCodes(),
        getGoogleLogins(),
        getCommittees(),
        getPortfolios(),
        getPressCrew(),
      ]);
      setDelegates(d);
      setRegistrations(r);
      setPayments(p);
      setEvents(e);
      setSettings(s);
      setBroadcasts(b);
      setActivityLogs(l);
      setDiscountCodes(dc);
      setGoogleLogins(gl);
      setCommittees(cm);
      setPortfolios(pf);
      setPressCrew(pc);
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
                    delegates={delegates}
                    registrations={registrations}
                    onUpdateDelegates={async (newDelegates) => {
                      setDelegates(newDelegates);
                      await saveDelegates(newDelegates);
                    }}
                    onUpdateRegistrations={async (newRegs) => {
                      setRegistrations(newRegs);
                      await saveRegistrations(newRegs);
                    }}
                  />
                )}
                {activeTab === "passes" && (
                  <PassLedgerAndScanner
                    delegates={delegates}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "committees" && (
                  <CommitteeManager
                    committees={committees}
                    onUpdate={async (newCommittees) => {
                      setCommittees(newCommittees);
                      await saveCommittees(newCommittees);
                    }}
                  />
                )}
                {activeTab === "portfolios" && (
                  <PortfolioManager
                    committees={committees}
                    portfolios={portfolios}
                    delegates={delegates}
                    onUpdatePortfolios={async (newPortfolios) => {
                      setPortfolios(newPortfolios);
                      await savePortfolios(newPortfolios);
                    }}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "matrix" && (
                  <PortfolioMatrixViewer
                    committees={committees}
                    portfolios={portfolios}
                    delegates={delegates}
                    registrations={registrations}
                    onUpdatePortfolios={async (newPortfolios) => {
                      setPortfolios(newPortfolios);
                      await savePortfolios(newPortfolios);
                    }}
                    onUpdateDelegates={async (newDelegates) => {
                      setDelegates(newDelegates);
                      await saveDelegates(newDelegates);
                    }}
                    onUpdateRegistrations={async (newRegistrations) => {
                      setRegistrations(newRegistrations);
                      await saveRegistrations(newRegistrations);
                    }}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "revoke_access" && (
                  <RevokeAccessManager
                    delegates={delegates}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "press" && (
                  <InternationalPressManager
                    pressCrew={pressCrew}
                    onUpdate={async (newCrew) => {
                      setPressCrew(newCrew);
                      await savePressCrew(newCrew);
                    }}
                  />
                )}
                {activeTab === "discounts" && (
                  <DiscountCodeManager
                    discountCodes={discountCodes}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "atlas_plus" && (
                  <AtlasPlusManager
                    registrations={registrations}
                    delegates={delegates}
                    payments={payments}
                    onUpdateDelegates={async (newDelegates) => {
                      setDelegates(newDelegates);
                      await saveDelegates(newDelegates);
                    }}
                    onUpdateRegistrations={async (newRegs) => {
                      setRegistrations(newRegs);
                      await saveRegistrations(newRegs);
                    }}
                    onUpdatePayments={async (newPayments) => {
                      setPayments(newPayments);
                      await savePayments(newPayments);
                    }}
                    onRefresh={refreshData}
                  />
                )}
                {activeTab === "google_logins" && (
                  <GoogleLoginsViewer googleLogins={googleLogins} />
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
// Component: DiscountCodeManager
// ----------------------------------------------------
function DiscountCodeManager({ discountCodes, onRefresh }) {
  const [form, setForm] = useState({ code: "", percentage: 10, appliesTo: "All Categories" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error("Code required");
    setLoading(true);
    try {
      await saveDiscountCode({
        code: form.code.trim().toUpperCase(),
        percentage: Number(form.percentage),
        appliesTo: form.appliesTo,
        createdAt: new Date().toISOString()
      });
      toast.success("Discount Code Created");
      setForm({ code: "", percentage: 10, appliesTo: "All Categories" });
      onRefresh();
    } catch (e) {
      toast.error("Failed to create code");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, codeString) => {
    if (!window.confirm(`Revoke code ${codeString}?`)) return;
    try {
      await deleteDiscountCode(id, codeString);
      toast.success("Code Revoked");
      onRefresh();
    } catch (e) {
      toast.error("Failed to delete code");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-2xl text-white tracking-widest">DISCOUNT CODES</h2>
          <p className="text-[10px] text-white/40 tracking-widest mt-1">Manage global referral and discount codes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Code Form */}
        <div className="glass rounded border border-white/5 p-5">
          <span className="classified-label text-[var(--atlas-cyan)] text-xs block mb-4">/ CREATE NEW CODE</span>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[10px] text-white/50 tracking-widest mb-1 block">CODE STRING</label>
              <input
                type="text"
                required
                placeholder="e.g. EARLYBIRD50"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 tracking-widest mb-1 block">DISCOUNT PERCENTAGE (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={form.percentage}
                onChange={(e) => setForm({ ...form, percentage: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 tracking-widest mb-1 block">APPLIES TO CATEGORY</label>
              <select
                value={form.appliesTo}
                onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none"
              >
                <option value="All Categories">All Categories</option>
                <option value="Model United Nations">Model United Nations</option>
                <option value="School delegation">School delegation</option>
                <option value="For festival">For festival</option>
                <option value="For concert">For concert</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[var(--atlas-cyan)]/10 text-[var(--atlas-cyan)] border border-[var(--atlas-cyan)]/20 hover:bg-[var(--atlas-cyan)]/20 rounded font-mono text-[10px] tracking-widest transition-colors"
            >
              {loading ? "SAVING..." : "CREATE CODE"}
            </button>
          </form>
        </div>

        {/* Active Codes List */}
        <div className="lg:col-span-2 glass rounded border border-white/5 p-0 overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-white/5 bg-black/20">
            <span className="classified-label text-[var(--atlas-gold)] text-xs">/ ACTIVE CODES</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {discountCodes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] text-white/30 tracking-widest">
                NO ACTIVE CODES FOUND
              </div>
            ) : (
              discountCodes.map((c) => (
                <div key={c.id} className="bg-black/40 border border-white/10 rounded p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold font-mono tracking-wider">{c.code}</span>
                      <span className="bg-[var(--atlas-gold)]/10 text-[var(--atlas-gold)] text-[9px] px-2 py-0.5 rounded border border-[var(--atlas-gold)]/20 tracking-widest">
                        {c.percentage}% OFF
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50 mt-1.5 tracking-wider">
                      Applies to: <span className="text-white/80">{c.appliesTo}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id, c.code)}
                    className="text-[10px] text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded transition-colors"
                  >
                    REVOKE
                  </button>
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
    { id: "committees", label: "09 COMMITTEES", icon: "🏛️" },
    { id: "portfolios", label: "10 PORTFOLIOS", icon: "🌐" },
    { id: "matrix", label: "10.5 MATRIX TRACKER", icon: "📊" },
    { id: "revoke_access", label: "11 REVOKE ACCESS", icon: "🚫" },
    { id: "press", label: "12 INTL PRESS", icon: "📰" },
    { id: "passes", label: "13 E-PASSPORTS", icon: "🎟️" },
    { id: "discounts", label: "14 DISCOUNTS", icon: "🏷️" },
    { id: "atlas_plus", label: "15 ATLAS PLUS", icon: "✨" },
    { id: "google_logins", label: "16 GOOGLE LOGINS", icon: "🔐" },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/40 backdrop-blur-lg border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0 shrink-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded font-mono text-[11px] tracking-widest text-left transition-all ${activeTab === tab.id
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
                <p className="text-white/60 mt-1">IIT Delhi (TBD)</p>
              </div>
            </div>
          </div>

          <div className="bg-black/30 border border-[var(--atlas-gold)]/20 rounded-md p-4 text-[10px] text-white/50 leading-relaxed">
            🛡️ <span className="text-white font-bold">SESSION ENCRYPTED & SYNCED</span><br />
            Operator session is secured. Live Firebase synchronization is active for notifications and database operations.
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: DelegateManager
// ----------------------------------------------------
function DelegateManager({ delegates, customPortfolios, onUpdate, onRefresh }) {
  const [search, setSearch] = useState("");
  const [filterCommittee, setFilterCommittee] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [editingDelegate, setEditingDelegate] = useState(null);
  const [viewingDelegate, setViewingDelegate] = useState(null);
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
                <th className="p-4 font-semibold">COMMITTEE / PORTFOLIO</th>
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
                    <td className="p-4 max-w-[200px] truncate">
                      <span className="block">{d.committee}</span>
                      <span className="text-[var(--atlas-gold)] text-[9.5px] mt-0.5 block truncate">
                        {d.portfolio || d.portfolio_country || "UNASSIGNED"}
                      </span>
                    </td>
                    <td className="p-4 text-white/80">{d.country}</td>
                    <td className="p-4 text-white/60">{d.city_of_residence}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase">
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => setViewingDelegate(d)}
                        className="text-[var(--atlas-cyan)] hover:underline"
                      >
                        VIEW DATA
                      </button>
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
              <div>
                <label className="classified-label text-white/50 text-[9px]">FULL NAME</label>
                <input
                  required
                  value={editingDelegate.full_name}
                  onChange={(e) => setEditingDelegate({ ...editingDelegate, full_name: e.target.value })}
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="classified-label text-white/50 text-[9px]">CALLSIGN / NICKNAME</label>
                  <input
                    value={editingDelegate.nickname || ""}
                    onChange={(e) => setEditingDelegate({ ...editingDelegate, nickname: e.target.value })}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="classified-label text-white/50 text-[9px]">EMAIL / GOOGLE LOGIN</label>
                  <input
                    type="email"
                    required
                    value={editingDelegate.email || ""}
                    onChange={(e) => setEditingDelegate({ ...editingDelegate, email: e.target.value })}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-[var(--atlas-cyan)] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="classified-label text-white/50 text-[9px]">COUNTRY</label>
                  <input
                    value={editingDelegate.country || ""}
                    onChange={(e) => setEditingDelegate({ ...editingDelegate, country: e.target.value })}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="classified-label text-white/50 text-[9px]">CITY OF RESIDENCE</label>
                  <input
                    value={editingDelegate.city_of_residence || ""}
                    onChange={(e) => setEditingDelegate({ ...editingDelegate, city_of_residence: e.target.value })}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="classified-label text-white/50 text-[9px]">COMMITTEE</label>
                <select
                  value={editingDelegate.committee}
                  onChange={(e) => setEditingDelegate({ ...editingDelegate, committee: e.target.value })}
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono text-[11px]"
                >
                  {COMMITTEES.map((c) => (
                    <option key={c} value={c} className="bg-[var(--atlas-black)]">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="classified-label text-[var(--atlas-gold)] text-[9px]">PORTFOLIO ASSIGNMENT</label>
                {getMergedMatrixData(MATRIX_DATA, customPortfolios)[editingDelegate.committee] ? (
                  <select
                    value={editingDelegate.portfolio || ""}
                    onChange={(e) => setEditingDelegate({ ...editingDelegate, portfolio: e.target.value, portfolio_country: e.target.value })}
                    className="w-full mt-1 bg-black/40 border border-[var(--atlas-gold)]/40 rounded px-3 py-2 text-white font-mono text-[11px] focus:border-[var(--atlas-gold)] outline-none"
                  >
                    <option value="" className="bg-[var(--atlas-black)]">-- Select Portfolio --</option>
                    {getMergedMatrixData(MATRIX_DATA, customPortfolios)[editingDelegate.committee].map(item => (
                      <option key={item.country} value={item.country} className="bg-[var(--atlas-black)]">{item.country}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={editingDelegate.portfolio || ""}
                    onChange={(e) => setEditingDelegate({ ...editingDelegate, portfolio: e.target.value, portfolio_country: e.target.value })}
                    placeholder="e.g. USA, UK, Reuters..."
                    className="w-full mt-1 bg-black/40 border border-[var(--atlas-gold)]/40 rounded px-3 py-2 text-white font-mono text-[11px] focus:border-[var(--atlas-gold)] outline-none"
                  />
                )}
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

      {/* View Data Modal */}
      {viewingDelegate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingDelegate(null)} />
          <div className="relative w-full max-w-[600px] glass-strong rounded p-8 border border-white/5 max-h-[90vh] flex flex-col">
            <span className="classified-label text-[var(--atlas-cyan)] text-xs block">/ RAW DOSSIER DATA</span>
            <div className="flex justify-between items-center mt-1 mb-6">
              <h3 className="font-display text-white text-2xl uppercase">{viewingDelegate.full_name}</h3>
              <button onClick={() => setViewingDelegate(null)} className="text-white/50 hover:text-white">✕</button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 scrollbar-thin space-y-4 font-mono text-xs">

              {/* Highlighted Purchase Info */}
              <div className="bg-[var(--atlas-gold)]/10 border border-[var(--atlas-gold)]/30 rounded p-4 mb-4">
                <span className="text-[var(--atlas-gold)] text-[10px] tracking-widest block mb-2 font-bold">/ PURCHASED PACKAGE & PORTFOLIO</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-white/50 text-[9px] block">PORTFOLIO ASSIGNMENT</span>
                    <span className="text-white text-sm">{viewingDelegate.portfolio || viewingDelegate.portfolio_country || "UNASSIGNED"}</span>
                  </div>
                  <div>
                    <span className="text-white/50 text-[9px] block">TICKET PACKAGE</span>
                    <span className="text-[var(--atlas-cyan)] text-sm">{viewingDelegate.package_name || "Standard (Legacy)"}</span>
                  </div>
                  {viewingDelegate.package_price && (
                    <div>
                      <span className="text-white/50 text-[9px] block">AMOUNT PAID</span>
                      <span className="text-emerald-400 text-sm">₹{viewingDelegate.package_price}</span>
                    </div>
                  )}
                  {viewingDelegate.is_atlas_plus && (
                    <div>
                      <span className="text-white/50 text-[9px] block">ADDON</span>
                      <span className="text-[var(--atlas-gold)] text-sm font-bold border border-[var(--atlas-gold)]/50 px-2 py-0.5 rounded inline-block mt-1">ATLAS PLUS</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Data Dump */}
              <span className="text-white/30 text-[10px] tracking-widest block mt-4 border-b border-white/5 pb-2">/ COMPLETE SYSTEM DATA</span>
              {Object.entries(viewingDelegate).map(([key, value]) => {
                if (key === 'id_proof_base64' && value) {
                  return (
                    <div key={key} className="flex flex-col border-b border-white/5 pb-3 pt-2">
                      <span className="text-white/40 uppercase mb-1">{key.replace(/_/g, ' ')}</span>
                      <img src={value} alt="ID" className="max-w-[200px] h-auto rounded border border-white/10" />
                    </div>
                  )
                }
                // Skip displaying redundant highlighted keys in the raw dump to keep it clean
                if (['portfolio', 'portfolio_country', 'package_name', 'package_price', 'is_atlas_plus'].includes(key)) return null;

                return (
                  <div key={key} className="flex flex-col border-b border-white/5 pb-3 pt-2">
                    <span className="text-white/40 uppercase mb-1">{key.replace(/_/g, ' ')}</span>
                    <span className="text-white break-all">{String(value)}</span>
                  </div>
                )
              })}
            </div>
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
                        className={`px-2 py-0.5 rounded text-[9px] uppercase border ${p.status === "paid"
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
      <AnimatePresence>
        {invoicePay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 print:p-0 print:bg-white"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md print:hidden" onClick={() => setInvoicePay(null)} />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-[420px] rounded-2xl p-[1px] overflow-hidden group print:rounded-none print:max-w-none print:shadow-none"
            >
              {/* Animated Glowing Border */}
              <div className="absolute inset-[-50%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#00000000_50%,var(--atlas-cyan)_75%,var(--atlas-gold)_100%)] opacity-70 group-hover:opacity-100 transition-opacity duration-500 print:hidden" />

              {/* Receipt Content Container */}
              <div className="relative bg-[#0a0510]/95 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl h-full w-full print:bg-white print:border-none print:text-black">

                {/* Holographic noise overlay */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none print:hidden" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>

                {/* Close Button */}
                <button
                  onClick={() => setInvoicePay(null)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors print:hidden bg-white/5 rounded-full p-1"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>

                {/* Header */}
                <div className="text-center space-y-2 relative z-10 mb-8 mt-2">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--atlas-gold)] to-[var(--atlas-cyan)] p-[1px] print:border print:border-gray-800">
                      <div className="w-full h-full rounded-full bg-[#0a0510] flex items-center justify-center print:bg-white">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--atlas-gold)] to-[var(--atlas-cyan)] font-display text-xl print:text-black">A</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--atlas-cyan)] tracking-[0.4em] font-bold uppercase print:text-gray-600">ATLAS UNION SUMMIT</span>
                  <h4 className="font-display text-white text-2xl tracking-wide print:text-black">OFFICIAL INVOICE</h4>
                  <p className="text-white/40 text-[10px] font-mono print:text-gray-500">{new Date(invoicePay.timestamp).toLocaleString()}</p>
                </div>

                <div className="relative h-[1px] w-full my-6 print:bg-gray-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent print:hidden" />
                </div>

                {/* Data Grid */}
                <div className="space-y-4 font-mono text-xs relative z-10">
                  <div className="flex justify-between items-center group/item">
                    <span className="text-white/40 group-hover/item:text-white/60 transition-colors print:text-gray-500">INVOICE REF</span>
                    <span className="text-white font-semibold tracking-wider print:text-black">{invoicePay.id}</span>
                  </div>
                  <div className="flex justify-between items-center group/item">
                    <span className="text-white/40 group-hover/item:text-white/60 transition-colors print:text-gray-500">OPERATOR NAME</span>
                    <span className="text-[var(--atlas-gold)] font-bold truncate max-w-[60%] text-right print:text-black">{invoicePay.delegate_name.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center group/item">
                    <span className="text-white/40 group-hover/item:text-white/60 transition-colors print:text-gray-500">EMAIL</span>
                    <span className="text-white truncate max-w-[70%] text-right print:text-black">{invoicePay.email}</span>
                  </div>
                  <div className="flex justify-between items-center group/item">
                    <span className="text-white/40 group-hover/item:text-white/60 transition-colors print:text-gray-500">TRANSACTION UTR</span>
                    <span className="text-[var(--atlas-cyan)] font-mono tracking-widest print:text-black">{invoicePay.utr_number}</span>
                  </div>
                  <div className="flex justify-between items-center group/item">
                    <span className="text-white/40 group-hover/item:text-white/60 transition-colors print:text-gray-500">TICKET TIER</span>
                    <span className="text-white bg-white/5 px-2 py-0.5 rounded border border-white/10 print:border-gray-300 print:text-black">{invoicePay.package_name}</span>
                  </div>

                  <div className="relative h-[1px] w-full my-4 print:bg-gray-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent print:hidden" />
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-white/40 text-[10px] block print:text-gray-500">TOTAL AMOUNT</span>
                      <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 print:text-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse print:hidden" />
                        {invoicePay.status}
                      </span>
                    </div>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--atlas-gold)] to-[var(--atlas-cyan)] font-display text-3xl print:text-black">
                      ₹{invoicePay.price}.00
                    </span>
                  </div>
                </div>

                <div className="relative h-[1px] w-full mt-8 mb-6 print:bg-gray-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent print:hidden" />
                </div>

                <div className="text-center text-[9px] text-white/30 leading-relaxed font-mono relative z-10 print:text-gray-400">
                  ◇ DIGITAL RECEIPTS ARCHIVED ON DELHI COMMAND CIRCUITS ◇<br />
                  This document serves as verification of summit access.
                </div>

                <div className="mt-8 print:hidden relative z-10">
                  <button
                    onClick={() => window.print()}
                    className="w-full text-center py-3 bg-gradient-to-r from-[var(--atlas-gold)]/10 to-[var(--atlas-cyan)]/10 hover:from-[var(--atlas-gold)]/20 hover:to-[var(--atlas-cyan)]/20 border border-white/10 rounded-lg text-white font-mono text-xs tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(0,195,255,0.2)]"
                  >
                    PRINT / DOWNLOAD RECEIPT
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: RegistrationAuditor
// ----------------------------------------------------
function RegistrationAuditor({ registrations, delegates, payments, emailTemplateConf, emailTemplateRej, onRefresh }) {
  const [viewId, setViewId] = useState(null);
  const [viewData, setViewData] = useState(null);

  const handleApprove = async (reg) => {
    if (confirm(`Approve registration for ${reg.full_name}? This adds them to delegates and creates a payment transaction.`)) {
      // 1. Remove from registrations
      const updatedRegs = registrations.filter((r) => r.registration_id !== reg.registration_id);

      // 2. Create Delegate Entry
      const newDelegate = {
        ...reg,
        id: `AUS-DEL-${Math.floor(1000 + Math.random() * 9000)}`,
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

      // 5. Trigger Success Emails
      const emailPayload = { ...reg, registration_id: reg.registration_id };
      
      fetch("/api/email/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_type: "WELCOME", delegate_payload: emailPayload })
      }).catch(console.error);

      fetch("/api/email/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_type: "PAYMENT_SUCCESS", delegate_payload: emailPayload })
      }).catch(console.error);

      if (reg.is_atlas_plus || reg.package_name?.includes("ATLAS PLUS")) {
        fetch("/api/email/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email_type: "ATLAS_PLUS", delegate_payload: emailPayload })
        }).catch(console.error);
      }

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
                  <div className="mt-2 text-[var(--atlas-gold)] font-semibold border-t border-white/5 pt-2 flex flex-wrap gap-2 justify-between items-center">
                    <span>UTR: {reg.utr_number}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewData(reg)}
                        className="text-[9px] px-2 py-1 bg-[var(--atlas-purple)]/20 hover:bg-[var(--atlas-purple)]/40 rounded border border-[var(--atlas-cyan)]/30 text-[var(--atlas-cyan)] transition-colors tracking-widest"
                      >
                        VIEW DATA
                      </button>
                      {reg.id_proof_base64 && (
                        <button
                          onClick={() => setViewId(reg.id_proof_base64)}
                          className="text-[9px] px-2 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 text-white transition-colors"
                        >
                          VIEW ID
                        </button>
                      )}
                    </div>
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

      {/* ID Viewer Modal */}
      {viewId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setViewId(null)} />
          <div className="relative w-full max-w-[500px] glass-strong rounded p-4 border border-[var(--atlas-cyan)]/30">
            <div className="flex justify-between items-center mb-4">
              <span className="font-display text-[var(--atlas-cyan)] text-lg">DOCUMENT PREVIEW</span>
              <button onClick={() => setViewId(null)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <img src={viewId} alt="ID Proof" className="w-full h-auto rounded border border-white/10 max-h-[70vh] object-contain bg-black/40" />
          </div>
        </div>
      )}

      {/* Full Data Viewer Modal */}
      {viewData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setViewData(null)} />
          <div className="relative w-full max-w-3xl glass-strong rounded-xl p-6 border border-[var(--atlas-cyan)]/30 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <div>
                <span className="classified-label text-[var(--atlas-cyan)] text-xs block mb-1">/ RAW REGISTRATION DATA</span>
                <h3 className="font-display text-white text-2xl">{viewData.full_name}</h3>
                <span className="text-white/40 text-[10px] font-mono">{viewData.registration_id}</span>
              </div>
              <button onClick={() => setViewData(null)} className="text-white/50 hover:text-white bg-white/5 rounded-full p-2">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm font-mono">
              {/* Left Column: Delegate Info */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[var(--atlas-gold)] border-b border-[var(--atlas-gold)]/30 pb-2 mb-3 tracking-widest text-[11px] font-bold">OPERATOR PROFILE</h4>
                  <div className="space-y-2 text-white/80">
                    <div className="flex justify-between"><span className="text-white/40">Full Name:</span> <span>{viewData.full_name}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Email:</span> <span>{viewData.email}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Phone:</span> <span>{viewData.phone_number}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Country:</span> <span>{viewData.country}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">City:</span> <span>{viewData.city_of_residence}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">School/Org:</span> <span className="text-right">{viewData.school_university}</span></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[var(--atlas-cyan)] border-b border-[var(--atlas-cyan)]/30 pb-2 mb-3 tracking-widest text-[11px] font-bold">ASSIGNMENT PREFERENCES</h4>
                  <div className="space-y-2 text-white/80">
                    <div className="flex flex-col gap-1">
                      <span className="text-white/40">Committee:</span>
                      <span className="bg-black/30 p-2 rounded border border-white/5">{viewData.committee}</span>
                    </div>
                    {(viewData.portfolio_country || viewData.portfolio) && (
                      <div className="flex justify-between border border-[var(--atlas-gold)]/40 bg-[var(--atlas-gold)]/10 p-2 rounded mt-2">
                        <span className="text-[var(--atlas-gold)] font-bold text-[10px]">LOCKED PORTFOLIO:</span> 
                        <span className="text-right text-[var(--atlas-gold)] font-bold">{viewData.portfolio_country || viewData.portfolio}</span>
                      </div>
                    )}
                    {viewData.portfolio_1 && (
                      <div className="flex justify-between"><span className="text-white/40">Portfolio Pref 1:</span> <span className="text-right">{viewData.portfolio_1}</span></div>
                    )}
                    {viewData.portfolio_2 && (
                      <div className="flex justify-between"><span className="text-white/40">Portfolio Pref 2:</span> <span className="text-right">{viewData.portfolio_2}</span></div>
                    )}
                    {viewData.portfolio_3 && (
                      <div className="flex justify-between"><span className="text-white/40">Portfolio Pref 3:</span> <span className="text-right">{viewData.portfolio_3}</span></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Financial & Aux Info */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-purple-400 border-b border-purple-400/30 pb-2 mb-3 tracking-widest text-[11px] font-bold">FINANCIAL CLEARANCE</h4>
                  <div className="space-y-2 text-white/80 bg-purple-900/10 p-3 rounded border border-purple-500/20">
                    <div className="flex justify-between"><span className="text-white/40">Package:</span> <span>{viewData.package_name}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Category:</span> <span>{viewData.package_category}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Price:</span> <span className="text-[var(--atlas-gold)] font-bold">₹{viewData.package_price}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Transaction UTR:</span> <span className="text-[var(--atlas-cyan)]">{viewData.utr_number}</span></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-emerald-400 border-b border-emerald-400/30 pb-2 mb-3 tracking-widest text-[11px] font-bold">ADDITIONAL CONTEXT</h4>
                  <div className="space-y-3 text-white/80">
                    {viewData.past_experience && (
                      <div className="flex flex-col gap-1">
                        <span className="text-white/40">Past Experience:</span>
                        <span className="bg-black/30 p-2 rounded border border-white/5 text-[11px] leading-relaxed whitespace-pre-wrap">{viewData.past_experience}</span>
                      </div>
                    )}
                    {viewData.dietary_instructions && (
                      <div className="flex justify-between"><span className="text-white/40">Dietary Needs:</span> <span>{viewData.dietary_instructions}</span></div>
                    )}
                    {viewData.referral_code && (
                      <div className="flex justify-between"><span className="text-white/40">Referral Code:</span> <span>{viewData.referral_code}</span></div>
                    )}
                  </div>
                </div>

                {viewData.id_proof_base64 && (
                  <div>
                    <h4 className="text-red-400 border-b border-red-400/30 pb-2 mb-3 tracking-widest text-[11px] font-bold">IDENTITY VERIFICATION</h4>
                    <img
                      src={viewData.id_proof_base64}
                      alt="ID Proof"
                      className="w-full h-auto rounded border border-white/20 object-contain bg-black max-h-48 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setViewId(viewData.id_proof_base64)}
                    />
                    <p className="text-[9px] text-white/40 mt-2 text-center">Click image to enlarge</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex gap-3 justify-end">
              <button onClick={() => setViewData(null)} className="px-6 py-2 border border-white/20 rounded text-white/70 hover:bg-white/10 text-xs font-mono tracking-widest transition-colors">
                CLOSE VIEWER
              </button>
            </div>
          </div>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.body) {
      toast.error("MISSING BROADCAST DETAILS");
      return;
    }

    setLoading(true);
    
    try {
      const newBroadcast = {
        id: "BRD-" + Math.floor(100 + Math.random() * 900),
        subject: form.subject,
        targets: form.targets,
        body: form.body,
        timestamp: new Date().toISOString(),
      };

      await addBroadcast(newBroadcast);

      onUpdate([newBroadcast, ...broadcasts]);
      setForm({ subject: "", targets: "All Delegates", body: "" });
      toast.success("BROADCAST ANNOUNCED", {
        description: `Notification transmission dispatched to ${delegates.length} delegates.`,
      });
      addActivityLog(`Broadcast bulletin dispatched: ${newBroadcast.subject}`);
    } catch (error) {
      console.error("Broadcast Dispatch Failed:", error);
      toast.error("BROADCAST FAILED: " + error.message);
    } finally {
      setLoading(false);
    }
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
function ConferenceSettings({ settings, onUpdate, delegates, registrations, onUpdateDelegates, onUpdateRegistrations }) {
  const [form, setForm] = useState(settings);
  const [wiping, setWiping] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(form);
    toast.success("SYSTEM SETTINGS SAVED");
    addActivityLog("Conference settings and email templates updated");
  };

  const handleWipePortfolios = async () => {
    const check = window.prompt("WARNING: This will unassign ALL portfolios across all delegates and registrations.\nType 'WIPE' to confirm:");
    if (check !== 'WIPE') {
      toast.error("Wipe cancelled.");
      return;
    }
    setWiping(true);
    try {
      if (delegates && delegates.length > 0) {
        const updatedDelegates = delegates.map(d => ({ ...d, portfolio: "", portfolio_country: "" }));
        await onUpdateDelegates(updatedDelegates);
      }
      if (registrations && registrations.length > 0) {
        const updatedRegs = registrations.map(r => ({ ...r, portfolio: "", portfolio_country: "" }));
        await onUpdateRegistrations(updatedRegs);
      }
      toast.success("ALL PORTFOLIOS UNASSIGNED");
      addActivityLog("Administrator triggered a global wipe of all assigned portfolios.");
    } catch (e) {
      toast.error("Failed to wipe portfolios");
      console.error(e);
    } finally {
      setWiping(false);
    }
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

          <Field
            label="REGULAR PRICE (₹)"
            type="number"
            value={form.regular_price ?? ""}
            onChange={(v) => setForm({ ...form, regular_price: Number(v) })}
          />

          <Field
            label="SPECIAL COMMITTEES REGULAR (₹)"
            type="number"
            value={form.special_regular_price ?? ""}
            onChange={(v) => setForm({ ...form, special_regular_price: Number(v) })}
          />
          <Field
            label="SPECIAL COMMITTEES LATE (₹)"
            type="number"
            value={form.special_late_price ?? ""}
            onChange={(v) => setForm({ ...form, special_late_price: Number(v) })}
          />
          <Field
            label="SCHOOL DELEGATION DISCOUNT (₹)"
            type="number"
            value={form.school_discount ?? ""}
            onChange={(v) => setForm({ ...form, school_discount: Number(v) })}
          />
          <Field
            label="FESTIVAL PASS PRICE (₹)"
            type="number"
            value={form.festival_price ?? ""}
            onChange={(v) => setForm({ ...form, festival_price: Number(v) })}
          />
          <Field
            label="CONCERT PASS PRICE (₹)"
            type="number"
            value={form.concert_price ?? ""}
            onChange={(v) => setForm({ ...form, concert_price: Number(v) })}
          />
          <Field
            label="ATLAS PLUS UPGRADE PRICE (₹)"
            type="number"
            value={form.atlas_plus_price ?? ""}
            onChange={(v) => setForm({ ...form, atlas_plus_price: Number(v) })}
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

      {/* DANGER ZONE */}
      <div className="max-w-[650px] glass rounded border border-red-500/20 p-6 space-y-4">
        <span className="classified-label text-red-500 text-[10px] block border-b border-red-500/20 pb-2">
          / DANGER ZONE: PORTFOLIO WIPER
        </span>
        <p className="text-[10px] text-white/50 leading-relaxed font-mono">
          Clicking the button below will permanently remove the `portfolio` and `portfolio_country` properties from ALL pending registrations and approved delegates. Their names, emails, and payment statuses will remain intact. This is irreversible.
        </p>
        <button
          onClick={handleWipePortfolios}
          disabled={wiping}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-mono text-[11px] font-bold border border-red-500/30 rounded tracking-widest transition-colors"
        >
          {wiping ? "WIPING ALL PORTFOLIOS..." : "DANGER: UNASSIGN ALL PORTFOLIOS"}
        </button>
      </div>
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
    } else if (passId.includes("/p/")) {
      passId = passId.split("/p/")[1].split("?")[0];
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
            className={`px-4 py-2 border font-mono text-xs tracking-wider transition-all rounded ${subTab === "ledger"
              ? "bg-[var(--atlas-gold)]/15 border-[var(--atlas-gold)] text-[var(--atlas-gold)] font-bold"
              : "border-white/5 text-white/60 hover:text-white"
              }`}
          >
            🎟️ DIGITAL PASS LEDGER
          </button>
          <button
            onClick={() => setSubTab("scanner")}
            className={`px-4 py-2 border font-mono text-xs tracking-wider transition-all rounded ${subTab === "scanner"
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
                    <th className="p-4 font-semibold">QR STATUS</th>
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
                            className={`px-2 py-0.5 rounded text-[9px] uppercase border ${p.status === "active"
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
                            <span className="text-emerald-400">✅ GENERATED</span>
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
                    <div className={`p-4 rounded border flex flex-col gap-3 font-mono text-xs ${scannedPass.status === "revoked"
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-emerald-500/5 border-emerald-500/20"
                      }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--atlas-cyan)] font-bold">{scannedPass.pass_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase border ${scannedPass.status === "revoked"
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

// ----------------------------------------------------
// Tab Component: CommitteeManager
// ----------------------------------------------------
function CommitteeManager({ committees, onUpdate }) {
  const [name, setName] = useState("");
  const [delegationType, setDelegationType] = useState("single");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Committee name required");
    if (committees.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      return toast.error("Committee already exists");
    }
    const newCommittee = {
      id: `CMT-${Date.now()}`,
      name: name.trim(),
      delegationType,
      createdAt: new Date().toISOString(),
    };
    const updated = [...committees, newCommittee];
    onUpdate(updated);
    setName("");
    setDelegationType("single");
    toast.success("COMMITTEE ADDED", { description: newCommittee.name });
    addActivityLog(`Committee created: ${newCommittee.name} (${delegationType} delegation)`);
  };

  const handleRemove = (id, cName) => {
    if (!window.confirm(`Remove committee "${cName}"? This cannot be undone.`)) return;
    const updated = committees.filter(c => c.id !== id);
    onUpdate(updated);
    toast.success("COMMITTEE REMOVED", { description: cName });
    addActivityLog(`Committee removed: ${cName}`);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-cyan)] text-xs block">/ COMMITTEE MANAGEMENT</span>
        <h3 className="font-display text-white text-2xl">COMMITTEES</h3>
        <p className="text-white/40 text-[10px] mt-1 font-mono">Add or remove committees. Choose single, double, or triple delegation type.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded border border-white/5 p-5">
          <span className="classified-label text-[var(--atlas-gold)] text-xs block mb-4">/ ADD NEW COMMITTEE</span>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-[10px] text-white/50 tracking-widest mb-1 block">COMMITTEE NAME</label>
              <input type="text" required placeholder="e.g. UNSC" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-white/50 tracking-widest mb-1 block">DELEGATION TYPE</label>
              <select value={delegationType} onChange={(e) => setDelegationType(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none">
                <option value="single">Single Delegation</option>
                <option value="double">Double Delegation</option>
                <option value="triple">Triple Delegation</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-[var(--atlas-cyan)]/10 text-[var(--atlas-cyan)] border border-[var(--atlas-cyan)]/20 hover:bg-[var(--atlas-cyan)]/20 rounded font-mono text-[10px] tracking-widest transition-colors">
              ADD COMMITTEE
            </button>
          </form>
        </div>
        <div className="lg:col-span-2 glass rounded border border-white/5 p-0 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <span className="classified-label text-[var(--atlas-gold)] text-xs">/ ACTIVE COMMITTEES</span>
            <span className="text-[10px] text-white/40 font-mono">{committees.length} TOTAL</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {committees.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] text-white/30 tracking-widest">NO COMMITTEES CREATED YET</div>
            ) : (
              committees.map((c) => (
                <div key={c.id} className="bg-black/40 border border-white/10 rounded p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold font-mono tracking-wider">{c.name}</span>
                    <span className="bg-[var(--atlas-cyan)]/10 text-[var(--atlas-cyan)] text-[9px] px-2 py-0.5 rounded border border-[var(--atlas-cyan)]/20 tracking-widest uppercase">{c.delegationType}</span>
                  </div>
                  <button onClick={() => handleRemove(c.id, c.name)} className="text-[10px] text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded transition-colors">REMOVE</button>
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
// Tab Component: RevokeAccessManager
// ----------------------------------------------------
function RevokeAccessManager({ delegates, onRefresh }) {
  const [search, setSearch] = useState("");
  const [revoking, setRevoking] = useState(null);

  const filtered = delegates.filter(d => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (d.full_name || "").toLowerCase().includes(s) || (d.email || "").toLowerCase().includes(s) || (d.id || "").toLowerCase().includes(s) || (d.committee || "").toLowerCase().includes(s);
  });

  const handleRevoke = async (d) => {
    if (!window.confirm(`PERMANENTLY revoke access for ${d.full_name} (${d.email})?\n\nThis will:\n• Delete them from the delegates database\n• Revoke their e-passport\n• They will no longer be able to sign in`)) return;
    setRevoking(d.id);
    try {
      const success = await revokeDelegate(d.id, d.full_name, d.email);
      if (success) { toast.success("ACCESS REVOKED", { description: `${d.full_name} has been removed.` }); onRefresh(); }
      else { toast.error("REVOCATION FAILED"); }
    } catch (err) { toast.error("ERROR", { description: err.message }); }
    finally { setRevoking(null); }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-red-400 text-xs block">/ ACCESS CONTROL</span>
        <h3 className="font-display text-white text-2xl">REVOKE DELEGATE ACCESS</h3>
        <p className="text-white/40 text-[10px] mt-1 font-mono">Permanently remove a delegate's access. This deletes their account and revokes their passport.</p>
      </div>
      <div className="glass rounded border border-white/5 p-4">
        <input type="text" placeholder="Search by name, email, ID, or committee..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-red-500/50 outline-none placeholder:text-white/30" />
      </div>
      <div className="glass rounded border border-white/5 p-0 overflow-hidden flex flex-col max-h-[600px]">
        <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
          <span className="classified-label text-red-400 text-xs">/ DELEGATE ROSTER</span>
          <span className="text-[10px] text-white/40 font-mono">{filtered.length} OF {delegates.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="text-[10px] text-white/30 tracking-widest text-center py-10 font-mono">NO DELEGATES FOUND</div>
          ) : (
            filtered.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-display text-sm truncate">{d.full_name}</span>
                    <span className={`text-[8px] tracking-widest px-1.5 py-0.5 rounded border font-mono ${d.status === "alloted" ? "border-[var(--atlas-gold)]/30 text-[var(--atlas-gold)] bg-[var(--atlas-gold)]/10" : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"}`}>
                      {(d.status || "active").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[var(--atlas-cyan)] font-mono text-[9px] truncate mt-0.5">{d.email}</p>
                  <p className="text-white/30 font-mono text-[9px] truncate">{d.committee} · {d.id}</p>
                </div>
                <button onClick={() => handleRevoke(d)} disabled={revoking === d.id}
                  className="text-[10px] text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded font-mono tracking-wider transition-colors shrink-0 disabled:opacity-50">
                  {revoking === d.id ? "REVOKING..." : "REVOKE ACCESS"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: InternationalPressManager
// ----------------------------------------------------
function InternationalPressManager({ pressCrew, onUpdate }) {
  const [form, setForm] = useState({ name: "", email: "", role: "journalist" });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name required");
    const newMember = { id: `PRESS-${Date.now()}`, name: form.name.trim(), email: form.email.trim().toLowerCase(), role: form.role, createdAt: new Date().toISOString() };
    onUpdate([...pressCrew, newMember]);
    setForm({ name: "", email: "", role: "journalist" });
    toast.success("PRESS MEMBER ADDED", { description: `${newMember.name} (${newMember.role})` });
    addActivityLog(`Press crew member added: ${newMember.name} as ${newMember.role}`);
  };

  const handleRemove = (id, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the press crew?`)) return;
    onUpdate(pressCrew.filter(m => m.id !== id));
    toast.success("PRESS MEMBER REMOVED");
    addActivityLog(`Press crew member removed: ${memberName}`);
  };

  const roleColors = {
    photographer: "text-[var(--atlas-cyan)] bg-[var(--atlas-cyan)]/10 border-[var(--atlas-cyan)]/20",
    caricaturist: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    journalist: "text-[var(--atlas-gold)] bg-[var(--atlas-gold)]/10 border-[var(--atlas-gold)]/20",
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-cyan)] text-xs block">/ MEDIA OPERATIONS</span>
        <h3 className="font-display text-white text-2xl">INTERNATIONAL PRESS</h3>
        <p className="text-white/40 text-[10px] mt-1 font-mono">Manage photographers, caricaturists, and journalists assigned to International Press.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded border border-white/5 p-5">
          <span className="classified-label text-[var(--atlas-gold)] text-xs block mb-4">/ ADD PRESS MEMBER</span>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-[10px] text-white/50 tracking-widest mb-1 block">FULL NAME</label>
              <input type="text" required placeholder="e.g. Ravi Kumar" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-white/50 tracking-widest mb-1 block">EMAIL (OPTIONAL)</label>
              <input type="email" placeholder="press@gmail.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-white/50 tracking-widest mb-1 block">ROLE</label>
              <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none">
                <option value="journalist">Journalist</option>
                <option value="photographer">Photographer</option>
                <option value="caricaturist">Caricaturist</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-[var(--atlas-cyan)]/10 text-[var(--atlas-cyan)] border border-[var(--atlas-cyan)]/20 hover:bg-[var(--atlas-cyan)]/20 rounded font-mono text-[10px] tracking-widest transition-colors">ADD PRESS MEMBER</button>
          </form>
        </div>
        <div className="lg:col-span-2 glass rounded border border-white/5 p-0 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <span className="classified-label text-[var(--atlas-gold)] text-xs">/ PRESS CREW ROSTER</span>
            <div className="flex items-center gap-3 text-[9px] font-mono tracking-widest">
              <span className="text-[var(--atlas-gold)]">📰 {pressCrew.filter(m => m.role === "journalist").length}</span>
              <span className="text-[var(--atlas-cyan)]">📷 {pressCrew.filter(m => m.role === "photographer").length}</span>
              <span className="text-purple-400">🖊️ {pressCrew.filter(m => m.role === "caricaturist").length}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pressCrew.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] text-white/30 tracking-widest">NO PRESS CREW ADDED YET</div>
            ) : (
              pressCrew.map((m) => (
                <div key={m.id} className="bg-black/40 border border-white/10 rounded p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold font-mono tracking-wider">{m.name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded border tracking-widest uppercase ${roleColors[m.role] || roleColors.journalist}`}>{m.role}</span>
                    </div>
                    {m.email && <p className="text-[var(--atlas-cyan)] font-mono text-[9px] mt-1">{m.email}</p>}
                  </div>
                  <button onClick={() => handleRemove(m.id, m.name)} className="text-[10px] text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded transition-colors">REMOVE</button>
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
// Tab Component: PortfolioManager
// ----------------------------------------------------
function PortfolioManager({ committees, portfolios, delegates, onUpdatePortfolios, onRefresh }) {
  const [selectedCommittee, setSelectedCommittee] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [showDelegationForm, setShowDelegationForm] = useState(false);
  const [delegationFormCountry, setDelegationFormCountry] = useState("");
  const [delegationForm, setDelegationForm] = useState({ full_name: "", email: "", phone_number: "", country: "", city_of_residence: "", past_experience: "", dietary_instructions: "", nickname: "", is_atlas_plus: false });
  const [grantLoading, setGrantLoading] = useState(false);

  const committeePortfolios = selectedCommittee ? (portfolios[selectedCommittee] || []) : [];
  const selectedCommitteeData = committees.find(c => c.name === selectedCommittee);

  const handleAddPortfolio = (e) => {
    e.preventDefault();
    if (!selectedCommittee) return toast.error("Select a committee first");
    if (!newCountry.trim()) return toast.error("Country/portfolio name required");
    if (committeePortfolios.some(p => p.country.toLowerCase() === newCountry.trim().toLowerCase())) return toast.error("Portfolio already exists");
    const updated = { ...portfolios };
    if (!updated[selectedCommittee]) updated[selectedCommittee] = [];
    updated[selectedCommittee] = [...updated[selectedCommittee], { id: `PF-${Date.now()}`, country: newCountry.trim() }];
    onUpdatePortfolios(updated);
    setNewCountry("");
    toast.success("PORTFOLIO ADDED", { description: `${newCountry.trim()} → ${selectedCommittee}` });
    addActivityLog(`Portfolio "${newCountry.trim()}" added to ${selectedCommittee}`);
  };

  const handleRemovePortfolio = (portfolioId, portfolioName) => {
    if (!window.confirm(`Remove portfolio "${portfolioName}" from ${selectedCommittee}?`)) return;
    const updated = { ...portfolios };
    updated[selectedCommittee] = updated[selectedCommittee].filter(p => p.id !== portfolioId);
    onUpdatePortfolios(updated);
    toast.success("PORTFOLIO REMOVED");
    addActivityLog(`Portfolio "${portfolioName}" removed from ${selectedCommittee}`);
  };

  const openDelegationForm = (portfolioCountry) => {
    setDelegationFormCountry(portfolioCountry);
    setDelegationForm({ full_name: "", email: "", phone_number: "", country: "", city_of_residence: "", past_experience: "", dietary_instructions: "", nickname: "", is_atlas_plus: false });
    setShowDelegationForm(true);
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!delegationForm.full_name.trim() || !delegationForm.email.trim()) return toast.error("Name and Gmail are required");
    setGrantLoading(true);
    try {
      await grantDelegateAccess({ ...delegationForm, committee: selectedCommittee, portfolio_country: delegationFormCountry });
      toast.success("ACCESS GRANTED", { description: `${delegationForm.email} can now sign in as a delegate.` });
      setShowDelegationForm(false);
      onRefresh();
    } catch (err) {
      toast.error("GRANT FAILED", { description: err.message });
    } finally {
      setGrantLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-cyan)] text-xs block">/ PORTFOLIO MANAGEMENT</span>
        <h3 className="font-display text-white text-2xl">PORTFOLIOS (COUNTRIES)</h3>
        <p className="text-white/40 text-[10px] mt-1 font-mono">Add or remove country portfolios per committee. Grant delegate access via delegation form.</p>
      </div>
      <div className="glass rounded border border-white/5 p-4">
        <label className="text-[10px] text-white/50 tracking-widest mb-2 block">SELECT COMMITTEE</label>
        <select value={selectedCommittee} onChange={(e) => setSelectedCommittee(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none">
          <option value="">-- Choose a committee --</option>
          {committees.map(c => (<option key={c.id} value={c.name}>{c.name} ({c.delegationType})</option>))}
        </select>
      </div>
      {selectedCommittee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass rounded border border-white/5 p-5">
            <span className="classified-label text-[var(--atlas-gold)] text-xs block mb-4">/ ADD PORTFOLIO</span>
            <form onSubmit={handleAddPortfolio} className="space-y-4">
              <div>
                <label className="text-[10px] text-white/50 tracking-widest mb-1 block">COUNTRY / PORTFOLIO NAME</label>
                <input type="text" required placeholder="e.g. India, USA" value={newCountry} onChange={(e) => setNewCountry(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
              </div>
              {selectedCommitteeData && (
                <div className="text-[9px] text-[var(--atlas-cyan)] font-mono tracking-widest bg-[var(--atlas-cyan)]/10 border border-[var(--atlas-cyan)]/20 rounded p-2">
                  DELEGATION TYPE: {selectedCommitteeData.delegationType.toUpperCase()}
                </div>
              )}
              <button type="submit" className="w-full py-2 bg-[var(--atlas-cyan)]/10 text-[var(--atlas-cyan)] border border-[var(--atlas-cyan)]/20 hover:bg-[var(--atlas-cyan)]/20 rounded font-mono text-[10px] tracking-widest transition-colors">ADD PORTFOLIO</button>
            </form>
          </div>
          <div className="lg:col-span-2 glass rounded border border-white/5 p-0 overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <span className="classified-label text-[var(--atlas-gold)] text-xs">/ {selectedCommittee.toUpperCase()}</span>
              <span className="text-[10px] text-white/40 font-mono">{committeePortfolios.length} PORTFOLIOS</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {committeePortfolios.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[10px] text-white/30 tracking-widest py-8">NO PORTFOLIOS ADDED</div>
              ) : (
                committeePortfolios.map((p) => {
                  const assignedDelegates = delegates.filter(d => d.committee === selectedCommittee && (d.portfolio === p.country || d.portfolio_country === p.country));
                  return (
                    <div key={p.id} className="bg-black/40 border border-white/10 rounded p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-white font-bold font-mono tracking-wider">{p.country}</span>
                          {assignedDelegates.length > 0 && <span className="ml-2 text-[9px] text-emerald-400 font-mono tracking-widest">{assignedDelegates.length} ASSIGNED</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openDelegationForm(p.country)} className="text-[10px] text-[var(--atlas-gold)] border border-[var(--atlas-gold)]/20 bg-[var(--atlas-gold)]/10 hover:bg-[var(--atlas-gold)]/20 px-3 py-1.5 rounded transition-colors">+ GRANT ACCESS</button>
                          <button onClick={() => handleRemovePortfolio(p.id, p.country)} className="text-[10px] text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded transition-colors">REMOVE</button>
                        </div>
                      </div>
                      {assignedDelegates.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                          {assignedDelegates.map(d => (
                            <div key={d.id} className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-white/70">{d.full_name}</span>
                              <span className="text-[var(--atlas-cyan)]">{d.email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      <AnimatePresence>
        {showDelegationForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0a0212]/95 border border-[var(--atlas-gold)]/30 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-white/10 flex justify-between items-start bg-white/[0.02]">
                <div>
                  <span className="text-[10px] text-[var(--atlas-gold)] font-mono tracking-widest block mb-1">DELEGATION FORM</span>
                  <h3 className="font-display text-white text-xl">GRANT ACCESS · {delegationFormCountry}</h3>
                  <p className="text-[10px] text-white/40 font-mono mt-1">{selectedCommittee}</p>
                </div>
                <button onClick={() => setShowDelegationForm(false)} className="text-white/40 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleGrantAccess} className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white/50 tracking-widest mb-1 block">FULL NAME *</label>
                    <input type="text" required value={delegationForm.full_name} onChange={e => setDelegationForm({...delegationForm, full_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/50 tracking-widest mb-1 block">GMAIL ID *</label>
                    <input type="email" required placeholder="delegate@gmail.com" value={delegationForm.email} onChange={e => setDelegationForm({...delegationForm, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white/50 tracking-widest mb-1 block">NICKNAME</label>
                    <input type="text" value={delegationForm.nickname} onChange={e => setDelegationForm({...delegationForm, nickname: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/50 tracking-widest mb-1 block">PHONE</label>
                    <input type="text" value={delegationForm.phone_number} onChange={e => setDelegationForm({...delegationForm, phone_number: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white/50 tracking-widest mb-1 block">NATIONALITY</label>
                    <input type="text" value={delegationForm.country} onChange={e => setDelegationForm({...delegationForm, country: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/50 tracking-widest mb-1 block">CITY OF RESIDENCE</label>
                    <input type="text" value={delegationForm.city_of_residence} onChange={e => setDelegationForm({...delegationForm, city_of_residence: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/50 tracking-widest mb-1 block">PAST EXPERIENCE</label>
                  <textarea rows={2} value={delegationForm.past_experience} onChange={e => setDelegationForm({...delegationForm, past_experience: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none resize-none" />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 tracking-widest mb-1 block">DIETARY INSTRUCTIONS</label>
                  <input type="text" value={delegationForm.dietary_instructions} onChange={e => setDelegationForm({...delegationForm, dietary_instructions: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:border-[var(--atlas-gold)] outline-none" />
                </div>
                <label className="flex items-center gap-2 text-white/50 text-[10px] font-mono">
                  <input type="checkbox" checked={delegationForm.is_atlas_plus} onChange={e => setDelegationForm({...delegationForm, is_atlas_plus: e.target.checked})} className="accent-[var(--atlas-gold)]" />
                  GRANT ATLAS PLUS ACCESS
                </label>
                <div className="bg-black/30 border border-[var(--atlas-gold)]/20 rounded p-3 text-[10px] font-mono text-white/50">
                  <span className="text-[var(--atlas-gold)] font-bold block mb-1">⚡ WHAT HAPPENS:</span>
                  The Gmail ID entered will be added to the delegates database. When they sign in with Google, they will be recognized as an approved delegate for <span className="text-white">{selectedCommittee}</span> with portfolio <span className="text-white">{delegationFormCountry}</span>.
                </div>
                <button type="submit" disabled={grantLoading} className="w-full py-2.5 bg-[var(--atlas-gold)] text-black font-mono text-[10px] font-bold tracking-widest rounded hover:bg-[#d4ae4a] transition-colors disabled:opacity-50">
                  {grantLoading ? "GRANTING ACCESS..." : "GRANT DELEGATE ACCESS"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: PortfolioMatrixViewer
// ----------------------------------------------------
function PortfolioMatrixViewer({ committees, portfolios, delegates, onUpdateDelegates, onUpdatePortfolios, onRefresh, registrations, onUpdateRegistrations }) {
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [assignEmail, setAssignEmail] = useState("");
  const [isManuallyAssigned, setIsManuallyAssigned] = useState(false);
  const [manuallyAssignedName, setManuallyAssignedName] = useState("");
  const [addingPortfolioForCommittee, setAddingPortfolioForCommittee] = useState(null);
  const [newPortfolioName, setNewPortfolioName] = useState("");

  const handleRevoke = async (assigneeId, isRegistration = false) => {
    if (!window.confirm("Are you sure you want to revoke this portfolio assignment?")) return;
    
    try {
      if (isRegistration && onUpdateRegistrations) {
        const updated = registrations.map(r => {
          if (r.id === assigneeId) {
            return { ...r, portfolio: "", portfolio_country: "", portfolio_1: "" };
          }
          return r;
        });
        // we'd also await saveRegistrations but we don't have it imported here. We rely on onUpdateRegistrations doing it, but wait, the instruction says "Save/Assign" button must execute await. Revoke isn't explicitly mentioned, but let's do it for Save/Assign.
        await onUpdateRegistrations(updated);
      } else {
        const updated = delegates.map(d => {
          if (d.id === assigneeId) {
            return { ...d, portfolio: "", portfolio_country: "" };
          }
          return d;
        });
        await saveDelegates(updated);
        await onUpdateDelegates(updated);
      }

      toast.success("PORTFOLIO REVOKED");
      setSelectedPortfolio(prev => ({
        ...prev,
        assignedDelegates: prev.assignedDelegates.filter(d => d.id !== assigneeId)
      }));
    } catch (error) {
      console.error("Firestore Write Rejected:", error);
      toast.error("Database Error: " + error.message);
    }
  };

  const handleManualAssign = async (e) => {
    e.preventDefault();
    if (!assignEmail.trim() && (!isManuallyAssigned || !manuallyAssignedName.trim())) return;

    try {
      let updatedDelegates = [...delegates];

      if (isManuallyAssigned) {
        // Create a manual stub without an email
        const stub = {
          id: `MANUAL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          full_name: manuallyAssignedName.trim(),
          committee: selectedPortfolio.committee,
          portfolio_country: selectedPortfolio.item.country,
          portfolio: selectedPortfolio.item.country,
          status: "alloted",
          isManuallyAssigned: true,
          manuallyAssignedName: manuallyAssignedName.trim(),
          timestamp: new Date().toISOString()
        };
        updatedDelegates.push(stub);
        toast.success("MANUAL PORTFOLIO ALLOTED");
      } else {
        const email = assignEmail.trim().toLowerCase();
        const existingDelegate = delegates.find(d => d.email && d.email.toLowerCase() === email);
        
        if (existingDelegate) {
          if (existingDelegate.portfolio_country || existingDelegate.portfolio) {
            if (!window.confirm("This user already has a portfolio assigned. Overwrite?")) return;
          }
          updatedDelegates = updatedDelegates.map(d => {
            if (d.id === existingDelegate.id) {
              return { ...d, committee: selectedPortfolio.committee, portfolio: selectedPortfolio.item.country, portfolio_country: selectedPortfolio.item.country };
            }
            return d;
          });
          toast.success("PORTFOLIO ALLOTED TO EXISTING DELEGATE");
        } else {
          // Create a stub delegate
          const stub = {
            id: `STUB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            email: email,
            full_name: "Pending Registration",
            committee: selectedPortfolio.committee,
            portfolio_country: selectedPortfolio.item.country,
            portfolio: selectedPortfolio.item.country,
            status: "alloted",
            timestamp: new Date().toISOString()
          };
          updatedDelegates.push(stub);
          toast.success("PORTFOLIO ALLOTED TO NEW EMAIL (PENDING REGISTRATION)");
        }
      }

      await saveDelegates(updatedDelegates);
      await onUpdateDelegates(updatedDelegates);
      
      setAssignEmail("");
      setManuallyAssignedName("");
      setIsManuallyAssigned(false);
      
      // Refresh modal delegates
      const newlyAssigned = updatedDelegates.filter(d => 
        d.committee === selectedPortfolio.committee && 
        (d.portfolio === selectedPortfolio.item.country || d.portfolio_country === selectedPortfolio.item.country)
      );
      setSelectedPortfolio(prev => ({ ...prev, assignedDelegates: newlyAssigned }));
    } catch (error) {
      console.error("Firestore Write Rejected:", error);
      toast.error("Database Error: " + error.message);
    }
  };

  const handleToggleClose = () => {
    const isClosed = selectedPortfolio.assignedDelegates.some(d => d.email === "closed@atlas.com");
    if (isClosed) {
      // Reopen: remove all closed stubs for this portfolio
      const updatedDelegates = delegates.filter(d => 
        !(d.email === "closed@atlas.com" && d.committee === selectedPortfolio.committee && (d.portfolio === selectedPortfolio.item.country || d.portfolio_country === selectedPortfolio.item.country))
      );
      onUpdateDelegates(updatedDelegates);
      toast.success("REGISTRATION REOPENED");
      setSelectedPortfolio(prev => ({
        ...prev,
        assignedDelegates: prev.assignedDelegates.filter(d => d.email !== "closed@atlas.com")
      }));
    } else {
      // Close: add stubs for remaining slots
      const emptySlots = selectedPortfolio.maxAllowed - selectedPortfolio.assignedDelegates.length;
      if (emptySlots <= 0) {
        toast.error("Portfolio is already full.");
        return;
      }
      let updatedDelegates = [...delegates];
      const newStubs = [];
      for (let i = 0; i < emptySlots; i++) {
        const stub = {
          id: `CLOSED-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          email: "closed@atlas.com",
          full_name: "[REGISTRATION CLOSED]",
          committee: selectedPortfolio.committee,
          portfolio_country: selectedPortfolio.item.country,
          portfolio: selectedPortfolio.item.country,
          status: "closed",
          timestamp: new Date().toISOString()
        };
        updatedDelegates.push(stub);
        newStubs.push(stub);
      }
      onUpdateDelegates(updatedDelegates);
      toast.success("REGISTRATION CLOSED");
      setSelectedPortfolio(prev => ({
        ...prev,
        assignedDelegates: [...prev.assignedDelegates, ...newStubs]
      }));
    }
  };

  const handlePortfolioClick = (committee, item, maxAllowed, currentCount, committeeDelegates) => {
    console.log("PORTFOLIO BUTTON CLICKED:", item.country);
    try {
      const assigned = committeeDelegates.filter(d => {
        if (!d) return false;
        const port = d.portfolio || d.portfolio_country;
        return port === item.country;
      });
      console.log("Found assigned delegates:", assigned.length);
      setSelectedPortfolio({
        committee,
        item,
        maxAllowed,
        currentCount,
        assignedDelegates: assigned
      });
      console.log("State set to selectedPortfolio!");
    } catch (err) {
      toast.error("Error opening portfolio: " + err.message);
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-display tracking-wider">PORTFOLIO MATRIX TRACKER</h2>
          <p className="text-white/50 text-xs mt-1 font-mono">Live view of occupied and open portfolios across all committees.</p>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono tracking-widest border border-white/5 bg-black/20 px-4 py-2 rounded">
          <span className="flex items-center gap-1.5 text-white/80"><span className="w-2 h-2 bg-white border border-white/20 rounded-sm"></span> OPEN</span>
          <span className="flex items-center gap-1.5 text-red-400"><span className="w-2 h-2 bg-red-500/80 border border-red-500/20 rounded-sm"></span> OCCUPIED</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pr-2 scrollbar-thin flex-1 pb-10">
        {Object.entries(getMergedMatrixData(MATRIX_DATA, customPortfolios)).map(([committee, countries]) => {
          const committeeDelegates = delegates.filter(d => d.committee === committee);
          const committeeRegistrations = (registrations || []).filter(r => r.committee === committee && r.status === "pending_verification");
          const allCommitteeAssignees = [...committeeDelegates, ...committeeRegistrations];
          
          const occupiedMap = {};
          allCommitteeAssignees.forEach(d => {
            const port = d.portfolio || d.portfolio_country || d.portfolio_1;
            if (port) {
              occupiedMap[port] = (occupiedMap[port] || 0) + 1;
            }
          });

          let maxAllowed = 1;
          if (committee.includes("IPL")) maxAllowed = 3;
          else if (committee.includes("UNSC")) maxAllowed = 2;

          return (
            <div key={committee} className="glass rounded border border-white/5 p-4 flex flex-col max-h-[400px]">
              <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                <span className="classified-label text-[var(--atlas-cyan)] text-[10px] truncate shrink-0">
                  / {committee.toUpperCase()}
                </span>
                {maxAllowed > 1 && (
                  <span className="text-[8px] font-mono tracking-widest text-[var(--atlas-gold)] bg-[var(--atlas-gold)]/10 px-1.5 py-0.5 rounded">
                    MAX {maxAllowed}/PORTFOLIO
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 scrollbar-thin">
                {countries.map(item => {
                  const currentCount = occupiedMap[item.country] || 0;
                  const isOccupied = currentCount >= maxAllowed || item.status.toLowerCase() === "occupied";
                  let bgClass = "bg-white/5 hover:bg-white/10 text-white/80";
                  if (isOccupied) bgClass = "bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-500/20";
                  
                  return (
                    <button
                      key={item.country}
                      type="button"
                      onClick={() => handlePortfolioClick(committee, item, maxAllowed, currentCount, allCommitteeAssignees)}
                      className={`text-[9px] sm:text-[10px] font-mono py-2 px-2 rounded border border-transparent whitespace-normal break-words text-left transition-colors cursor-pointer ${bgClass}`}
                      title={item.country}
                    >
                      {item.country}
                      {maxAllowed > 1 && currentCount > 0 && (
                        <span className="block mt-1 text-[8px] opacity-70">
                          {currentCount} OUT OF {maxAllowed}
                        </span>
                      )}
                    </button>
                  );
                })}
                
                {/* ADD PORTFOLIO BUTTON & FIELD */}
                {addingPortfolioForCommittee === committee ? (
                  <div className="flex gap-1 col-span-2 mt-2">
                    <input 
                      type="text" 
                      value={newPortfolioName} 
                      onChange={(e) => setNewPortfolioName(e.target.value)} 
                      placeholder="Portfolio Name" 
                      className="bg-black/40 text-xs px-2 py-1 rounded border border-[var(--atlas-gold)] outline-none text-white w-full font-mono"
                    />
                    <button 
                      onClick={() => {
                        if(newPortfolioName.trim()){
                          const updated = { ...customPortfolios };
                          if(!updated[committee]) updated[committee] = [];
                          updated[committee].push({ country: newPortfolioName.trim() });
                          onUpdateCustomPortfolios(updated);
                          toast.success(`Portfolio added to ${committee}`);
                          setNewPortfolioName("");
                          setAddingPortfolioForCommittee(null);
                        }
                      }}
                      className="bg-[var(--atlas-gold)]/20 text-[var(--atlas-gold)] text-xs px-2 rounded font-bold hover:bg-[var(--atlas-gold)]/30 border border-[var(--atlas-gold)]"
                    >✓</button>
                    <button 
                      onClick={() => { setAddingPortfolioForCommittee(null); setNewPortfolioName(""); }}
                      className="bg-red-500/20 text-red-500 text-xs px-2 rounded font-bold hover:bg-red-500/30 border border-red-500/50"
                    >✗</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingPortfolioForCommittee(committee);
                      setNewPortfolioName("");
                    }}
                    className="col-span-2 mt-2 text-[9px] font-mono py-1.5 px-2 rounded border border-dashed border-white/20 text-white/50 hover:text-[var(--atlas-gold)] hover:border-[var(--atlas-gold)] transition-colors cursor-pointer text-center"
                  >
                    + ADD CUSTOM PORTFOLIO
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Modal for Selected Portfolio */}
      <AnimatePresence>
        {selectedPortfolio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0a0212]/95 border border-[var(--atlas-cyan)]/30 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-start bg-white/[0.02]">
                <div>
                  <span className="text-[10px] text-[var(--atlas-cyan)] font-mono tracking-widest block mb-1 uppercase">
                    {selectedPortfolio.committee}
                  </span>
                  <h3 className="font-display text-white text-xl">
                    {selectedPortfolio.item.country}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/50 font-mono">
                      {selectedPortfolio.assignedDelegates.length} OF {selectedPortfolio.maxAllowed} SLOTS OCCUPIED
                    </span>
                    {(selectedPortfolio.item.status.toLowerCase() === "occupied" || selectedPortfolio.assignedDelegates.some(d => d.email === "closed@atlas.com")) && (
                      <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-mono">CLOSED</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleClose}
                    className="text-[9px] font-mono tracking-widest border px-2 py-1 rounded transition-colors bg-white/5 hover:bg-white/10 text-white/70 border-white/20"
                  >
                    {selectedPortfolio.assignedDelegates.some(d => d.email === "closed@atlas.com") ? "REOPEN" : "CLOSE PORTFOLIO"}
                  </button>
                  <button
                    onClick={() => setSelectedPortfolio(null)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-6">
                <div>
                  <h4 className="font-mono text-[10px] text-white/50 tracking-widest mb-3 uppercase">Current Assignees</h4>
                  {selectedPortfolio.assignedDelegates.length === 0 ? (
                    <div className="text-[10px] text-white/30 font-mono border border-white/5 bg-white/[0.02] rounded p-3 text-center">
                      NO DELEGATES ASSIGNED
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPortfolio.assignedDelegates.map(d => {
                        const isRegistration = d.status === "pending_verification";
                        const isStub = d.id && d.id.toString().startsWith("STUB-");
                        const isClosed = d.email === "closed@atlas.com";
                        
                        let badgeText = "APPROVED";
                        let badgeColor = "bg-green-500/20 text-green-300 border-green-500/30";
                        
                        if (isRegistration) {
                          badgeText = "PENDING";
                          badgeColor = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
                        } else if (isStub) {
                          badgeText = "PRE-ALLOTTED";
                          badgeColor = "bg-[var(--atlas-gold)]/20 text-[var(--atlas-gold)] border-[var(--atlas-gold)]/30";
                        } else if (isClosed) {
                          badgeText = "CLOSED SLOT";
                          badgeColor = "bg-red-500/20 text-red-300 border-red-500/30";
                        }

                        return (
                          <div key={d.id} className="flex items-center justify-between bg-black/40 border border-white/10 rounded p-3">
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-2">
                                <p className="text-white font-display text-sm truncate">{d.full_name}</p>
                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${badgeColor} whitespace-nowrap`}>
                                  {badgeText}
                                </span>
                              </div>
                              <p className="text-[var(--atlas-cyan)] font-mono text-[9px] truncate mt-0.5">{d.email}</p>
                            </div>
                            <button
                              onClick={() => handleRevoke(d.id, isRegistration)}
                              className="text-[9px] text-red-400 border border-red-500/30 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors shrink-0"
                            >
                              REVOKE
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-5">
                  <h4 className="font-mono text-[10px] text-white/50 tracking-widest mb-3 uppercase">Manual Assignment</h4>
                  <form onSubmit={handleManualAssign} className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type={isManuallyAssigned ? "text" : "email"}
                        value={isManuallyAssigned ? manuallyAssignedName : assignEmail}
                        onChange={e => isManuallyAssigned ? setManuallyAssignedName(e.target.value) : setAssignEmail(e.target.value)}
                        placeholder={isManuallyAssigned ? "Enter manual assignee name..." : "Enter delegate email..."}
                        className="flex-1 bg-black/40 border border-white/15 focus:border-[var(--atlas-gold)] outline-none py-2 px-3 font-mono text-[11px] text-white rounded placeholder:text-white/30"
                        disabled={selectedPortfolio.assignedDelegates.length >= selectedPortfolio.maxAllowed}
                      />
                      <button
                        type="submit"
                        disabled={(!assignEmail && !manuallyAssignedName) || selectedPortfolio.assignedDelegates.length >= selectedPortfolio.maxAllowed}
                        className="bg-[var(--atlas-gold)] text-black font-mono text-[10px] font-bold px-4 py-2 rounded tracking-wider hover:bg-[#d4ae4a] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        SAVE / ASSIGN
                      </button>
                    </div>
                    <label className="flex items-center gap-2 text-white/50 text-[10px] font-mono mt-1">
                      <input 
                        type="checkbox" 
                        checked={isManuallyAssigned} 
                        onChange={(e) => setIsManuallyAssigned(e.target.checked)} 
                        className="accent-[var(--atlas-gold)]"
                      />
                      MANUAL ASSIGNMENT (NO UID)
                    </label>
                  </form>
                  {selectedPortfolio.assignedDelegates.length >= selectedPortfolio.maxAllowed && (
                    <p className="text-red-400 text-[9px] font-mono mt-2 tracking-widest">
                      MAXIMUM CAPACITY REACHED
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: AtlasPlusManager
// ----------------------------------------------------
// ----------------------------------------------------
function AtlasPlusManager({ delegates, registrations, payments, onUpdateDelegates, onUpdateRegistrations, onUpdatePayments, onRefresh }) {
  const pendingRegs = registrations.filter(r => r.status === "pending_verification").map(r => ({ ...r, source: 'registration', unifiedId: r.registration_id }));
  const allDelegates = delegates.map(d => ({ ...d, source: 'delegate', unifiedId: d.id }));
  const combined = [...pendingRegs, ...allDelegates]
    .filter(p => p.committee !== "Coachella (Simulated Crisis)")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const toggleAtlasPlus = (person) => {
    const isNowPlus = !person.is_atlas_plus;
    
    // Create clean object without UI-only fields
    const cleanPerson = { ...person };
    delete cleanPerson.source;
    delete cleanPerson.unifiedId;
    
    if (person.source === 'delegate') {
      const updatedDelegate = { ...cleanPerson, is_atlas_plus: isNowPlus, upgrade_pending: false };
      const updated = delegates.map(d => d.id === person.unifiedId ? updatedDelegate : d);
      onUpdateDelegates(updated);

      // Generate payment if they are upgrading
      if (isNowPlus) {
        const newPayment = {
          id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
          delegate_name: person.full_name,
          email: person.email,
          category: "ATLAS PLUS UPGRADE",
          package_name: "Atlas Plus Tier",
          price: 999,
          utr_number: person.upgrade_utr || "MANUAL_UPGRADE",
          status: "paid",
          timestamp: new Date().toISOString(),
        };
        const updatedPayments = [newPayment, ...payments];
        onUpdatePayments(updatedPayments);
        toast.success("PAYMENT RECORDED", { description: "Atlas Plus transaction logged." });
      }
    } else {
      const updatedRegistration = { ...cleanPerson, is_atlas_plus: isNowPlus, upgrade_pending: false };
      const updated = registrations.map(r => r.registration_id === person.unifiedId ? updatedRegistration : r);
      onUpdateRegistrations(updated);
    }
    toast.success("ATLAS PLUS UPDATED", { description: `${person.full_name} is now ${isNowPlus ? 'GRANTED' : 'REVOKED'} Atlas Plus.` });
    addActivityLog(`Atlas Plus access ${isNowPlus ? 'granted' : 'revoked'} for ${person.full_name}`);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4 flex justify-between items-end">
        <div>
          <span className="classified-label text-[var(--atlas-gold)] text-xs block">
            / PRIVILEGE ESCALATION
          </span>
          <h3 className="font-display text-white text-2xl">ATLAS PLUS MANAGER</h3>
          <p className="text-white/40 text-[10px] mt-1 font-mono">Grant or revoke Atlas Plus tier access across delegates and pending registrations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {combined.map((person) => (
          <div key={person.unifiedId} className={`glass rounded border p-4 flex flex-col justify-between transition-colors ${person.is_atlas_plus ? 'border-[var(--atlas-gold)] bg-[var(--atlas-gold)]/5' : 'border-white/5'}`}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-white/50">{person.unifiedId}</span>
                <span className={`text-[8px] tracking-widest px-1.5 py-0.5 rounded border font-mono ${person.source === 'delegate' ? 'border-[var(--atlas-cyan)]/30 text-[var(--atlas-cyan)] bg-[var(--atlas-cyan)]/10' : 'border-purple-500/30 text-purple-400 bg-purple-500/10'}`}>
                  {person.source.toUpperCase()}
                </span>
              </div>
              <h4 className="font-display text-white text-lg truncate">{person.full_name}</h4>
              <p className="text-[10px] text-white/50 font-mono truncate">{person.committee}</p>
              
              {person.upgrade_utr && (
                <div className="mt-2 bg-black/40 border border-white/10 rounded p-2 text-[10px] font-mono">
                  <span className="text-[var(--atlas-gold)] tracking-widest block mb-0.5 uppercase">UTR TRANSACTION ID</span> 
                  <span className="text-white break-all">{person.upgrade_utr}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
              <span className={`text-[10px] font-mono tracking-widest ${person.is_atlas_plus ? 'text-[var(--atlas-gold)] font-bold' : 'text-white/30'}`}>
                {person.is_atlas_plus ? '★ ATLAS PLUS ACTIVE' : 'STANDARD ACCESS'}
              </span>
              <button
                onClick={() => toggleAtlasPlus(person)}
                className={`text-[9px] px-3 py-1.5 rounded border font-mono tracking-wider transition-colors shrink-0 ${person.is_atlas_plus ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-[var(--atlas-gold)]/50 text-[var(--atlas-gold)] hover:bg-[var(--atlas-gold)]/10'}`}
              >
                {person.is_atlas_plus ? 'REVOKE' : 'GRANT PLUS'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Component: GoogleLoginsViewer
// ----------------------------------------------------
function GoogleLoginsViewer({ googleLogins }) {
  const logins = Array.isArray(googleLogins) ? googleLogins : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4 flex justify-between items-end">
        <div>
          <span className="classified-label text-[var(--atlas-cyan)] text-xs block">
            / SECURITY & IDENTITY
          </span>
          <h3 className="font-display text-white text-2xl">GOOGLE AUTH LOGS</h3>
          <p className="text-white/40 text-[10px] mt-1 font-mono">View raw Google authentication events from Atlas systems.</p>
        </div>
        <div className="text-[10px] text-[var(--atlas-cyan)] tracking-widest border border-[var(--atlas-cyan)]/30 px-3 py-1 rounded bg-[var(--atlas-cyan)]/10">
          {logins.length} LOGINS RECORDED
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="bg-white/5 text-white/50 border-b border-white/10 text-[10px] tracking-widest">
                <th className="px-6 py-4 font-normal">TIMESTAMP</th>
                <th className="px-6 py-4 font-normal">USER PROFILE</th>
                <th className="px-6 py-4 font-normal">EMAIL ADDRESS</th>
                <th className="px-6 py-4 font-normal">FIREBASE UID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logins.map((log) => (
                <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-white/50">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {log.photoURL ? (
                        <img src={log.photoURL} alt="Profile" className="w-6 h-6 rounded-full border border-white/20" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                          <span className="text-[8px] text-white/50">?</span>
                        </div>
                      )}
                      <span className="text-white font-semibold">{log.displayName || "Unknown User"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--atlas-cyan)]">
                    {log.email}
                  </td>
                  <td className="px-6 py-4 text-white/30 text-[10px]">
                    {log.uid}
                  </td>
                </tr>
              ))}
              {logins.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-white/30 tracking-widest">
                    NO LOGIN EVENTS RECORDED
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
