import { ATLAS_LOGO_CLEAN } from "@/lib/atlasAssets";

export default function Footer() {
  return (
    <footer className="relative py-20 px-6 lg:px-10 mt-10 mb-8">
      <div className="max-w-[1240px] mx-auto">
        <div className="gold-rule mb-12" />
        <div className="grid lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-3">
              <img src={ATLAS_LOGO_CLEAN} alt="atlas" className="h-9" />
              <span className="font-display text-white text-2xl tracking-[0.18em]">
                ATLAS
              </span>
            </div>
            <p className="text-white/60 mt-5 max-w-[420px] leading-[1.8]">
              Atlas Union Summit 2026. A cinematic diplomacy universe.
              Engineered by AUVREO International — registered under the
              Government of India&apos;s MSME Framework.
            </p>

          </div>
          {[
            {
              title: "CIRCUIT",
              items: [
                { label: "Ecosystem", id: "ecosystem" },
                { label: "Committees", id: "committees" },
                { label: "Operations", id: "operation-red" },
                { label: "Passport", id: "passport" },
              ],
            },
            {
              title: "ARCHIVES",
              items: [
                { label: "FAQ", id: "faq" },
                { label: "Partners", id: "partners" },
                { label: "Press", id: "press" },
                { label: "Terms & Conditions", id: "terms" },
              ],
            }
          ].map((col) => (
            <div key={col.title}>
              <p className="classified-label text-[var(--atlas-gold)]">{col.title}</p>
              <ul className="mt-4 space-y-2">
                {col.items.map((i) => (
                  <li
                    key={i.label}
                    onClick={() => {
                      if (i.id === "press") {
                        return alert("Press Kit & Media Archives will be available soon.");
                      }
                      document.getElementById(i.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="font-mono text-[12px] tracking-[0.18em] text-white/65 hover:text-white transition-colors cursor-pointer"
                  >
                    ↗ {i.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 gold-rule" />
        <div className="mt-6 flex flex-wrap justify-between gap-3 font-mono text-[10px] tracking-[0.28em] text-white/50">
          <span>© ATLAS UNION SUMMIT · 2026</span>
          <span className="text-[var(--atlas-gold)]">विश्वम् एक मंचम्</span>
          <span>WHERE DIPLOMACY MEETS INNOVATION</span>
        </div>
      </div>
    </footer>
  );
}
