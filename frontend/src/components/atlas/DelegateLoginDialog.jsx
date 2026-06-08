import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getDelegates, getRegistrations, signInWithGoogle, signOutUser } from "@/lib/atlasApi";

export default function DelegateLoginDialog({ open, onClose, onLoginSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      const email = user.email.toLowerCase();

      // Check if it's the Admin
      if (email === "atlasunionsummit@gmail.com") {
        const adminUser = {
          email: "atlasunionsummit@gmail.com",
          role: "admin",
          full_name: "Admin Commander",
          nickname: "Commander"
        };
        localStorage.setItem("aus_admin_user", JSON.stringify(adminUser));
        localStorage.setItem("aus_delegate_session", JSON.stringify(adminUser));
        onLoginSuccess(adminUser);
        onClose();
        return;
      }

      // Check approved delegates
      const delegates = await getDelegates();
      const match = delegates.find(
        (d) => d.email.toLowerCase() === email
      );

      if (match) {
        const delegateUser = {
          ...match,
          role: "delegate"
        };
        localStorage.setItem("aus_delegate_session", JSON.stringify(delegateUser));
        onLoginSuccess(delegateUser);
        onClose();
      } else {
        // Check registrations
        const registrations = await getRegistrations();
        const regMatch = registrations.find(
          (r) => r.email.toLowerCase() === email
        );

        if (regMatch) {
          if (regMatch.status === "pending_verification") {
            const pendingUser = {
              email: email,
              role: "pending",
              full_name: regMatch.full_name,
              committee: regMatch.committee,
              id: regMatch.registration_id || "PENDING"
            };
            localStorage.setItem("aus_delegate_session", JSON.stringify(pendingUser));
            onLoginSuccess(pendingUser);
            onClose();
          } else {
            await signOutUser();
            toast.error("DOSSIER DECLINED", {
              description: "Your registration dossier was declined. Contact admin support.",
            });
          }
        } else {
          // Unrecognized Google account -> guest
          const guestUser = {
            email: email,
            role: "guest",
            full_name: user.displayName || "GUEST OPERATOR",
            id: "GUEST-" + Math.floor(Math.random() * 10000)
          };
          localStorage.setItem("aus_delegate_session", JSON.stringify(guestUser));
          onLoginSuccess(guestUser);
          onClose();
        }
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
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[160] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 15, opacity: 0, scale: 0.98 }}
            className="relative w-full max-w-[400px] glass-strong rounded-md p-8 border border-white/5"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--atlas-cyan)] to-transparent" />
            
            <div className="flex justify-between items-center">
              <span className="classified-label text-[var(--atlas-cyan)] text-xs">
                / OPERATOR IDENTITY PORTAL
              </span>
              <button
                onClick={onClose}
                className="font-mono text-xs text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <h3 className="font-display text-white text-2xl mt-4">SECURE SIGN IN</h3>
            <p className="text-white/50 text-[10.5px] mt-1 mb-6">
              Google Account Identity Authorization Required.<br />
              Connect to authenticate your role (Admin or Delegate).
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="btn-atlas w-full text-center flex items-center justify-center py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border border-t-[var(--atlas-cyan)] border-white/20 animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : (
                "SIGN IN WITH GOOGLE ↗"
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
