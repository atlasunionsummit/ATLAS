import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ATLAS } from "@/constants/testIds";
import { registerUser } from "@/lib/atlasApi";
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

const PACKAGES = {
  "STANDARD COMMITTEES": [
    { name: "Core Referral Access", price: 1499 },
    { name: "Early Bird", price: 1799 },
    { name: "Regular Phase", price: 1999 },
    { name: "Late Phase", price: 2199 },
  ],
  "⚡ PREMIUM EXPERIENCES (Vaidya Council • Simulation Corps • F1)": [
    { name: "Core Referral Access", price: 1999 },
    { name: "Early Bird", price: 2299 },
    { name: "Regular Phase", price: 2499 },
    { name: "Late Phase", price: 2799 },
  ],
  "⚡ INTERNATIONAL PRESS": [
    { name: "Core Referral Access", price: 1199 },
    { name: "Early Bird", price: 1399 },
    { name: "Regular Phase", price: 1599 },
    { name: "Late Phase", price: 1799 },
  ],
  "⚡ SCHOOL DELEGATE ACCESS": [
    { name: "Early Bird", price: 1499 },
    { name: "Regular Phase", price: 1699 },
    { name: "Late Phase", price: 1899 },
  ],
};

export default function AccessDialog({ open, onClose }) {
  const [step, setStep] = useState(1); // Steps: 1 = Dossier & Package, 2 = UPI Payment, 3 = Status
  const [form, setForm] = useState({
    full_name: "",
    nickname: "",
    email: "",
    phone_number: "",
    country: "INDIA",
    city_of_residence: "",
    committee: COMMITTEES[0],
    past_experience: "",
    dietary_instructions: "",
  });

  const [selectedCategory, setSelectedCategory] = useState("STANDARD COMMITTEES");
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);

  useEffect(() => {
    if (open) {
      const guest = localStorage.getItem("aus_guest_passport");
      if (guest) {
        try {
          const parsed = JSON.parse(guest);
          setForm(prev => {
            const foundCommittee = COMMITTEES.find(c => 
              c.toLowerCase().startsWith(parsed.committee.toLowerCase()) ||
              parsed.committee.toLowerCase().startsWith(c.split(" ")[0].toLowerCase())
            ) || COMMITTEES[0];

            return {
              ...prev,
              full_name: prev.full_name || parsed.delegate_name || "",
              country: prev.country || parsed.nationality || "INDIA",
              committee: foundCommittee,
            };
          });
        } catch (e) {
          console.error("Error loading guest details:", e);
        }
      }
    }
  }, [open]);

  const selectedPackage = PACKAGES[selectedCategory][selectedPkgIndex];

  const handleNextStep = (e) => {
    e?.preventDefault?.();
    if (
      !form.full_name ||
      !form.email ||
      !form.phone_number ||
      !form.city_of_residence
    ) {
      toast.error("MISSING FIELDS", {
        description: "Please fill out all required details in the dossier.",
      });
      return;
    }
    // Transition to payment step
    setStep(2);
  };

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault?.();
    if (!utr.trim() || utr.trim().length < 8) {
      toast.error("INVALID UTR", {
        description: "Please enter a valid UPI Transaction / UTR ID.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        package_category: selectedCategory,
        package_name: selectedPackage.name,
        package_price: selectedPackage.price,
        utr_number: utr.trim(),
      };

      const result = await registerUser(payload);
      setRegistrationResult(result);
      toast.success("TRANSMISSION COMPLETED", {
        description: `Ref ID: ${result.registration_id}`,
      });
      setStep(3);
    } catch (err) {
      toast.error("REGISTRATION FAILED", {
        description: "An error occurred during submission. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    onClose();
    // Reset state after transition completes
    setTimeout(() => {
      setStep(1);
      setForm({
        full_name: "",
        nickname: "",
        email: "",
        phone_number: "",
        country: "INDIA",
        city_of_residence: "",
        committee: COMMITTEES[0],
        past_experience: "",
        dietary_instructions: "",
      });
      setSelectedCategory("STANDARD COMMITTEES");
      setSelectedPkgIndex(0);
      setUtr("");
      setRegistrationResult(null);
    }, 400);
  };

  const copyUPI = () => {
    navigator.clipboard.writeText("9140738627@axl");
    toast.success("UPI ID COPIED", {
      description: "Copied '9140738627@axl' to clipboard.",
    });
  };

  // Generate UPI pay URI for the QR code
  const upiURI = `upi://pay?pa=9140738627@axl&pn=Namita%20Agrawal&am=${selectedPackage?.price || 0}&cu=INR&tn=AUS2026-REG`;
  const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=08000F&color=C9A44C&data=${encodeURIComponent(
    upiURI
  )}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid={ATLAS.accessDialog}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[160] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={close}
          />
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full max-w-[650px] max-h-[90vh] overflow-y-auto glass-strong rounded-md p-6 sm:p-8 md:p-10 scrollbar-thin"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="classified-label text-[var(--atlas-gold)] text-xs sm:text-sm">
                  / ATLAS PAY
                </span>
                <span className="text-[10px] tracking-[0.2em] px-2 py-0.5 rounded border border-[var(--atlas-cyan)]/30 text-[var(--atlas-cyan)]">
                  SECURE PORTAL
                </span>
              </div>
              <button
                onClick={close}
                className="font-mono text-xs text-white/60 hover:text-white transition-colors"
              >
                CLOSE ✕
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-between mt-6 px-2 sm:px-6">
              {[
                { s: 1, label: "01 DOSSIER" },
                { s: 2, label: "02 PAYMENT" },
                { s: 3, label: "03 STATUS" },
              ].map((item, idx) => (
                <div key={item.s} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center gap-1.5 mx-auto">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] border transition-all duration-300 ${
                        step === item.s
                          ? "border-[var(--atlas-gold)] bg-[var(--atlas-gold)]/10 text-[var(--atlas-gold)] shadow-[0_0_8px_rgba(201,164,76,0.3)]"
                          : step > item.s
                          ? "border-[var(--atlas-cyan)] bg-[var(--atlas-cyan)]/10 text-[var(--atlas-cyan)]"
                          : "border-white/10 text-white/30"
                      }`}
                    >
                      {item.s}
                    </div>
                    <span
                      className={`font-mono text-[9px] tracking-widest transition-colors ${
                        step >= item.s ? "text-white/80" : "text-white/30"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div
                      className={`h-[1px] flex-grow mx-2 transition-colors duration-300 ${
                        step > item.s ? "bg-[var(--atlas-cyan)]/50" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="mt-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="font-display text-white text-2xl sm:text-3xl leading-none">
                      REGISTRATION DOSSIER
                    </h3>
                    <p className="text-white/60 text-xs sm:text-sm mt-2">
                      Please supply accurate details. Your operator profile is synced with Atlas.
                    </p>

                    <form onSubmit={handleNextStep} className="mt-6 space-y-5">
                      {/* Grid Form Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                          label="FULL NAME *"
                          required
                          value={form.full_name}
                          onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
                        />
                        <Field
                          label="NICKNAME / CALLSIGN"
                          value={form.nickname}
                          placeholder="e.g. Maverick"
                          onChange={(v) => setForm((f) => ({ ...f, nickname: v }))}
                        />
                        <Field
                          label="EMAIL ADDRESS *"
                          type="email"
                          required
                          value={form.email}
                          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                        />
                        <Field
                          label="PHONE NUMBER *"
                          type="tel"
                          required
                          value={form.phone_number}
                          placeholder="+91 XXXXX XXXXX"
                          onChange={(v) => setForm((f) => ({ ...f, phone_number: v }))}
                        />
                        <Field
                          label="COUNTRY *"
                          required
                          value={form.country}
                          onChange={(v) => setForm((f) => ({ ...f, country: v }))}
                        />
                        <Field
                          label="CITY OF RESIDENCE *"
                          required
                          value={form.city_of_residence}
                          onChange={(v) => setForm((f) => ({ ...f, city_of_residence: v }))}
                        />
                      </div>

                      {/* Committee & Special Requirements */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="classified-label text-white/50 text-[10px]">
                            CHOOSE TARGET COMMITTEE *
                          </label>
                          <select
                            value={form.committee}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, committee: e.target.value }))
                            }
                            className="w-full mt-1 bg-transparent border-b border-white/15 focus:border-[var(--atlas-gold)] outline-none py-2.5 font-mono text-[11px] tracking-wider text-white"
                          >
                            {COMMITTEES.map((c) => (
                              <option key={c} value={c} className="bg-[var(--atlas-black)]">
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <Field
                          label="PAST MUN / DEBATE EXPERIENCE"
                          isTextArea
                          rows={2}
                          placeholder="List key conferences, portfolios, or experience..."
                          value={form.past_experience}
                          onChange={(v) => setForm((f) => ({ ...f, past_experience: v }))}
                        />

                        <Field
                          label="DIETARY INSTRUCTIONS / SPECIAL REQUIREMENTS"
                          isTextArea
                          rows={1.5}
                          placeholder="Allergies, preferences, or medical conditions..."
                          value={form.dietary_instructions}
                          onChange={(v) => setForm((f) => ({ ...f, dietary_instructions: v }))}
                        />
                      </div>

                      {/* Package Section */}
                      <div className="border-t border-white/5 pt-6 mt-6">
                        <span className="classified-label text-[var(--atlas-gold)] text-xs">
                          SELECT ENTRY PASS PACKAGE
                        </span>

                        {/* Category Selector Tabs */}
                        <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none mt-2">
                          {Object.keys(PACKAGES).map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(category);
                                setSelectedPkgIndex(0);
                              }}
                              className={`px-3 py-1.5 rounded-sm border font-mono text-[9.5px] tracking-wider whitespace-nowrap transition-all ${
                                selectedCategory === category
                                  ? "border-[var(--atlas-gold)] bg-[var(--atlas-gold)]/10 text-[var(--atlas-gold)]"
                                  : "border-white/5 text-white/50 hover:text-white"
                              }`}
                            >
                              {category.replace("⚡ ", "")}
                            </button>
                          ))}
                        </div>

                        {/* Packages Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {PACKAGES[selectedCategory].map((pkg, idx) => (
                            <div
                              key={pkg.name}
                              onClick={() => setSelectedPkgIndex(idx)}
                              className={`cursor-pointer rounded border p-4 transition-all flex justify-between items-center ${
                                selectedPkgIndex === idx
                                  ? "border-[var(--atlas-gold)] bg-[var(--atlas-gold)]/5 shadow-[0_0_12px_rgba(201,164,76,0.1)]"
                                  : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span
                                  className={`font-mono text-[9px] tracking-widest ${
                                    selectedPkgIndex === idx
                                      ? "text-[var(--atlas-gold)]"
                                      : "text-white/55"
                                  }`}
                                >
                                  CATEGORY LEVEL
                                </span>
                                <span className="font-display text-white text-base mt-1">
                                  {pkg.name}
                                </span>
                              </div>
                              <span className="font-mono text-white text-base tracking-wider font-semibold">
                                ₹{pkg.price}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-6 flex-wrap gap-4">
                        <p className="font-mono text-[9px] tracking-widest text-white/40">
                          * MANDATORY FIELD DOSSIERS
                        </p>
                        <button type="submit" className="btn-atlas">
                          PROCEED TO PAY <span>↗</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <button
                        onClick={() => setStep(1)}
                        className="font-mono text-[10px] text-[var(--atlas-cyan)] hover:underline"
                      >
                        ← BACK TO REGISTRATION
                      </button>
                      <h3 className="font-display text-white text-2xl sm:text-3xl leading-none mt-3">
                        ATLAS PAY SECURE GATEWAY
                      </h3>
                      <p className="text-white/60 text-xs sm:text-sm mt-1">
                        Scan the dynamically encoded UPI QR code below to complete the transaction.
                      </p>
                    </div>

                    {/* Receipt Summary */}
                    <div className="glass rounded-md p-5 border border-white/5">
                      <p className="classified-label text-white/55 text-[10px]">RECEIPT OVERVIEW</p>
                      <div className="mt-3 space-y-2 font-mono text-xs tracking-wider">
                        <div className="flex justify-between">
                          <span className="text-white/55">OPERATOR</span>
                          <span className="text-white font-semibold">
                            {form.full_name.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/55">COMMITTEE</span>
                          <span className="text-white max-w-[200px] truncate text-right">
                            {form.committee}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/55">SELECTED TICKET</span>
                          <span className="text-[var(--atlas-gold)]">
                            {selectedCategory.replace("⚡ ", "")} · {selectedPackage.name}
                          </span>
                        </div>
                        <div className="h-[1px] bg-white/10 my-3" />
                        <div className="flex justify-between text-sm">
                          <span className="text-white font-medium">TOTAL DUE</span>
                          <span className="text-[var(--atlas-cyan)] font-bold text-base">
                            ₹{selectedPackage.price}.00
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* UPI QR Code Block */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center border-t border-white/5 pt-6">
                      <div className="flex flex-col items-center justify-center p-4 bg-[#08000f]/80 rounded border border-[var(--atlas-gold)]/20 relative">
                        <div className="absolute top-2 left-2 text-[8px] font-mono tracking-widest text-[var(--atlas-gold)]">
                          SCAN ME
                        </div>
                        <img
                          src="/payment_qr.jpg"
                          alt="UPI QR Code"
                          className="w-[180px] h-[180px] object-contain rounded-sm"
                          onError={(e) => {
                            e.target.src = qrURL;
                          }}
                        />
                        <span className="font-mono text-[9px] tracking-widest text-white/40 mt-3">
                          PHONEPE MERCHANT QR
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="classified-label text-white/55 text-[10px]">
                            PAY VIA UPI ID
                          </span>
                          <div className="flex items-center gap-2 mt-1.5">
                            <code className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono text-[13px] flex-grow tracking-wider">
                              9140738627@axl
                            </code>
                            <button
                              onClick={copyUPI}
                              className="px-3 py-2 rounded border border-[var(--atlas-gold)] text-[var(--atlas-gold)] hover:bg-[var(--atlas-gold)]/10 font-mono text-xs tracking-wider transition-colors"
                            >
                              COPY
                            </button>
                          </div>
                        </div>

                        <div className="text-white/60 text-xs leading-[1.6]">
                          👉 Scan the QR code or pay using the UPI ID. Once the transaction is completed, retrieve the <span className="text-white font-bold">12-digit UTR/Transaction ID</span> from your bank app history and enter it below.
                        </div>
                      </div>
                    </div>

                    {/* UTR Input Form */}
                    <form onSubmit={handleRegisterSubmit} className="border-t border-white/5 pt-5 space-y-4">
                      <div>
                        <label className="classified-label text-[var(--atlas-gold)] text-[10.5px]">
                          ENTER 12-DIGIT TRANSACTION UTR ID *
                        </label>
                        <input
                          required
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          placeholder="e.g. 306712495810"
                          maxLength={16}
                          className="w-full mt-2 bg-transparent border-b border-white/15 focus:border-[var(--atlas-gold)] outline-none py-3 font-mono text-base tracking-[0.2em] text-white placeholder:text-white/20 text-center"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4 flex-wrap pt-3">
                        <span className="font-mono text-[9px] tracking-wider text-white/45 flex items-center gap-1.5">
                          🛡️ 256-BIT END-TO-END ENCRYPTED CHECKOUT
                        </span>
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn-atlas !w-full sm:!w-auto text-center"
                        >
                          {loading ? "TRANSMITTING PROOF…" : "SUBMIT REGISTRATION"} <span>↗</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {step === 3 && registrationResult && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-6 text-center space-y-6"
                  >
                    <div className="mx-auto w-16 h-16 rounded-full glass border border-[var(--atlas-cyan)]/45 flex items-center justify-center text-[var(--atlas-cyan)] text-3xl glow-purple">
                      ✓
                    </div>

                    <div className="space-y-2">
                      <span className="classified-label text-[var(--atlas-cyan)] text-xs">
                        ◇ TRANSMISSION REGISTERED
                      </span>
                      <h3 className="font-display text-white text-3xl sm:text-4xl leading-none">
                        PENDING AUDIT.
                      </h3>
                      <p className="font-mono text-[10px] tracking-[0.3em] text-[var(--atlas-gold)]">
                        DOSSIER CODE: {registrationResult.registration_id}
                      </p>
                    </div>

                    <div className="glass rounded p-6 max-w-[480px] mx-auto border border-white/5 text-left text-xs leading-relaxed space-y-4">
                      <div className="text-white/80">
                        Your payment is completed! Please wait till the co-ordinator verifies and approves your payment.
                      </div>
                      <div className="text-white/70 border-t border-white/10 pt-3 flex items-start gap-2">
                        <span className="text-[var(--atlas-gold)]">✦</span>
                        <span>
                          Don't worry, your money is safe. If your registration is not approved, you will get a **100% refund** credited back.
                        </span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button onClick={close} className="btn-ghost px-8">
                        CLOSE INTERFACE
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  placeholder = "",
  type = "text",
  required = false,
  isTextArea = false,
  rows = 3,
  value,
  onChange,
  className = "",
}) {
  return (
    <div className={className}>
      <label className="classified-label text-white/50 text-[10px]">
        {label}
      </label>
      {isTextArea ? (
        <textarea
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full mt-1 bg-transparent border-b border-white/15 focus:border-[var(--atlas-gold)] outline-none py-2 text-white text-xs leading-relaxed transition-colors placeholder:text-white/20"
        />
      ) : (
        <input
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full mt-1 bg-transparent border-b border-white/15 focus:border-[var(--atlas-gold)] outline-none py-2 text-white text-xs transition-colors placeholder:text-white/20"
        />
      )}
    </div>
  );
}
