import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function VerifyPayment() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // verifying, success, failed
  const [errorMsg, setErrorMsg] = useState("");
  const [delegateData, setDelegateData] = useState(null);
  const verifyLock = useRef(false);
  const verifyCompleted = useRef(false); // Track completion to avoid stale closure in timeout

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      setErrorMsg("Missing Order ID");
      return;
    }

    const payloadStr = localStorage.getItem("pending_delegate_payload");
    const couponCode = localStorage.getItem("pending_coupon_code");

    if (!payloadStr) {
      setStatus("failed");
      setErrorMsg("Delegate payload not found in browser. Please contact support if your money was deducted.");
      return;
    }

    let payload;
    try {
      payload = JSON.parse(payloadStr);
      setDelegateData(payload);
    } catch (e) {
      setStatus("failed");
      setErrorMsg("Corrupted payload data");
      return;
    }

    // Call verify endpoint
    if (verifyLock.current) return;
    verifyLock.current = true;

    // Timeout fallback — uses a ref to check completion instead of stale `status` state
    const timeoutId = setTimeout(() => {
      if (!verifyCompleted.current) {
        setStatus("failed");
        setErrorMsg("Server verification timed out. If your money was deducted, please contact support.");
      }
    }, 30000); // 30 seconds to account for Cashfree API + Firestore transaction latency

    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            delegate_payload: payload,
            coupon_code: couponCode || null,
          }),
        });

        const data = await res.json();
        verifyCompleted.current = true; // Mark as completed BEFORE setting state

        if (res.ok) {
          setStatus("success");
          localStorage.removeItem("pending_delegate_payload");
          localStorage.removeItem("pending_coupon_code");
          // Optionally auto-login the user here or set the session
          const userSession = {
            id: payload.registration_id || `AUS-DEL-${Date.now()}`,
            full_name: payload.full_name,
            email: payload.email,
            committee: payload.committee,
            role: "delegate"
          };
          localStorage.setItem("aus_delegate_session", JSON.stringify(userSession));
          toast.success("PAYMENT SUCCESSFUL", { description: "Your Dossier has been officially minted." });
          
          // --- TRIGGER SUCCESS EMAILS ---
          const emailPayload = { ...payload, registration_id: userSession.id };
          
          // 1. Welcome Email
          fetch("/api/email/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email_type: "WELCOME", delegate_payload: emailPayload })
          }).catch(console.error);
          
          // 2. Payment Completed Email
          fetch("/api/email/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email_type: "PAYMENT_SUCCESS", delegate_payload: emailPayload })
          }).catch(console.error);
          
          // 3. Atlas Plus Email (if applicable)
          if (payload.is_atlas_plus || payload.package_name?.includes("ATLAS PLUS")) {
            fetch("/api/email/dispatch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email_type: "ATLAS_PLUS", delegate_payload: emailPayload })
            }).catch(console.error);
          }
          // ------------------------------
        } else {
          setStatus("failed");
          setErrorMsg(data.message || `Payment Failed (${data.status || 'UNKNOWN'})`);
        }
      } catch (err) {
        console.error(err);
        verifyCompleted.current = true; // Mark completed even on error
        setStatus("failed");
        setErrorMsg("Failed to communicate with payment server. Please contact support.");
      } finally {
        clearTimeout(timeoutId);
      }
    };

    verifyPayment();
  }, [orderId]);

  return (
    <div className="min-h-screen atlas-grain flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg glass-strong rounded-xl border border-[var(--atlas-cyan)]/30 p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--atlas-cyan)] to-transparent" />

        {status === "verifying" && (
          <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-t-[var(--atlas-cyan)] border-white/10 animate-spin" />
            <div>
              <h2 className="font-display text-white text-2xl tracking-widest">VERIFYING SECURE TRANSACTION</h2>
              <p className="text-[10px] text-white/50 tracking-[0.2em] mt-2 uppercase font-mono">ORDER: {orderId}</p>
              <p className="text-white/40 text-xs mt-4">Please do not close this window...</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
              <span className="text-emerald-400 text-3xl">✓</span>
            </div>
            <h2 className="font-display text-[var(--atlas-gold)] text-3xl mb-2">TRANSACTION APPROVED</h2>
            <p className="text-white/70 text-sm mb-6">
              Your payment was successful and your portfolio has been secured.
            </p>
            
            <div className="w-full bg-black/40 border border-white/10 rounded-lg p-5 font-mono text-[11px] text-left space-y-3 mb-8">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">ORDER ID</span>
                <span className="text-[var(--atlas-cyan)]">{orderId}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">DELEGATE</span>
                <span className="text-white font-bold">{delegateData?.full_name?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">COMMITTEE</span>
                <span className="text-white">{delegateData?.committee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">PACKAGE</span>
                <span className="text-[var(--atlas-gold)]">{delegateData?.package_name}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="btn-atlas w-full text-center py-4"
            >
              INITIALIZE OPERATOR DASHBOARD ↗
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
              <span className="text-red-400 text-3xl">✕</span>
            </div>
            <h2 className="font-display text-red-500 text-3xl mb-2">TRANSACTION FAILED</h2>
            <p className="text-white/70 text-sm mb-6">
              {errorMsg}
            </p>
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded text-xs text-red-200 text-left w-full mb-8 font-mono">
              If your bank account was debited, it will be automatically refunded within 5-7 business days. You can safely try again.
            </div>
            <button
              onClick={() => navigate("/")}
              className="btn-ghost w-full text-center py-4 border-red-500/30 hover:bg-red-500/10"
            >
              ← RETURN TO TERMINAL
            </button>
          </div>
        )}

      </motion.div>
    </div>
  );
}
