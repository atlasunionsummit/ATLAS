import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function VerifyUpgrade() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const [delegateData, setDelegateData] = useState(null);
  const verifyLock = useRef(false);

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      setErrorMsg("Missing Order ID");
      return;
    }

    const payloadStr = localStorage.getItem("pending_upgrade_payload");

    if (!payloadStr) {
      setStatus("failed");
      setErrorMsg("Upgrade payload not found in browser. Please contact support if your money was deducted.");
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

    if (verifyLock.current) return;
    verifyLock.current = true;

    const timeoutId = setTimeout(() => {
      if (status === "verifying") {
        setStatus("failed");
        setErrorMsg("Server verification timed out. If your money was deducted, please contact support.");
      }
    }, 15000);

    const verifyUpgrade = async () => {
      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            delegate_payload: payload,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          localStorage.removeItem("pending_upgrade_payload");
          
          // Update local session
          const sessionStr = localStorage.getItem("aus_delegate_session");
          if (sessionStr) {
            try {
              const session = JSON.parse(sessionStr);
              session.is_atlas_plus = true;
              localStorage.setItem("aus_delegate_session", JSON.stringify(session));
            } catch (e) {
              console.error("Failed to update local session", e);
            }
          }

          toast.success("UPGRADE SUCCESSFUL", { description: "Welcome to the Atlas Plus Elite Tier." });
          
          // --- TRIGGER ATLAS PLUS EMAIL ---
          const emailPayload = { ...payload, is_atlas_plus: true };
          fetch("/api/email/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email_type: "ATLAS_PLUS", delegate_payload: emailPayload })
          }).catch(console.error);
          
        } else {
          setStatus("failed");
          setErrorMsg(data.message || `Payment Failed (${data.status || 'UNKNOWN'})`);
        }
      } catch (err) {
        console.error(err);
        setStatus("failed");
        setErrorMsg("Failed to communicate with payment server. Please contact support.");
      } finally {
        clearTimeout(timeoutId);
      }
    };

    verifyUpgrade();
  }, [orderId]);

  return (
    <div className="min-h-screen atlas-grain flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg glass-strong rounded-xl border border-[var(--atlas-gold)]/50 p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--atlas-gold)] to-transparent" />

        {status === "verifying" && (
          <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-t-[var(--atlas-gold)] border-white/10 animate-spin" />
            <div>
              <h2 className="font-display text-white text-2xl tracking-widest">VERIFYING UPGRADE</h2>
              <p className="text-[10px] text-white/50 tracking-[0.2em] mt-2 uppercase font-mono">ORDER: {orderId}</p>
              <p className="text-white/40 text-xs mt-4">Please do not close this window...</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--atlas-gold)]/20 border border-[var(--atlas-gold)]/50 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(201,164,76,0.3)]">
              <span className="text-[var(--atlas-gold)] text-3xl">✨</span>
            </div>
            <h2 className="font-display text-[var(--atlas-gold)] text-3xl mb-2">ATLAS PLUS ACTIVATED</h2>
            <p className="text-white/70 text-sm mb-6">
              Your account has been upgraded to the Elite Passport tier.
            </p>
            
            <div className="w-full bg-black/40 border border-white/10 rounded-lg p-5 font-mono text-[11px] text-left space-y-3 mb-8">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">ORDER ID</span>
                <span className="text-[var(--atlas-gold)]">{orderId}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">OPERATOR</span>
                <span className="text-white font-bold">{delegateData?.full_name?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">ACCESS TIER</span>
                <span className="text-[var(--atlas-gold)] font-bold">ELITE PASSPORT</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="btn-atlas w-full text-center py-4"
            >
              RETURN TO DASHBOARD ↗
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
              <span className="text-red-400 text-3xl">✕</span>
            </div>
            <h2 className="font-display text-red-500 text-3xl mb-2">UPGRADE FAILED</h2>
            <p className="text-white/70 text-sm mb-6">
              {errorMsg}
            </p>
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded text-xs text-red-200 text-left w-full mb-8 font-mono">
              If your bank account was debited, it will be automatically refunded within 5-7 business days.
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-ghost w-full text-center py-4 border-red-500/30 hover:bg-red-500/10"
            >
              ← BACK TO DASHBOARD
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
