// Firebase Firestore Database System for Atlas Union Summit 2026
import { db, auth, googleProvider } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  limit
} from "firebase/firestore";
import { signInWithPopup, signOut } from "firebase/auth";

// ----------------------------------------------------
// Google Authentication Wrapper Helpers
// ----------------------------------------------------

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  try {
    const loginRef = doc(collection(db, "google_logins"));
    await setDoc(loginRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Failed to log google login", err);
  }

  return user;
};

export const getGoogleLogins = async () => {
  const q = query(collection(db, "google_logins"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ _id: d.id, ...d.data() }));
};

export const signOutUser = async () => {
  await signOut(auth);
};

// ----------------------------------------------------
// Public API Operations
// ----------------------------------------------------

export const requestAccess = async (payload) => {
  const newId = `AUS-REQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const record = {
    id: newId,
    full_name: payload.full_name,
    email: payload.email,
    institution: payload.institution,
    interest: payload.interest,
    message: payload.message || "",
    timestamp: new Date().toISOString(),
  };

  await setDoc(doc(db, "access_requests", newId), record);
  await addActivityLog(`New access request submitted by ${payload.full_name}`);

  return {
    id: newId,
    email: payload.email,
    success: true,
  };
};

export const unlockClassified = async (code) => {
  if (code === "2526") {
    await addActivityLog("Classified archives decrypted via cipher 2526");
    return {
      unlocked: true,
      reveals: [
        {
          title: "MAJOR COLLABORATION",
          subtitle: "Operation Crimson",
          body: "A top-secret joint initiative between international research labs and Atlas cybernetic division.",
        },
        {
          title: "INTERNATIONAL EXPERIENCE",
          subtitle: "Global Envoy",
          body: "Exclusive immersive diplomatic scenarios in virtualized environments.",
        },
        {
          title: "INNOVATION ZONE",
          subtitle: "Project Hyperion",
          body: "Access to next-gen hardware, neural interfaces, and experimental web modules.",
        },
        {
          title: "PREMIUM OPPORTUNITY",
          subtitle: "Vanguard Circle",
          body: "Direct sponsorship matching, private networking channels, and founder grants.",
        },
        {
          title: "CLASSIFIED REVEAL",
          subtitle: "Aura Protocol",
          body: "The final stage of the Delhi circuit, revealing the core Guardian intelligence system.",
        },
      ],
    };
  } else {
    throw new Error("INVALID_CIPHER");
  }
};

export const generatePassport = async (payload) => {
  const delegateNum = Math.floor(1000 + Math.random() * 9000);
  const delegate_id = `AUS-${delegateNum}-2026`;

  const seal = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("").toUpperCase();

  const passportData = {
    delegate_name: payload.delegate_name,
    delegate_id: delegate_id,
    nationality: payload.nationality || "INDIA",
    committee: payload.committee,
    clearance: "ELITE",
    issued: "DEC 2025",
    expires: "31 DEC 2026",
    seal: seal,
    qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=08000F&color=C9A44C&data=AUS::${delegate_id}`,
    signature: "AUS/2026",
    is_atlas_plus: payload.is_atlas_plus || false,
    timestamp: new Date().toISOString(),
  };

  await setDoc(doc(db, "passports", delegate_id), passportData);

  // Increment operator stats
  try {
    const statsRef = doc(db, "stats", "network");
    const statsSnap = await getDoc(statsRef);
    if (statsSnap.exists()) {
      const currentOps = Number(statsSnap.data().operators || 2412);
      await updateDoc(statsRef, { operators: currentOps + 1 });
    }
  } catch (e) {
    console.error("Stats update failed", e);
  }

  await addActivityLog(`Holographic passport issued for operator ${payload.delegate_name}`);
  return passportData;
};

export const saveGuestPassport = async (guestPassport) => {
  try {
    await setDoc(doc(db, "guest_passports", guestPassport.delegate_id), guestPassport);
  } catch (e) {
    console.error("Failed to save guest passport", e);
  }
};

export const networkStats = async () => {
  try {
    const statsRef = doc(db, "stats", "network");
    const statsSnap = await getDoc(statsRef);
    if (statsSnap.exists()) {
      return statsSnap.data();
    }
    const defaultStats = {
      operators: 2412,
      encrypted_nodes: 41,
      network_status: "LIVE",
    };
    await setDoc(statsRef, defaultStats);
    return defaultStats;
  } catch (e) {
    console.error("Failed to load network stats:", e);
    return {
      operators: 2412,
      encrypted_nodes: 41,
      network_status: "LIVE",
    };
  }
};

export const registerUser = async (payload) => {
  const regNum = Math.floor(10000 + Math.random() * 90000);
  const registration_id = `AUS-PAY-${regNum}`;

  const registrationData = {
    registration_id: registration_id,
    full_name: payload.full_name,
    nickname: payload.nickname || "",
    email: payload.email.toLowerCase(),
    phone_number: payload.phone_number,
    country: payload.country,
    city_of_residence: payload.city_of_residence,
    committee: payload.committee,
    portfolio_country: payload.portfolio_country || "",
    portfolio: payload.portfolio || payload.portfolio_country || "",
    past_experience: payload.past_experience || "",
    dietary_instructions: payload.dietary_instructions || "",
    package_category: payload.package_category,
    package_name: payload.package_name,
    package_price: Number(payload.package_price),
    utr_number: payload.utr_number,
    date_of_birth: payload.date_of_birth || "",
    id_proof_base64: payload.id_proof_base64 || "",
    is_atlas_plus: payload.is_atlas_plus || false,
    status: "pending_verification",
    timestamp: new Date().toISOString(),
  };

  await setDoc(doc(db, "registrations", registration_id), registrationData);

  // Increment operator stats
  try {
    const statsRef = doc(db, "stats", "network");
    const statsSnap = await getDoc(statsRef);
    if (statsSnap.exists()) {
      const currentOps = Number(statsSnap.data().operators || 2412);
      await updateDoc(statsRef, { operators: currentOps + 1 });
    }
  } catch (e) {
    console.error("Stats update failed", e);
  }

  await addActivityLog(`Pending registration registered for ${payload.full_name} (UTR: ${payload.utr_number})`);
  return registrationData;
};

// ----------------------------------------------------
// Admin Operations
// ----------------------------------------------------

export const addActivityLog = async (action) => {
  try {
    const newLog = {
      text: action,
      timestamp: new Date().toISOString(),
    };
    await addDoc(collection(db, "activity_logs"), newLog);
  } catch (e) {
    console.error("Activity logging failed:", e);
  }
};

export const getActivityLogs = async () => {
  try {
    const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    const logs = [];
    snap.forEach((doc) => {
      logs.push(doc.data());
    });
    // Return default logs if empty
    if (logs.length === 0) {
      return [
        { text: "System database initialized", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
        { text: "Initial statistics synced", timestamp: new Date(Date.now() - 3600000).toISOString() }
      ];
    }
    return logs;
  } catch (e) {
    console.error("Failed to load activity logs:", e);
    return [];
  }
};

export const getRegistrations = async () => {
  try {
    const snap = await getDocs(collection(db, "registrations"));
    const regs = [];
    snap.forEach((doc) => {
      regs.push(doc.data());
    });
    return regs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (e) {
    console.error("Failed to load registrations:", e);
    return [];
  }
};

export const subscribeToRegistrations = (callback) => {
  try {
    return onSnapshot(collection(db, "registrations"), (snap) => {
      const regs = [];
      snap.forEach((doc) => {
        regs.push(doc.data());
      });
      callback(regs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    });
  } catch (e) {
    console.error("Failed to subscribe to registrations:", e);
    return () => { };
  }
};

export const getDiscountCodes = async () => {
  try {
    const snap = await getDocs(collection(db, "discount_codes"));
    const codes = [];
    snap.forEach((doc) => {
      codes.push({ id: doc.id, ...doc.data() });
    });
    return codes;
  } catch (e) {
    console.error("Failed to load discount codes:", e);
    return [];
  }
};

export const saveDiscountCode = async (codeData) => {
  try {
    const id = codeData.id || `DC-${Date.now()}`;
    await setDoc(doc(db, "discount_codes", id), { ...codeData, id });
    await addActivityLog(`Created discount code: ${codeData.code}`);
    return id;
  } catch (e) {
    console.error("Failed to save discount code:", e);
    throw e;
  }
};

export const deleteDiscountCode = async (id, codeString) => {
  try {
    await deleteDoc(doc(db, "discount_codes", id));
    await addActivityLog(`Deleted discount code: ${codeString}`);
  } catch (e) {
    console.error("Failed to delete discount code:", e);
    throw e;
  }
};

export const saveRegistrations = async (registrations) => {
  try {
    const snap = await getDocs(collection(db, "registrations"));
    const currentIds = snap.docs.map((doc) => doc.id);
    const newIds = registrations.map((r) => r.registration_id);

    // Removed bulk deletion logic to prevent race conditions with automated Cashfree registrations
    // Set/update current list
    for (const r of registrations) {
      await setDoc(doc(db, "registrations", r.registration_id), r);
    }
  } catch (e) {
    console.error("Failed to sync registrations:", e);
  }
};

export const getDelegates = async () => {
  try {
    const snap = await getDocs(collection(db, "delegates"));
    const delegates = [];
    snap.forEach((doc) => {
      delegates.push(doc.data());
    });
    return delegates.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (e) {
    console.error("Failed to load delegates:", e);
    return [];
  }
};

export const subscribeToDelegates = (callback) => {
  try {
    return onSnapshot(collection(db, "delegates"), (snap) => {
      const delegates = [];
      snap.forEach((doc) => {
        delegates.push(doc.data());
      });
      callback(delegates.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    });
  } catch (e) {
    console.error("Failed to subscribe to delegates:", e);
    return () => { };
  }
};



export const saveDelegates = async (delegates) => {
  try {
    const snap = await getDocs(collection(db, "delegates"));
    const currentIds = snap.docs.map((doc) => doc.id);
    const newIds = delegates.map((d) => d.id);

    // Removed bulk deletion logic to prevent race conditions with automated Cashfree delegates

    // Set/update current list
    for (const d of delegates) {
      await setDoc(doc(db, "delegates", d.id), d);
    }
  } catch (e) {
    console.error("Failed to sync delegates:", e);
    throw e;
  }
};

export const getPayments = async () => {
  try {
    const snap = await getDocs(collection(db, "payments"));
    const payments = [];
    snap.forEach((doc) => {
      payments.push(doc.data());
    });
    return payments.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (e) {
    console.error("Failed to load payments:", e);
    return [];
  }
};

export const savePayments = async (payments) => {
  try {
    const snap = await getDocs(collection(db, "payments"));
    const currentIds = snap.docs.map((doc) => doc.id);
    const newIds = payments.map((p) => p.id);

    // Removed bulk deletion logic to prevent race conditions with Cashfree payments

    // Set/update current list
    for (const p of payments) {
      await setDoc(doc(db, "payments", p.id), p);
    }
  } catch (e) {
    console.error("Failed to sync payments:", e);
  }
};

export const getEvents = async () => {
  try {
    const snap = await getDocs(collection(db, "events"));
    const events = [];
    snap.forEach((doc) => {
      events.push(doc.data());
    });
    if (events.length === 0) {
      const defaultEvents = [
        { id: "EVT-1", title: "Opening Ceremony", committee: "ALL", date: "2026-10-16", time: "09:00 - 10:30", venue: "Plenary Hall" },
        { id: "EVT-2", title: "UNSC Committee Session 1", committee: "UNSC (United Nations Security Council)", date: "2026-10-16", time: "11:00 - 13:30", venue: "Council Room A" },
        { id: "EVT-3", title: "Simulation Corps Briefing", committee: "Simulation Corps (Premium)", date: "2026-10-16", time: "14:30 - 17:00", venue: "Hangar 4" }
      ];
      for (const e of defaultEvents) {
        await setDoc(doc(db, "events", e.id), e);
      }
      return defaultEvents;
    }
    return events.sort((a, b) => a.id.localeCompare(b.id));
  } catch (e) {
    console.error("Failed to load events:", e);
    return [];
  }
};

export const saveEvents = async (events) => {
  try {
    const snap = await getDocs(collection(db, "events"));
    const currentIds = snap.docs.map((doc) => doc.id);
    const newIds = events.map((e) => e.id);

    // Removed bulk deletion logic to prevent race conditions

    for (const e of events) {
      await setDoc(doc(db, "events", e.id), e);
    }
  } catch (e) {
    console.error("Failed to sync events:", e);
  }
};

export const getConferenceSettings = async () => {
  try {
    const docRef = doc(db, "settings", "config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    const defaultSettings = {
      conference_name: "Atlas Union Summit 2026",
      dates: "October 16 - 18, 2026",
      venue: "IIT Delhi (TBD)",
      registration_fee: "₹1,499 - ₹2,799",
      early_bird_price: 1899,
      regular_price: 2299,
      atlas_plus_price: 999,
      email_template_confirmation: "Dear [NAME],\n\nYour operator credentials for the Atlas Union Summit 2026 have been approved!\n\nCommittee: [COMMITTEE]\nRegistration ID: [ID]\nStatus: APPROVED\n\nPlease present this email or your holographic Operator Passport at the check-in terminal on arrival.\n\nOperational Clearance,\nAtlas Command Group",
      email_template_rejection: "Dear [NAME],\n\nWe regret to inform you that your operator registration for the Atlas Union Summit 2026 has been declined.\n\nReason: Information Verification Failed.\n\nNote: If payment was processed, a 100% refund will be credited back within 5 business days.\n\nSecurity Operations,\nAtlas Command Group"
    };
    await setDoc(docRef, defaultSettings);
    return defaultSettings;
  } catch (e) {
    console.error("Failed to load settings:", e);
    return {};
  }
};

export const saveConferenceSettings = async (settings) => {
  try {
    await setDoc(doc(db, "settings", "config"), settings);
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
};

export const getBroadcastHistory = async () => {
  try {
    const snap = await getDocs(collection(db, "broadcasts"));
    const broadcasts = [];
    snap.forEach((doc) => {
      broadcasts.push(doc.data());
    });
    if (broadcasts.length === 0) {
      const defaultHistory = [
        { id: "BRD-1", subject: "Summit Schedule Released", targets: "All Delegates", body: "Check the website schedule tab...", timestamp: new Date(Date.now() - 3600000 * 24).toISOString() }
      ];
      for (const b of defaultHistory) {
        await setDoc(doc(db, "broadcasts", b.id), b);
      }
      return defaultHistory;
    }
    return broadcasts.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (e) {
    console.error("Failed to load broadcasts:", e);
    return [];
  }
};

export const addBroadcast = async (broadcast) => {
  try {
    await setDoc(doc(db, "broadcasts", broadcast.id), broadcast);
  } catch (e) {
    console.error("Failed to add broadcast:", e);
    throw e;
  }
};

export const subscribeToBroadcasts = (callback) => {
  try {
    return onSnapshot(collection(db, "broadcasts"), (snap) => {
      const broadcasts = [];
      snap.forEach((doc) => {
        broadcasts.push(doc.data());
      });
      callback(broadcasts.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    });
  } catch (e) {
    console.error("Failed to subscribe to broadcasts:", e);
    return () => { };
  }
};

export const saveBroadcastHistory = async (history) => {
  try {
    const snap = await getDocs(collection(db, "broadcasts"));
    const currentIds = snap.docs.map((doc) => doc.id);
    const newIds = history.map((b) => b.id);

    for (const id of currentIds) {
      if (!newIds.includes(id)) {
        await deleteDoc(doc(db, "broadcasts", id));
      }
    }
    for (const b of history) {
      await setDoc(doc(db, "broadcasts", b.id), b);
    }
  } catch (e) {
    console.error("Failed to sync broadcasts:", e);
  }
};

export const getDelegateNotes = async (delegateId) => {
  try {
    const docRef = doc(db, "delegate_notes", delegateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data().notes;
      // Handle legacy string notes by converting to a single note in an array
      if (typeof data === 'string') {
        return [{ id: 'legacy-note', title: 'Legacy Note', content: data, updated_at: new Date().toISOString() }];
      }
      return data || [];
    }
    return [];
  } catch (e) {
    console.error("Failed to fetch notes:", e);
    return [];
  }
};

export const saveDelegateNotes = async (delegateId, notes) => {
  try {
    await setDoc(doc(db, "delegate_notes", delegateId), {
      notes,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to save notes:", e);
  }
};

export const getAIChatHistory = async (delegateId) => {
  try {
    const docRef = doc(db, "ai_chat_history", delegateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().messages || [];
    }
    return [];
  } catch (e) {
    console.error("Failed to fetch AI chat:", e);
    return [];
  }
};

export const saveAIChatHistory = async (delegateId, messages) => {
  try {
    await setDoc(doc(db, "ai_chat_history", delegateId), {
      messages,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to save AI chat:", e);
  }
};

export const getVaultDocuments = async (delegateId) => {
  try {
    const docRef = doc(db, "vault_documents", delegateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().documents || [];
    }
    return [];
  } catch (e) {
    console.error("Failed to fetch vault documents:", e);
    return [];
  }
};

export const saveVaultDocuments = async (delegateId, documents) => {
  try {
    await setDoc(doc(db, "vault_documents", delegateId), {
      documents,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to save vault documents:", e);
  }
};

export const getDelegateTasks = async (delegateId) => {
  try {
    const docRef = doc(db, "delegate_tasks", delegateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().tasks || [];
    }
    return [];
  } catch (e) {
    console.error("Failed to fetch tasks:", e);
    return [];
  }
};

export const saveDelegateTasks = async (delegateId, tasks) => {
  try {
    await setDoc(doc(db, "delegate_tasks", delegateId), {
      tasks,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to save tasks:", e);
  }
};

export const getDirectMessages = async (delegateId) => {
  try {
    const docRef = doc(db, "direct_messages", delegateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().messages || [];
    }
    const defaultMessages = [
      { sender: "System", text: "Secure channel established. Begin transmission with committee members.", timestamp: new Date(Date.now() - 60000 * 5).toISOString() }
    ];
    await setDoc(docRef, { messages: defaultMessages });
    return defaultMessages;
  } catch (e) {
    console.error("Failed to load messages:", e);
    return [];
  }
};

export const saveDirectMessages = async (delegateId, messages) => {
  try {
    await setDoc(doc(db, "direct_messages", delegateId), {
      messages,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to save messages:", e);
  }
};

// ----------------------------------------------------
// E-Passport & Delegate Passes APIs
// ----------------------------------------------------

export const getPasses = async () => {
  try {
    const snap = await getDocs(collection(db, "passes"));
    const passes = [];
    snap.forEach((doc) => {
      passes.push(doc.data());
    });
    return passes;
  } catch (e) {
    console.error("Failed to fetch passes:", e);
    return [];
  }
};

export const getPassByEmail = async (email) => {
  try {
    const docRef = doc(db, "passes", email.toLowerCase());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch pass by email:", e);
    return null;
  }
};

export const getPassById = async (passId) => {
  try {
    const q = query(collection(db, "passes"), where("pass_id", "==", passId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data();
    }

    // Fallback: Check guest_passports
    const guestDocRef = doc(db, "guest_passports", passId);
    const guestSnap = await getDoc(guestDocRef);
    if (guestSnap.exists()) {
      const gData = guestSnap.data();
      return {
        ...gData,
        pass_id: gData.delegate_id,
      };
    }

    return null;
  } catch (e) {
    console.error("Failed to fetch pass by ID:", e);
    return null;
  }
};

export const savePass = async (passData) => {
  try {
    const docRef = doc(db, "passes", passData.email.toLowerCase());
    await setDoc(docRef, passData);
    await addActivityLog(`E-Passport updated for ${passData.delegate_name}`);
  } catch (e) {
    console.error("Failed to save pass:", e);
  }
};

export const revokePass = async (passId) => {
  try {
    const q = query(collection(db, "passes"), where("pass_id", "==", passId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      const data = snap.docs[0].data();
      await updateDoc(docRef, { status: "revoked" });
      await addActivityLog(`E-Passport REVOKED for ${data.delegate_name} (${passId})`);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to revoke pass:", e);
    return false;
  }
};

export const activatePass = async (passId) => {
  try {
    const q = query(collection(db, "passes"), where("pass_id", "==", passId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      const data = snap.docs[0].data();
      await updateDoc(docRef, { status: "active" });
      await addActivityLog(`E-Passport ACTIVATED for ${data.delegate_name} (${passId})`);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to activate pass:", e);
    return false;
  }
};

export const scanPass = async (passId, scanType) => {
  try {
    const q = query(collection(db, "passes"), where("pass_id", "==", passId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      const data = snap.docs[0].data();

      const newLog = {
        type: scanType,
        timestamp: new Date().toISOString()
      };

      const entryLogs = data.entry_logs || [];
      entryLogs.push(newLog);

      const updateData = {
        entry_logs: entryLogs
      };

      if (scanType === "entry") {
        updateData.status = "used";
      }

      await updateDoc(docRef, updateData);
      await addActivityLog(`Operator ${data.delegate_name} recorded ${scanType.toUpperCase()} at check-in terminal`);
      return { success: true, pass: { ...data, ...updateData } };
    }
    return { success: false, error: "PASS_NOT_FOUND" };
  } catch (e) {
    console.error("Failed to scan pass:", e);
    return { success: false, error: "DB_ERROR" };
  }
};

export const bulkGeneratePasses = async () => {
  try {
    const delegates = await getDelegates();
    let generatedCount = 0;

    for (const d of delegates) {
      const email = d.email.toLowerCase();
      const passRef = doc(db, "passes", email);
      const passSnap = await getDoc(passRef);

      if (!passSnap.exists()) {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const newPass = {
          pass_id: `AUS-PASS-${randNum}`,
          delegate_name: d.full_name,
          email: d.email.toLowerCase(),
          country: d.country,
          committee: d.committee,
          position: "Delegate",
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(d.full_name)}`,
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
        await setDoc(passRef, newPass);
        generatedCount++;
      }
    }
    if (generatedCount > 0) {
      await addActivityLog(`Bulk generated ${generatedCount} digital passes for approved delegates`);
    }
    return generatedCount;
  } catch (e) {
    console.error("Bulk pass generation failed:", e);
    return 0;
  }
};

// ----------------------------------------------------
// Real-Time Chat APIs
// ----------------------------------------------------

export const sendChatMessage = async (room, delegate, text) => {
  try {
    const messageData = {
      room: room,
      sender_id: delegate.id,
      sender_name: delegate.nickname || delegate.full_name || "Guest Operator",
      sender_country: delegate.country || "Observer",
      sender_profile_pic: delegate.profile_pic || null,
      text: text,
      timestamp: new Date().toISOString(),
    };
    await addDoc(collection(db, "live_chats"), messageData);
  } catch (e) {
    console.error("Failed to send chat message:", e);
  }
};

export const subscribeToChat = (room, callback) => {
  const q = query(
    collection(db, "live_chats"),
    orderBy("timestamp", "asc"),
    limit(100)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });

  return unsubscribe;
};

// ----------------------------------------------------
// COMMITTEES MANAGEMENT
// ----------------------------------------------------
export const getCommittees = async () => {
  try {
    const docRef = doc(db, "settings", "committees");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().list || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching committees:", error);
    return [];
  }
};

export const saveCommittees = async (committees) => {
  try {
    const docRef = doc(db, "settings", "committees");
    await setDoc(docRef, { list: committees, updated_at: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error("Error saving committees:", error);
    return false;
  }
};

// ----------------------------------------------------
// PORTFOLIOS (COUNTRIES) MANAGEMENT
// ----------------------------------------------------
export const getPortfolios = async () => {
  try {
    const docRef = doc(db, "settings", "portfolios");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {};
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    return {};
  }
};

export const savePortfolios = async (portfolios) => {
  try {
    const docRef = doc(db, "settings", "portfolios");
    await setDoc(docRef, { ...portfolios, updated_at: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error("Error saving portfolios:", error);
    return false;
  }
};

// ----------------------------------------------------
// INTERNATIONAL PRESS CREW
// ----------------------------------------------------
export const getPressCrew = async () => {
  try {
    const docRef = doc(db, "settings", "press_crew");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().list || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching press crew:", error);
    return [];
  }
};

export const savePressCrew = async (crew) => {
  try {
    const docRef = doc(db, "settings", "press_crew");
    await setDoc(docRef, { list: crew, updated_at: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error("Error saving press crew:", error);
    return false;
  }
};

// ----------------------------------------------------
// REVOKE DELEGATE ACCESS
// ----------------------------------------------------
export const revokeDelegate = async (delegateId, delegateName, delegateEmail) => {
  try {
    // Delete from delegates collection
    await deleteDoc(doc(db, "delegates", delegateId));

    // Revoke their pass if exists
    if (delegateEmail) {
      try {
        const passRef = doc(db, "passes", delegateEmail.toLowerCase());
        const passSnap = await getDoc(passRef);
        if (passSnap.exists()) {
          await updateDoc(passRef, { status: "revoked" });
        }
      } catch (e) {
        console.warn("Pass revocation skipped:", e);
      }
    }

    await addActivityLog(`Delegate access FULLY REVOKED for ${delegateName} (${delegateId})`);
    return true;
  } catch (error) {
    console.error("Error revoking delegate:", error);
    return false;
  }
};

// ----------------------------------------------------
// GRANT DELEGATE ACCESS (Admin creates delegate with Gmail)
// ----------------------------------------------------
export const grantDelegateAccess = async (payload) => {
  const delegateId = `AUS-ADMIN-${Math.floor(10000 + Math.random() * 90000)}`;
  const delegateData = {
    id: delegateId,
    full_name: payload.full_name,
    nickname: payload.nickname || "",
    email: payload.email.toLowerCase(),
    phone_number: payload.phone_number || "",
    country: payload.country || "",
    city_of_residence: payload.city_of_residence || "",
    committee: payload.committee,
    portfolio_country: payload.portfolio_country || "",
    portfolio: payload.portfolio_country || "",
    past_experience: payload.past_experience || "",
    dietary_instructions: payload.dietary_instructions || "",
    status: "alloted",
    role: "delegate",
    is_atlas_plus: payload.is_atlas_plus || false,
    granted_by_admin: true,
    timestamp: new Date().toISOString(),
  };

  await setDoc(doc(db, "delegates", delegateId), delegateData);
  await addActivityLog(`Admin granted delegate access to ${payload.full_name} (${payload.email})`);
  return delegateData;
};

