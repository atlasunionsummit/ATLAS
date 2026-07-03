import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDelegates, getRegistrations } from "@/lib/atlasApi";
import { MATRIX_DATA } from "@/lib/matrixData";
import { toast } from "sonner";

export default function PortfolioMatrixViewer({ open, onClose }) {
  const [occupiedMap, setOccupiedMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([getDelegates(), getRegistrations()])
        .then(([delegates, registrations]) => {
          const occ = {};
          
          // Count from approved delegates and stubs
          delegates.forEach(d => {
            const port = d.portfolio || d.portfolio_country;
            if (port) {
              occ[port] = (occ[port] || 0) + 1;
            }
          });
          
          // Count from pending registrations
          const pendingRegs = registrations.filter(r => r.status === "pending_verification");
          pendingRegs.forEach(r => {
            const port = r.portfolio_country || r.portfolio || r.portfolio_1;
            if (port) {
              occ[port] = (occ[port] || 0) + 1;
            }
          });

          setOccupiedMap(occ);
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to load live matrix data.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full max-w-[800px] max-h-[90vh] overflow-y-auto glass-strong rounded-md p-6 sm:p-8 scrollbar-thin border border-[var(--atlas-cyan)]/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="classified-label text-[var(--atlas-cyan)] text-xs sm:text-sm">
                  / LIVE MATRIX VIEWER
                </span>
              </div>
              <button
                onClick={onClose}
                className="font-mono text-xs text-white/60 hover:text-white transition-colors"
              >
                CLOSE ✕
              </button>
            </div>

            <div>
              <h3 className="font-display text-white text-2xl sm:text-3xl leading-none">
                PORTFOLIO MATRIX AVAILABILITY
              </h3>
              <p className="text-white/60 text-xs sm:text-sm mt-1">
                Real-time view of occupied and open portfolios across all committees.
              </p>
            </div>

            <div className="flex items-center gap-4 mt-6 mb-4 text-[9px] font-mono tracking-widest border border-white/5 bg-black/20 px-4 py-2 rounded max-w-fit">
              <span className="flex items-center gap-1.5 text-white/80"><span className="w-2.5 h-2.5 bg-white border border-white/20 rounded-sm"></span> OPEN</span>
              <span className="flex items-center gap-1.5 text-red-400"><span className="w-2.5 h-2.5 bg-red-500/80 border border-red-500/20 rounded-sm"></span> OCCUPIED</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-white/10 border-t-[var(--atlas-cyan)] rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-8 mt-6">
                {Object.entries(MATRIX_DATA).map(([committee, countries]) => {
                  let maxAllowed = 1;
                  if (committee.includes("IPL")) maxAllowed = 3;
                  else if (committee.includes("UNSC")) maxAllowed = 2;

                  return (
                    <div key={committee} className="glass rounded border border-white/5 p-4 flex flex-col">
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pr-1">
                        {countries.map(item => {
                          const currentCount = occupiedMap[item.country] || 0;
                          const isOccupied = currentCount >= maxAllowed || item.status.toLowerCase() === "occupied" || item.status.toLowerCase() === "alloted" || item.status.toLowerCase() === "reserved";
                          
                          let bgClass = "bg-white/5 hover:bg-white/10 text-white/80";
                          if (isOccupied) bgClass = "bg-red-500/20 text-red-200 border-red-500/20 opacity-70 cursor-not-allowed";
                          
                          return (
                            <div
                              key={item.country}
                              className={`text-[9px] sm:text-[10px] font-mono py-2 px-2 rounded border border-transparent whitespace-normal break-words text-left flex flex-col justify-center min-h-[44px] ${bgClass}`}
                              title={item.country}
                            >
                              <span className="truncate w-full">{item.country}</span>
                              {maxAllowed > 1 && currentCount > 0 && (
                                <span className="block mt-0.5 text-[8.5px] opacity-75 font-semibold truncate w-full">
                                  {currentCount} OUT OF {maxAllowed}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
              <button onClick={onClose} className="px-6 py-2 border border-white/20 rounded text-white/70 hover:bg-white/10 text-xs font-mono tracking-widest transition-colors">
                CLOSE VIEWER
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
