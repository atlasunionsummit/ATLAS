import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getDelegates,
  saveDelegates,
  getEvents,
  getDelegateNotes,
  saveDelegateNotes,
  getDirectMessages,
  saveDirectMessages,
  getBroadcastHistory,
} from "@/lib/atlasApi";
import { toast } from "sonner";

const MOCK_CONTACTS = {
  "UNSC (United Nations Security Council)": [
    { country: "USA", name: "Delegate of USA (UNSC)", stance: "We agree on the need for sanctions, but we must ensure humanitarian carve-outs in draft clause 3." },
    { country: "CHINA", name: "Delegate of China (UNSC)", stance: "We urge caution on unilateral actions and advise focusing on structured diplomatic dialogue." },
    { country: "FRANCE", name: "Delegate of France (UNSC)", stance: "Let's collaborate on compromise language for resolution section 5 before the next caucus." },
  ],
  "UNGA (United Nations General Assembly)": [
    { country: "UK", name: "Delegate of United Kingdom", stance: "The UK delegation supports the draft resolution on cyber security cooperation." },
    { country: "RUSSIA", name: "Delegate of Russian Federation", stance: "We must ensure national sovereignty is fully respected in any proposed digital treaty." },
  ],
  "AIPPM (All India Political Parties Meet)": [
    { country: "Opposition Leader", name: "Leader of Opposition", stance: "The current draft policies require a comprehensive review in the interest of citizens." },
    { country: "Home Minister", name: "Home Minister Representative", stance: "National security concerns must override standard administrative caucuses." },
  ],
  default: [
    { country: "Circuit Admin", name: "AUS Operator Liaison", stance: "Welcome to the circuit. Please present your holographic passport at the lobby check-in." },
    { country: "IP Chief", name: "International Press Editor", stance: "Submissions for the morning bulletin close in 30 minutes. Submit your draft logs." },
  ],
};

const VAULT_DOCUMENTS = [
  { title: "AUS 2026 Background Guide", category: "GUIDELINES", size: "2.4 MB" },
  { title: "Rules of Procedure (Delhi Protocol)", category: "PROTOCOL", size: "1.1 MB" },
  { title: "Draft Resolution Template 1.0", category: "TEMPLATES", size: "640 KB" },
  { title: "Vaidya Council Briefing Material", category: "CLASSIFIED", size: "5.8 MB" },
];

export default function DelegateDashboard({ onRequestAccess }) {
  const navigate = useNavigate();
  const [delegate, setDelegate] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [shownNotifications, setShownNotifications] = useState(new Set());

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
  }, [navigate]);

  // Read admin broadcasts for push notifications
  useEffect(() => {
    if (!delegate) return;

    const checkBroadcasts = async () => {
      try {
        const broadcasts = await getBroadcastHistory();
        // Check for any notification that we haven't shown yet
        const newAlerts = broadcasts.filter(b => !shownNotifications.has(b.id));
        if (newAlerts.length > 0) {
          setNotifications(prev => [...prev, ...newAlerts]);
          newAlerts.forEach(b => {
            // Mark as shown
            setShownNotifications(prev => {
              const updated = new Set(prev);
              updated.add(b.id);
              return updated;
            });
            // Show toast
            toast.info("COMMAND BROADCAST RECEIVED", {
              description: b.subject,
            });
          });
        }
      } catch (err) {
        console.error("Failed to load broadcasts:", err);
      }
    };

    checkBroadcasts();
    const interval = setInterval(checkBroadcasts, 8000);
    return () => clearInterval(interval);
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
    try {
      const globalDelegates = await getDelegates();
      const updatedList = globalDelegates.map(d => d.email.toLowerCase() === updatedDossier.email.toLowerCase() ? { ...d, ...updatedDossier } : d);
      await saveDelegates(updatedList);
      toast.success("PROFILE UPDATED", { description: "Dossier credentials synchronized with Command." });
    } catch (err) {
      toast.error("SYNC ERROR");
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
            { id: "agenda", label: "02 AGENDA TRACKER", icon: "📅" },
            { id: "messaging", label: "03 ENCRYPTED CHAT", icon: "💬" },
            { id: "notes", label: "04 SECURE NOTES", icon: "📝" },
            { id: "ai", label: "05 COMMAND AI", icon: "🤖" },
            { id: "map", label: "06 VENUE LOCATOR", icon: "🗺️" },
            { id: "vault", label: "07 DOCUMENT VAULT", icon: "📁" },
          ].map((tab) => (
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
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-black/20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/60 hover:text-white lg:hidden"
            >
              ☰
            </button>
            <span className="font-display text-lg tracking-wider text-white">
              DELEGATE CONTROL DESK
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[var(--atlas-cyan)] font-mono font-bold">
              ID · {delegate.id}
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
              {activeTab === "profile" && (
                <ProfileDesk delegate={delegate} onUpdate={handleProfileUpdate} />
              )}
              {activeTab === "agenda" && (
                <RestrictedOverlay delegate={delegate} onRequestAccess={onRequestAccess}>
                  <AgendaTracker delegate={delegate} />
                </RestrictedOverlay>
              )}
              {activeTab === "messaging" && (
                <RestrictedOverlay delegate={delegate} onRequestAccess={onRequestAccess}>
                  <EncryptedChat delegate={delegate} />
                </RestrictedOverlay>
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
              {activeTab === "map" && (
                <RestrictedOverlay delegate={delegate} onRequestAccess={onRequestAccess}>
                  <VenueLocator delegate={delegate} />
                </RestrictedOverlay>
              )}
              {activeTab === "vault" && (
                <RestrictedOverlay delegate={delegate} onRequestAccess={onRequestAccess}>
                  <DocumentVault delegate={delegate} />
                </RestrictedOverlay>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(form);
  };

  return (
    <div className="space-y-6 max-w-[600px]">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-gold)] text-xs block">
          / OPERATOR CREDENTIALS
        </span>
        <h3 className="font-display text-white text-2xl">DOSSIER SETTINGS</h3>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded border border-white/5 p-6 space-y-5">
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
// Tab Sub-component: AgendaTracker
// ----------------------------------------------------
function AgendaTracker({ delegate }) {
  const [events, setEvents] = useState([]);
  const [checkedEvents, setCheckedEvents] = useState(() => {
    try {
      const stored = localStorage.getItem(`aus_agenda_checked_${delegate.id}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const fetchEvents = async () => {
      const allEvents = await getEvents();
      // Filter events by committee and global
      const delegateCommittee = delegate.committee || "GUEST";
      const filtered = allEvents.filter(
        (e) => e.committee === "ALL" || e.committee.toLowerCase().includes(delegateCommittee.toLowerCase().split(" ")[0].toLowerCase())
      );
      setEvents(filtered);
    };
    fetchEvents();
  }, [delegate]);

  const toggleEvent = (id) => {
    const updated = { ...checkedEvents, [id]: !checkedEvents[id] };
    setCheckedEvents(updated);
    localStorage.setItem(`aus_agenda_checked_${delegate.id}`, JSON.stringify(updated));
    if (updated[id]) {
      toast.success("SESSION LOGGED", { description: "Marked as attended." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-[var(--atlas-cyan)] text-xs block">
          / COMMITMENTS SCHEDULE
        </span>
        <h3 className="font-display text-white text-2xl">AGENDA TRACKER</h3>
      </div>

      <div className="space-y-4 max-w-[700px]">
        {events.length === 0 ? (
          <div className="glass rounded p-8 border border-white/5 text-center text-white/30 text-xs">
            NO SESSIONS CONFIGURED FOR COMMITTEE {delegate.committee || "GUEST"}
          </div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              onClick={() => toggleEvent(e.id)}
              className={`cursor-pointer glass rounded border p-5 flex items-center justify-between gap-4 transition-all ${
                checkedEvents[e.id]
                  ? "border-emerald-500/20 bg-emerald-500/[0.02] opacity-65"
                  : "border-white/5 hover:border-white/10 hover:bg-white/[0.01]"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-widest text-[var(--atlas-cyan)] font-bold font-mono">
                    {e.time}
                  </span>
                  <span className="text-[9px] tracking-wider border border-white/10 rounded px-1.5 py-0.5 text-white/45">
                    {e.venue.toUpperCase()}
                  </span>
                </div>
                <h4 className={`font-display text-white text-base font-bold ${checkedEvents[e.id] ? "line-through text-white/50" : ""}`}>
                  {e.title}
                </h4>
              </div>

              <div
                className={`w-5 h-5 rounded border flex items-center justify-center font-mono text-xs transition-colors shrink-0 ${
                  checkedEvents[e.id]
                    ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                    : "border-white/15 text-transparent"
                }`}
              >
                ✓
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Sub-component: EncryptedChat (Direct Messaging)
// ----------------------------------------------------
function EncryptedChat({ delegate }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messageEndRef = useRef(null);

  // Set contacts based on committee
  useEffect(() => {
    const delegateCommittee = delegate.committee || "GUEST";
    let list = MOCK_CONTACTS[delegateCommittee];
    if (!list) {
      // Find key match or use default
      const key = Object.keys(MOCK_CONTACTS).find(k => delegateCommittee.includes(k.split(" ")[0]));
      list = key ? MOCK_CONTACTS[key] : MOCK_CONTACTS.default;
    }
    setContacts(list);
    setSelectedContact(list[0]);
  }, [delegate]);

  // Load message logs when contact changes
  useEffect(() => {
    if (!selectedContact) return;
    const loadLogs = async () => {
      const logs = await getDirectMessages(`${delegate.id}_${selectedContact.country}`);
      setMessages(logs);
    };
    loadLogs();
  }, [selectedContact, delegate]);

  // Scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      sender: "You",
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    await saveDirectMessages(`${delegate.id}_${selectedContact.country}`, updated);

    // Simulate reply
    setTyping(true);
    setTimeout(async () => {
      setTyping(false);
      const replyMsg = {
        sender: selectedContact.name,
        text: selectedContact.stance,
        timestamp: new Date().toISOString(),
      };
      const finalMsgs = [...updated, replyMsg];
      setMessages(finalMsgs);
      await saveDirectMessages(`${delegate.id}_${selectedContact.country}`, finalMsgs);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col md:flex-row border border-white/5 rounded-md overflow-hidden glass">
      {/* Contacts List */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">
        <div className="p-3 md:p-4 border-b border-white/5 bg-black/10 hidden md:block">
          <span className="classified-label text-purple-400 text-[9px] block">
            / SECURE DIRECTORIES
          </span>
          <h4 className="font-display text-white text-sm mt-1">COMMITTEE MEMBERS</h4>
        </div>
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto gap-2 p-2 scrollbar-none">
          {contacts.map((c) => (
            <button
              key={c.country}
              onClick={() => setSelectedContact(c)}
              className={`shrink-0 md:w-full text-left p-2.5 md:p-3 rounded font-mono text-xs transition-colors block ${
                selectedContact?.country === c.country
                  ? "bg-white/[0.04] text-[var(--atlas-cyan)] font-bold border-b-2 md:border-b-0 md:border-l-2 border-[var(--atlas-cyan)]"
                  : "text-white/60 hover:text-white hover:bg-white/[0.01]"
              }`}
            >
              <div className="text-[10.5px] truncate">{c.name}</div>
              <span className="text-[8px] tracking-widest text-white/30 block mt-0.5">
                ZONE ACTIVE · {c.country}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-[70vh] max-h-[550px] min-h-[380px]">
        {/* Active Contact Header */}
        <div className="p-4 border-b border-white/5 bg-black/10 shrink-0 flex items-center justify-between">
          <div>
            <h4 className="text-white text-xs font-bold font-mono">
              {selectedContact?.name}
            </h4>
            <span className="text-[8.5px] tracking-widest text-[var(--atlas-cyan)] block">
              STATUS · SECURE ENCRYPTED TERMINAL
            </span>
          </div>
        </div>

        {/* Message Logs */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((m, idx) => {
            const isUser = m.sender === "You";
            return (
              <div
                key={idx}
                className={`flex flex-col max-w-[80%] ${
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
                      : "bg-[#0b0212]/80 border border-white/5 text-white/90"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          {typing && (
            <div className="mr-auto items-start max-w-[80%]">
              <span className="text-[8.5px] text-white/30 font-mono tracking-wider">
                {selectedContact?.name} is typing...
              </span>
              <div className="rounded p-3 bg-[#0b0212]/80 border border-white/5 text-white/40 text-xs italic mt-1">
                Decrypting incoming transmission...
              </div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Form Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-black/10 shrink-0 flex gap-2">
          <input
            placeholder="Type encrypted message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow bg-transparent border border-white/10 rounded px-3 py-2 outline-none text-xs text-white focus:border-[var(--atlas-cyan)]"
          />
          <button type="submit" className="btn-atlas !py-2 !px-4 !text-xs shrink-0">
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
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      const data = await getDelegateNotes(delegate.id);
      setNotes(data);
    };
    loadNotes();
  }, [delegate]);

  const handleSave = async (v) => {
    setNotes(v);
    setSaving(true);
    await saveDelegateNotes(delegate.id, v);
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <div className="space-y-6 max-w-[750px]">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <span className="classified-label text-amber-400 text-xs block">
            / SECURE MEMORY DESK
          </span>
          <h3 className="font-display text-white text-2xl">DELEGATE NOTEPAD</h3>
        </div>

        <span className="text-[9.5px] font-mono tracking-widest text-white/35">
          {saving ? "SAVING ENCRYPTED TEXT..." : "AUTO-SAVED IN SECURE DOSSIER"}
        </span>
      </div>

      <div className="glass rounded border border-white/5 p-4 relative h-[50vh] min-h-[300px] md:h-[60vh] flex flex-col">
        <textarea
          value={notes}
          onChange={(e) => handleSave(e.target.value)}
          placeholder="Begin typing session logs, resolution clause outlines, debate points, or caucusing notes here..."
          className="w-full flex-grow bg-transparent outline-none border-none text-white font-mono text-xs leading-relaxed resize-none scrollbar-thin placeholder:text-white/20"
        />
        <div className="absolute bottom-2 right-4 text-[8px] text-white/25 font-mono tracking-widest">
          PERSISTED IN STORAGE
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Sub-component: AIChatbot (Command AI w/ Gemini)
// ----------------------------------------------------
function AIChatbot({ delegate }) {
  const [messages, setMessages] = useState([
    { sender: "System", text: "Welcome to MUN AI Command. Powered by Gemini AI. Ask me about MUN rules of procedure, crisis points, or resolution planning.", timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      sender: "You",
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Gemini API Key");
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `You are MUN Cognitive Command, an AI assistant for the Atlas Union Summit 2026. 
You help delegates with Model UN rules of procedure, resolution drafting, and diplomacy. 
Keep your responses concise, professional, and slightly futuristic/cybernetic in tone.
Answer the following query from a delegate:

${userMsg.text}`;

      const result = await model.generateContent(prompt);
      const reply = result.response.text();

      setMessages(prev => [...prev, {
        sender: "AI COMMAND",
        text: reply,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, {
        sender: "System",
        text: "Error: Failed to connect to AI Command core. Verify API credentials.",
        timestamp: new Date().toISOString(),
      }]);
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

// ----------------------------------------------------
// Tab Sub-component: VenueLocator (Interactive Map & Live Tracker)
// ----------------------------------------------------
function VenueLocator() {
  const [locationIndex, setLocationIndex] = useState(0);
  const [simulating, setSimulating] = useState(false);

  const LOCATIONS = [
    { zone: "Lobby Reception", note: "Verification gates active. Present your barcode seal to retrieve entry badges.", color: "bg-white/40" },
    { zone: "Plenary Hall", note: "Opening ceremony starting here soon. Standard committees converge.", color: "bg-[var(--atlas-purple)]" },
    { zone: "Council Room A", note: "UNSC (United Nations Security Council) is active in this room. Operator clearance: VERIFIED.", color: "bg-[var(--atlas-cyan)]" },
    { zone: "Hangar 4 Suite", note: "Simulation Corps and Vaidya Council (Premium) is active. Restricted entry.", color: "bg-red-500/80" },
    { zone: "Dining Lounge", note: "Lunch buffet service active. Delegate networking hub open.", color: "bg-[var(--atlas-gold)]" },
  ];

  const handleSimulate = () => {
    setSimulating(true);
    toast.success("INITIATING ZONE SCAN...", { description: "Pinging local terminal WiFi beacons." });
    
    setTimeout(() => {
      setSimulating(false);
      const nextIdx = (locationIndex + 1) % LOCATIONS.length;
      setLocationIndex(nextIdx);
      toast.success("ZONE RESOLVED", {
        description: `Current simulated zone: ${LOCATIONS[nextIdx].zone}`,
      });
    }, 1200);
  };

  const currentLocation = LOCATIONS[locationIndex];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="classified-label text-[var(--atlas-cyan)] text-xs block">
            / BEACON VENUE LOCATOR
          </span>
          <h3 className="font-display text-white text-2xl">INTERACTIVE VENUE MAP</h3>
        </div>

        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="px-3 py-1.5 border border-[var(--atlas-cyan)] text-[var(--atlas-cyan)] hover:bg-[var(--atlas-cyan)]/10 text-xs tracking-wider rounded transition-all font-mono"
        >
          {simulating ? "SCANNING CIRCUIT..." : "SIMULATE LIVE LOCATION"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Map visualization layout (CSS/HTML grid representation) */}
        <div className="lg:col-span-2 glass rounded border border-white/5 p-6 space-y-4">
          <span className="classified-label text-white/45 text-[10px] block">
            / TAJ PALACE CONFERENCE TERMINAL MAP
          </span>

          <div className="relative w-full aspect-[1.25/1] sm:aspect-[1.8/1] bg-black/60 rounded border border-white/5 flex flex-col p-4 justify-between select-none">
            {/* Top row */}
            <div className="flex justify-between gap-4 h-[42%]">
              <div className={`flex-1 border border-white/10 rounded flex flex-col items-center justify-center relative p-2 transition-all duration-500 ${
                currentLocation.zone === "Council Room A" ? "border-[var(--atlas-cyan)] bg-[var(--atlas-cyan)]/10 shadow-[0_0_15px_rgba(30,220,240,0.15)]" : "bg-white/[0.01]"
              }`}>
                <span className="text-[10px] text-white/80 font-bold font-mono">COUNCIL ROOM A</span>
                <span className="text-[7.5px] text-white/30 tracking-widest mt-1 block">UNSC ZONE</span>
                {currentLocation.zone === "Council Room A" && <span className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[var(--atlas-cyan)] animate-ping" />}
              </div>

              <div className={`flex-1 border border-white/10 rounded flex flex-col items-center justify-center relative p-2 transition-all duration-500 ${
                currentLocation.zone === "Hangar 4 Suite" ? "border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "bg-white/[0.01]"
              }`}>
                <span className="text-[10px] text-white/80 font-bold font-mono">HANGAR 4 SUITE</span>
                <span className="text-[7.5px] text-red-400/50 tracking-widest mt-1 block">PREMIUM TIER</span>
                {currentLocation.zone === "Hangar 4 Suite" && <span className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
              </div>
            </div>

            {/* Middle connecting hallway */}
            <div className={`h-[12%] border-y border-white/5 flex items-center justify-center relative transition-all duration-500 ${
              currentLocation.zone === "Lobby Reception" ? "bg-white/5" : ""
            }`}>
              <span className="text-[8px] text-white/30 tracking-[0.3em] font-mono">CENTRAL CONCOURSE HALL</span>
              {currentLocation.zone === "Lobby Reception" && <span className="absolute w-2 h-2 rounded-full bg-white animate-ping" />}
            </div>

            {/* Bottom row */}
            <div className="flex justify-between gap-4 h-[42%]">
              <div className={`flex-1 border border-white/10 rounded flex flex-col items-center justify-center relative p-2 transition-all duration-500 ${
                currentLocation.zone === "Plenary Hall" ? "border-[var(--atlas-purple)] bg-[var(--atlas-purple)]/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "bg-white/[0.01]"
              }`}>
                <span className="text-[10px] text-white/80 font-bold font-mono">PLENARY HALL</span>
                <span className="text-[7.5px] text-white/30 tracking-widest mt-1 block">ASSEMBLY AREA</span>
                {currentLocation.zone === "Plenary Hall" && <span className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[var(--atlas-purple)] animate-ping" />}
              </div>

              <div className={`flex-1 border border-white/10 rounded flex flex-col items-center justify-center relative p-2 transition-all duration-500 ${
                currentLocation.zone === "Dining Lounge" ? "border-[var(--atlas-gold)] bg-[var(--atlas-gold)]/10 shadow-[0_0_15px_rgba(201,164,76,0.15)]" : "bg-white/[0.01]"
              }`}>
                <span className="text-[10px] text-white/80 font-bold font-mono">DINING LOUNGE</span>
                <span className="text-[7.5px] text-white/30 tracking-widest mt-1 block">FOODCOURT</span>
                {currentLocation.zone === "Dining Lounge" && <span className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[var(--atlas-gold)] animate-ping" />}
              </div>
            </div>
          </div>
        </div>

        {/* Location Status details panel */}
        <div className="glass rounded border border-white/5 p-5 flex flex-col gap-4">
          <span className="classified-label text-[var(--atlas-gold)] text-[10px] block">
            / TELEMETRY FEEDBACK
          </span>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center bg-white/[0.02] p-3 border border-white/5 rounded">
              <span className="text-white/45">GPS BEACON SIGNAL</span>
              <span className="text-emerald-400 font-bold">100% SECURE</span>
            </div>

            <div className="p-3 border border-white/5 rounded space-y-1 bg-black/10">
              <span className="text-white/45 block text-[9.5px]">CURRENT RESOLVED ZONE</span>
              <span className="text-white text-base font-bold font-display tracking-wide uppercase">
                📍 {currentLocation.zone}
              </span>
            </div>

            <div className="p-4 rounded border border-[var(--atlas-cyan)]/25 bg-[var(--atlas-cyan)]/[0.02] leading-relaxed text-white/90">
              {currentLocation.note}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Tab Sub-component: DocumentVault
// ----------------------------------------------------
function DocumentVault() {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = (docTitle) => {
    setDownloading(docTitle);
    toast.info("VAULT DECRYPTION INITIATED", { description: `Downloading: ${docTitle}` });
    
    setTimeout(() => {
      setDownloading(null);
      toast.success("DECRYPTION COMPLETED", {
        description: `Saved ${docTitle} to operators download registry.`,
      });
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <span className="classified-label text-purple-400 text-xs block">
          / STORAGE DEPOSITORY
        </span>
        <h3 className="font-display text-white text-2xl">SECURE DOCUMENT VAULT</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[800px]">
        {VAULT_DOCUMENTS.map((d) => (
          <div key={d.title} className="glass rounded border border-white/5 p-5 flex justify-between items-center gap-4">
            <div className="space-y-1 font-mono text-xs">
              <span className="px-2 py-0.5 border border-white/10 rounded text-[9px] uppercase text-white/45">
                {d.category}
              </span>
              <h4 className="font-display text-white text-base font-bold mt-1.5">{d.title}</h4>
              <p className="text-white/40 text-[9.5px]">FILE SIZE · {d.size}</p>
            </div>

            <button
              onClick={() => handleDownload(d.title)}
              disabled={downloading === d.title}
              className="px-3 py-1.5 border border-[var(--atlas-gold)] text-[var(--atlas-gold)] hover:bg-[var(--atlas-gold)]/10 text-[10.5px] tracking-wider rounded font-mono shrink-0 disabled:opacity-40"
            >
              {downloading === d.title ? "DOWNLOADING..." : "DOWNLOAD"}
            </button>
          </div>
        ))}
      </div>
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
