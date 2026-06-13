import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser, getDiscountCodes, getDelegates } from "@/lib/atlasApi";
import { MATRIX_DATA } from "@/lib/matrixData";
import { toast } from "sonner";

const COMMITTEES = [
  "UNSC (United Nations Security Council)",
  "UNGA (United Nations General Assembly)",
  "AIPPM (All India Political Parties Meet)",
  "UNCSW (UN Commission on the Status of Women)",
  "UNFCCC (UN Framework Convention on Climate Change)",
  "Coachella (Simulated Crisis)",
  "IPL (Indian Premier League)",
  "International Press",
  "Vaidya Council (Premium)",
  "Simulation Corps (Premium)",
  "F1 Simulation (Premium)",
];

const EXCEPTION_COMMITTEES = [
  "Vaidya Council (Premium)",
  "Simulation Corps (Premium)",
  "F1 Simulation (Premium)",
];

const COMMITTEE_RULES = {
  "UNCSW (UN Commission on the Status of Women)": { type: "experience", max: 5 },
  "UNFCCC (UN Framework Convention on Climate Change)": { type: "grade", min: 6, max: 9 },
  "Coachella (Simulated Crisis)": { type: "grade", min: 6, max: 12 },
};


const PACKAGES = {
  "Model United Nations": [
    { name: "Early Bird", price: 1799 },
  ],
  "School delegation": [
    { name: "Early Bird", price: 1699 },
  ],
  "For festival": [
    { name: "Early Bird", price: 299 },
  ],
  "For concert": [
    { name: "Early Bird", price: 999 },
  ],
};

export default function AccessDialog({ open, onClose }) {
  const [step, setStep] = useState(1); // Steps: 1 = Dossier, 2 = Matrix, 3 = Package, 4 = UPI Payment, 5 = Status
  const [form, setForm] = useState({
    full_name: "",
    nickname: "",
    email: "",
    phone_number: "",
    country: "INDIA",
    city_of_residence: "",
    committee: COMMITTEES[0],
    portfolio_country: "",
    past_experience: "",
    dietary_instructions: "",
    referralCode: "",
    device_os: "Android",
    is_atlas_plus: false,
    grade: "",
    experience_count: "",
    date_of_birth: "",
    id_proof_base64: "",
  });

  const [activeDiscountCodes, setActiveDiscountCodes] = useState([]);
  const [occupiedMap, setOccupiedMap] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("Model United Nations");
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    getDiscountCodes().then(setActiveDiscountCodes).catch(console.error);
    getDelegates().then(delegates => {
      const occ = {};
      delegates.forEach(d => {
        if (d.portfolio_country) occ[d.portfolio_country] = true;
      });
      setOccupiedMap(occ);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const targetDate = new Date("2026-06-25T23:59:59").getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        setTimeLeft("EXPIRED");
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Calculate dynamic price based on discount codes
  const isLegacyDiscount = form.referralCode.toUpperCase() === "ATLASUNIONSUMMIT2026";
  const matchingDynamicCode = activeDiscountCodes.find(c => c.code.toUpperCase() === form.referralCode.toUpperCase() && (c.appliesTo === "All Categories" || c.appliesTo === selectedCategory));
  
  let finalPrice = selectedPackage.price;
  let appliedDiscountText = null;

  if (matchingDynamicCode) {
    finalPrice = Math.round(selectedPackage.price * (1 - matchingDynamicCode.percentage / 100));
    appliedDiscountText = `${matchingDynamicCode.percentage}% OFF APPLIED`;
  } else if (isLegacyDiscount) {
    finalPrice = selectedPackage.price - 300;
    appliedDiscountText = "REFERRAL APPLIED";
  }

  const handleIdUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("FILE TOO LARGE", { description: "Maximum ID size is 5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxSize = 1024;
        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64Str = canvas.toDataURL("image/jpeg", 0.7);
        setForm((f) => ({ ...f, id_proof_base64: base64Str }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const payPrice = form.is_atlas_plus ? finalPrice + 2000 : finalPrice;

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

    if (!form.date_of_birth || !form.id_proof_base64) {
      toast.error("VERIFICATION REQUIRED", {
        description: "Please enter your Date of Birth and upload an ID proof.",
      });
      return;
    }
    const dob = new Date(form.date_of_birth);
    const ageDifMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 13) {
      toast.error("AGE RESTRICTION", {
        description: `You must be at least 13 years old to register for the summit.`,
      });
      return;
    }

    const rule = COMMITTEE_RULES[form.committee];
    if (rule) {
      if (rule.type === "grade") {
        if (!form.grade) {
          toast.error("GRADE REQUIRED", {
            description: "Please select your current standard/grade.",
          });
          return;
        }
        const gradeMap = {
          "Below 6th": 5, "6th": 6, "7th": 7, "8th": 8, "9th": 9, "10th": 10, "11th": 11, "12th": 12, "College/University": 13
        };
        const gradeVal = gradeMap[form.grade];
        if (gradeVal < rule.min || gradeVal > rule.max) {
          toast.error("RESTRICTED COMMITTEE", {
            description: `This committee is strictly for students from ${rule.min}th to ${rule.max}th grade.`,
          });
          return;
        }
      } else if (rule.type === "experience") {
        if (!form.experience_count) {
          toast.error("EXPERIENCE REQUIRED", {
            description: "Please specify your number of past MUNs.",
          });
          return;
        }
        const expMap = {
          "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6+": 6
        };
        const expVal = expMap[form.experience_count];
        if (expVal > rule.max) {
          toast.info("RECOMMENDED FOR BEGINNERS", {
            description: `Note: This committee is tailored for delegates with 0-5 MUNs of experience.`,
          });
          // Do not return, allow them to proceed
        }
      }
    }
    
    const isException = EXCEPTION_COMMITTEES.includes(form.committee);
    if (isException) {
      setStep(3); // Skip Matrix
    } else {
      setStep(2); // Go to Matrix
    }
  };

  const handleProceedToPackage = (e) => {
    e?.preventDefault?.();
    if (!form.portfolio_country) {
      toast.error("PORTFOLIO REQUIRED", {
        description: "Please select an available portfolio from the matrix.",
      });
      return;
    }
    setStep(3);
  };

  const handleProceedToPay = (e) => {
    e?.preventDefault?.();
    setStep(3.5); // Go to Atlas Plus Upsell
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
        package_name: form.is_atlas_plus ? `${selectedPackage.name} + ATLAS PLUS` : selectedPackage.name,
        package_price: payPrice,
        utr_number: utr.trim(),
      };

      const result = await registerUser(payload);
      setRegistrationResult(result);
      toast.success("TRANSMISSION COMPLETED", {
        description: `Ref ID: ${result.registration_id}`,
      });
      setStep(5);
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
        portfolio_country: "",
        past_experience: "",
        dietary_instructions: "",
        referralCode: "",
        grade: "",
        experience_count: "",
        date_of_birth: "",
        id_proof_base64: "",
      });
      setSelectedCategory("Model United Nations");
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

  const upiURI = `upi://pay?pa=9140738627@axl&pn=Namita%20Agrawal&am=${finalPrice || 0}&cu=INR&tn=AUS2026-REG`;
  const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=08000F&color=C9A44C&data=${encodeURIComponent(
    upiURI
  )}`;

  const isExceptionCommittee = EXCEPTION_COMMITTEES.includes(form.committee);
  const currentMatrix = MATRIX_DATA[form.committee] || [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="access-dialog"
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
                { s: 2, label: "02 PORTFOLIO" },
                { s: 3, label: "03 PACKAGE" },
                { s: 4, label: "04 PAYMENT" },
                { s: 5, label: "05 STATUS" },
              ].map((item) => {
                const isActive = step === item.s;
                const isPassed = step > item.s;
                // If it's an exception committee, skip Step 2 entirely in the visual flow.
                if (item.s === 2 && EXCEPTION_COMMITTEES.includes(form.committee)) {
                  return null;
                }

                return (
                  <div key={item.s} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center gap-1.5 mx-auto">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] border transition-all duration-300 ${
                          isActive
                            ? "border-[var(--atlas-gold)] bg-[var(--atlas-gold)]/10 text-[var(--atlas-gold)] shadow-[0_0_8px_rgba(201,164,76,0.3)]"
                            : isPassed
                            ? "border-[var(--atlas-cyan)] bg-[var(--atlas-cyan)]/10 text-[var(--atlas-cyan)]"
                            : "border-white/10 text-white/30"
                        }`}
                      >
                        {isPassed ? "✓" : item.s}
                      </div>
                      <span
                        className={`font-mono text-[8px] sm:text-[9px] tracking-widest hidden sm:block transition-colors ${
                          isPassed || isActive ? "text-white/80" : "text-white/30"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {item.s !== 5 && (
                      <div
                        className={`h-[1px] flex-1 mx-2 transition-colors duration-300 ${
                          isPassed ? "bg-[var(--atlas-cyan)]/30" : "bg-white/5"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div>
                      <h3 className="font-display text-white text-2xl sm:text-3xl leading-none">
                        DELEGATE DOSSIER
                      </h3>
                      <p className="text-white/60 text-xs sm:text-sm mt-1">
                        Input your secure credentials. This data will be used to mint your Holographic Passport.
                      </p>
                    </div>

                    <form onSubmit={handleNextStep} className="mt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field
                          label="LEGAL FULL NAME *"
                          required
                          value={form.full_name}
                          onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
                        />
                        <Field
                          label="CALLSIGN / NICKNAME"
                          value={form.nickname}
                          onChange={(v) => setForm((f) => ({ ...f, nickname: v }))}
                        />
                        <Field
                          label="SECURE EMAIL *"
                          type="email"
                          required
                          value={form.email}
                          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                        />
                        <Field
                          label="COMMS (PHONE) *"
                          type="tel"
                          required
                          value={form.phone_number}
                          onChange={(v) => setForm((f) => ({ ...f, phone_number: v }))}
                        />
                        <Field
                          label="CITY OF OPERATIONS *"
                          required
                          value={form.city_of_residence}
                          onChange={(v) => setForm((f) => ({ ...f, city_of_residence: v }))}
                        />

                        <div className="sm:col-span-2">
                          <label className="classified-label text-[var(--atlas-cyan)] text-[10px]">
                            TARGET COMMITTEE *
                          </label>
                          <select
                            value={form.committee}
                            onChange={(e) => setForm({ ...form, committee: e.target.value, portfolio_country: "" })}
                            className="w-full mt-1 bg-black/40 border border-[var(--atlas-cyan)]/30 focus:border-[var(--atlas-cyan)] outline-none py-3 px-3 text-white text-xs transition-colors rounded shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                          >
                            {COMMITTEES.map((c) => (
                              <option key={c} value={c} className="bg-[var(--atlas-black)]">
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        {COMMITTEE_RULES[form.committee]?.type === "grade" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="sm:col-span-2"
                          >
                            <label className="classified-label text-[var(--atlas-cyan)] text-[10px]">
                              CURRENT STANDARD / GRADE *
                            </label>
                            <select
                              required
                              value={form.grade}
                              onChange={(e) => setForm({ ...form, grade: e.target.value })}
                              className="w-full mt-1 bg-black/40 border border-[var(--atlas-cyan)]/30 focus:border-[var(--atlas-cyan)] outline-none py-3 px-3 text-white text-xs transition-colors rounded shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                            >
                              <option value="" disabled className="bg-[var(--atlas-black)]">Select your standard</option>
                              {["Below 6th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "College/University"].map((g) => (
                                <option key={g} value={g} className="bg-[var(--atlas-black)]">{g}</option>
                              ))}
                            </select>
                          </motion.div>
                        )}

                        {COMMITTEE_RULES[form.committee]?.type === "experience" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="sm:col-span-2"
                          >
                            <label className="classified-label text-[var(--atlas-cyan)] text-[10px]">
                              NUMBER OF PAST MUNS ATTENDED *
                            </label>
                            <select
                              required
                              value={form.experience_count}
                              onChange={(e) => setForm({ ...form, experience_count: e.target.value })}
                              className="w-full mt-1 bg-black/40 border border-[var(--atlas-cyan)]/30 focus:border-[var(--atlas-cyan)] outline-none py-3 px-3 text-white text-xs transition-colors rounded shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                            >
                              <option value="" disabled className="bg-[var(--atlas-black)]">Select past MUN count</option>
                              {["0", "1", "2", "3", "4", "5", "6+"].map((ex) => (
                                <option key={ex} value={ex} className="bg-[var(--atlas-black)]">{ex} MUNs</option>
                              ))}
                            </select>
                          </motion.div>
                        )}

                        <Field
                          label="DATE OF BIRTH (MUST BE 14+) *"
                          type="date"
                          required
                          value={form.date_of_birth}
                          onChange={(v) => setForm((f) => ({ ...f, date_of_birth: v }))}
                        />

                        <div className="sm:col-span-1">
                          <label className="classified-label text-[var(--atlas-cyan)] text-[10px] mb-1 block">
                            UPLOAD ID PROOF (Govt / School ID) *
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            required={!form.id_proof_base64}
                            onChange={handleIdUpload}
                            className="w-full mt-1 bg-black/40 border border-[var(--atlas-cyan)]/30 focus:border-[var(--atlas-cyan)] outline-none py-2 px-3 text-white text-[10px] transition-colors rounded shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:bg-[var(--atlas-cyan)]/20 file:text-[var(--atlas-cyan)] hover:file:bg-[var(--atlas-cyan)]/30 cursor-pointer"
                          />
                          {form.id_proof_base64 && <span className="text-[10px] text-green-400 mt-1 block">✓ ID Uploaded</span>}
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

                      <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-6 flex-col sm:flex-row gap-4">
                        <p className="font-mono text-[9px] tracking-widest text-white/40 w-full sm:w-auto text-center sm:text-left">
                          * MANDATORY FIELD DOSSIERS
                        </p>
                        <button type="submit" className="btn-atlas w-full sm:w-auto justify-center">
                          NEXT STEP <span>↗</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {step === 2 && !isExceptionCommittee && (
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
                        ← BACK TO DOSSIER
                      </button>
                      <h3 className="font-display text-white text-2xl sm:text-3xl leading-none mt-3">
                        PORTFOLIO MATRIX
                      </h3>
                      <p className="text-white/60 text-xs sm:text-sm mt-1">
                        Select your preferred available country. Allotted countries cannot be chosen.
                      </p>
                    </div>

                    <div className="glass rounded border border-white/5 p-5">
                      <span className="classified-label text-[var(--atlas-cyan)] text-xs block mb-4">
                        / SELECT COUNTRY PORTFOLIO ({form.committee.split('(')[0].trim()})
                      </span>
                      
                      <div className="flex items-center gap-4 mb-4 text-[9px] font-mono tracking-widest border-b border-white/5 pb-3">
                        <span className="flex items-center gap-1.5 text-white/80"><span className="w-2.5 h-2.5 bg-white border border-white/20 rounded-sm"></span> OPEN</span>
                        <span className="flex items-center gap-1.5 text-red-400"><span className="w-2.5 h-2.5 bg-red-500/80 border border-red-500/20 rounded-sm"></span> OCCUPIED</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                        {currentMatrix.map((item) => {
                          const isOpen = item.status.toLowerCase() === "open";
                          const isOccupied = occupiedMap[item.country] || item.status.toLowerCase() === "occupied" || item.status.toLowerCase() === "alloted" || item.status.toLowerCase() === "reserved";
                          const isSelected = form.portfolio_country === item.country;

                          let bgClass = "bg-white text-black hover:bg-white/90";
                          if (isOccupied) bgClass = "bg-red-500/20 text-red-200 border-red-500/20 opacity-50 cursor-not-allowed";
                          if (isSelected) bgClass = "bg-[var(--atlas-gold)] text-black border-[var(--atlas-gold)] shadow-[0_0_15px_rgba(201,164,76,0.5)]";

                          return (
                            <button
                              key={item.country}
                              type="button"
                              disabled={!isOpen}
                              onClick={() => setForm({ ...form, portfolio_country: item.country })}
                              className={`text-[10px] sm:text-xs font-mono py-2.5 px-3 rounded border border-transparent transition-all truncate text-left ${bgClass}`}
                              title={item.country}
                            >
                              {item.country}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-6 flex-col sm:flex-row gap-4">
                      <button onClick={() => setStep(1)} className="btn-ghost px-4 py-2 text-[10px] w-full sm:w-auto justify-center">
                        ← BACK
                      </button>
                      <button type="button" onClick={handleProceedToPackage} className="btn-atlas w-full sm:w-auto justify-center">
                        NEXT STEP <span>↗</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <button
                        onClick={() => {
                          if (isExceptionCommittee) setStep(1);
                          else setStep(2);
                        }}
                        className="font-mono text-[10px] text-[var(--atlas-cyan)] hover:underline"
                      >
                        ← BACK
                      </button>
                      <h3 className="font-display text-white text-2xl sm:text-3xl leading-none mt-3">
                        ENTRY PASS PACKAGE
                      </h3>
                      <p className="text-white/60 text-xs sm:text-sm mt-1">
                        Select your pricing category and apply any discount/referral codes.
                      </p>
                    </div>

                    <div className="glass rounded border border-white/5 p-5">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <span className="classified-label text-[var(--atlas-gold)] text-xs">
                          SELECT ENTRY PASS PACKAGE
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded border border-emerald-400/20 animate-pulse tracking-widest font-bold">
                          TIME LEFT: {timeLeft}
                        </span>
                      </div>

                      {/* Custom Category Dropdown */}
                      <div className="relative mt-3 mb-2">
                        <button
                          type="button"
                          onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                          onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 200)}
                          className="w-full bg-black/40 border border-white/15 focus:border-[var(--atlas-gold)] rounded py-3 px-4 flex justify-between items-center transition-colors text-white font-mono text-xs tracking-wider"
                        >
                          <span>{selectedCategory}</span>
                          <span className="text-[10px] opacity-50">▼</span>
                        </button>
                        
                        <AnimatePresence>
                          {categoryDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute top-full left-0 w-full mt-1.5 bg-[#0a0510] border border-[var(--atlas-gold)]/30 rounded-md overflow-hidden z-50 shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
                            >
                              {Object.keys(PACKAGES).map((category) => (
                                <button
                                  key={category}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(category);
                                    setSelectedPkgIndex(0);
                                    setCategoryDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 font-mono text-xs tracking-wider transition-colors ${
                                    selectedCategory === category
                                      ? "bg-[var(--atlas-gold)]/10 text-[var(--atlas-gold)] border-l-2 border-[var(--atlas-gold)]"
                                      : "text-white/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                                  }`}
                                >
                                  {category}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Packages Grid */}
                      <div className="grid grid-cols-1 gap-3 mt-3">
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
                            <div className="flex flex-col gap-1">
                              <span
                                className={`font-mono text-[9px] tracking-widest ${
                                  selectedPkgIndex === idx
                                    ? "text-[var(--atlas-gold)]"
                                    : "text-white/55"
                                }`}
                              >
                                CATEGORY LEVEL
                              </span>
                              <span className="font-display text-white text-base flex items-center gap-2">
                                {pkg.name}
                                {appliedDiscountText && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-mono tracking-widest border border-emerald-400/20">{appliedDiscountText}</span>}
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              {appliedDiscountText && (
                                <span className="font-mono text-white/40 text-[10px] tracking-wider line-through">
                                  ₹{pkg.price}
                                </span>
                              )}
                              <span className="font-mono text-white text-lg tracking-wider font-semibold">
                                ₹{finalPrice}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Referral Code Field */}
                      <div className="mt-5 bg-white/[0.02] p-3 rounded border border-white/5">
                        <label className="classified-label text-white/50 text-[10px] mb-1 block">
                          REFERRAL / DISCOUNT CODE (OPTIONAL)
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Code..."
                          value={form.referralCode}
                          onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                          className="w-full bg-transparent border-b border-white/15 focus:border-[var(--atlas-gold)] outline-none py-2 text-white text-xs font-mono transition-all placeholder:text-white/20"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-6 flex-col sm:flex-row gap-4">
                      <button onClick={() => {
                          if (isExceptionCommittee) setStep(1);
                          else setStep(2);
                        }} className="btn-ghost px-4 py-2 text-[10px] w-full sm:w-auto justify-center">
                        ← BACK
                      </button>
                      <button type="button" onClick={handleProceedToPay} className="btn-atlas w-full sm:w-auto justify-center">
                        PROCEED TO PAY <span>↗</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3.5 && (
                  <motion.div
                    key="step-3-5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-3">
                      <div className="inline-block px-3 py-1 bg-[var(--atlas-gold)]/10 border border-[var(--atlas-gold)]/30 rounded-full">
                        <span className="font-mono text-[10px] text-[var(--atlas-gold)] tracking-[0.3em]">VIP UPGRADE INVITATION</span>
                      </div>
                      <h3 className="font-display text-white text-3xl sm:text-4xl leading-none">
                        ATLAS <span className="text-[var(--atlas-gold)] font-bold italic">PLUS</span>
                      </h3>
                      <p className="text-white/70 text-sm max-w-sm mx-auto">
                        Your gateway to the ultimate Atlas experience. Not just a conference—an ecosystem.
                      </p>
                    </div>

                    <div className="glass-strong rounded-xl border border-[var(--atlas-gold)]/30 p-1 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--atlas-gold)]/5 to-transparent pointer-events-none" />
                      <div className="bg-black/60 rounded-lg p-5 border border-white/5 relative z-10">
                        <div className="space-y-4 font-mono text-xs text-white/80">
                          <div className="flex items-start gap-3">
                            <span className="text-[var(--atlas-gold)] mt-0.5">✓</span>
                            <span><strong className="text-[var(--atlas-gold)]">Premium Passport</strong> with exclusive Black & Gold holographic flex.</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-[var(--atlas-gold)] mt-0.5">✓</span>
                            <span><strong className="text-white">Delegate Lounge & Meals.</strong> Unwind with VIP hospitality.</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-[var(--atlas-gold)] mt-0.5">✓</span>
                            <span><strong className="text-white">Priority Check-in.</strong> Skip the lines. Fast-track entry.</span>
                          </div>
                        </div>
                        
                        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[10px] text-white/50 tracking-widest uppercase">Limited Availability</span>
                          <span className="text-xl font-bold text-[var(--atlas-gold)]">+₹2000</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => {
                          setForm({ ...form, is_atlas_plus: true });
                          setStep(4);
                        }}
                        className="w-full relative group overflow-hidden rounded py-4 px-6 transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#947126] via-[#C9A44C] to-[#947126] opacity-90 group-hover:opacity-100" />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
                        <span className="relative z-10 font-mono text-sm tracking-[0.2em] font-bold text-black drop-shadow-md flex items-center justify-center gap-2">
                          YES, UPGRADE TO ATLAS PLUS <span>⚡</span>
                        </span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setForm({ ...form, is_atlas_plus: false });
                          setStep(4);
                        }}
                        className="w-full py-3 text-[10px] font-mono tracking-widest text-white/40 hover:text-white/80 transition-colors"
                      >
                        NO THANKS, I'LL KEEP THE STANDARD PASS
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <button
                        onClick={() => setStep(3)}
                        className="font-mono text-[10px] text-[var(--atlas-cyan)] hover:underline"
                      >
                        ← BACK TO PACKAGE
                      </button>
                      <h3 className={`font-display text-2xl sm:text-3xl leading-none mt-3 ${form.is_atlas_plus ? 'text-[var(--atlas-gold)]' : 'text-white'}`}>
                        {form.is_atlas_plus ? 'ATLAS PLUS ELITE GATEWAY' : 'ATLAS PAY SECURE GATEWAY'}
                      </h3>
                      <p className="text-white/60 text-xs sm:text-sm mt-1">
                        Scan the dynamically encoded UPI QR code below to complete the {form.is_atlas_plus ? 'premium ' : ''}transaction.
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
                        {!isExceptionCommittee && form.portfolio_country && (
                          <div className="flex justify-between">
                            <span className="text-white/55">PORTFOLIO</span>
                            <span className="text-white max-w-[200px] truncate text-right">
                              {form.portfolio_country}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-white/55">SELECTED TICKET</span>
                          <span className="text-[var(--atlas-gold)]">
                            {selectedCategory} · {selectedPackage.name}
                          </span>
                        </div>
                        {form.is_atlas_plus && (
                          <div className="flex justify-between mt-1">
                            <span className="text-white/55">ADD-ON</span>
                            <span className="text-[var(--atlas-gold)] font-bold">
                              ATLAS PLUS (+₹2000)
                            </span>
                          </div>
                        )}
                        <div className="h-[1px] bg-white/10 my-3" />
                        <div className="flex justify-between text-sm">
                          <span className="text-white font-medium">TOTAL DUE</span>
                          <span className="text-[var(--atlas-cyan)] font-bold text-base">
                            ₹{payPrice}.00
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
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=08000F&color=C9A44C&data=${encodeURIComponent(`upi://pay?pa=9140738627@axl&pn=Atlas&am=${payPrice}&cu=INR`)}`}
                          alt="Golden UPI QR Code"
                          className="w-[180px] h-[180px] object-contain rounded-sm shadow-[0_0_15px_rgba(201,164,76,0.3)]"
                        />
                        <span className="font-mono text-[9px] tracking-widest text-[var(--atlas-gold)]/60 mt-3">
                          ATLAS SECURE QR
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

                {step === 5 && registrationResult && (
                  <motion.div
                    key="step-5"
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
