import { motion } from "framer-motion";

const PARTNERS = [
  {
    category: "Grand Sponsors",
    items: [
      { name: "IIT Delhi", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Indian_Institute_of_Technology_Delhi_Logo.svg/1200px-Indian_Institute_of_Technology_Delhi_Logo.svg.png" },
      { name: "Oxford International", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Oxford-University-Circlet.svg/1200px-Oxford-University-Circlet.svg.png" }
    ]
  },
  {
    category: "Academic & Institutional Collaborations",
    items: [
      { name: "Rendezvous, IIT Delhi", logo: "https://ui-avatars.com/api/?name=R&background=C9A44C&color=fff" },
      { name: "DebSoc IIT Delhi", logo: "https://ui-avatars.com/api/?name=DS&background=C9A44C&color=fff" },
      { name: "Robotics Club, IIT Delhi", logo: "https://ui-avatars.com/api/?name=RC&background=C9A44C&color=fff" }
    ]
  },
  {
    category: "Strategic & Ecosystem Partners",
    items: [
      { name: "AUVREO International", desc: "(MSME Registered)", logo: "https://ui-avatars.com/api/?name=AU&background=1EDCF0&color=fff" },
      { name: "Auvresence", desc: "Official Technology Partner", logo: "https://ui-avatars.com/api/?name=A&background=1EDCF0&color=fff" },
      { name: "Writistic Studios", logo: "https://ui-avatars.com/api/?name=WS&background=1EDCF0&color=fff" }
    ]
  },
  {
    category: "International Academic Outreach",
    items: [
      { name: "University of Oxford", logo: "https://logo.clearbit.com/ox.ac.uk" },
      { name: "Tomsk State University", logo: "https://logo.clearbit.com/tsu.ru" },
      { name: "Far Eastern Federal University", logo: "https://logo.clearbit.com/dvfu.ru" },
      { name: "Novosibirsk State University", logo: "https://logo.clearbit.com/nsu.ru" },
      { name: "University of Sydney", logo: "https://logo.clearbit.com/sydney.edu.au" },
      { name: "University of Newcastle", logo: "https://logo.clearbit.com/newcastle.edu.au" },
      { name: "Massey University", logo: "https://logo.clearbit.com/massey.ac.nz" },
      { name: "Lincoln University", logo: "https://logo.clearbit.com/lincoln.ac.nz" },
      { name: "Auckland University of Technology", logo: "https://logo.clearbit.com/aut.ac.nz" },
      { name: "National Central University", logo: "https://logo.clearbit.com/ncu.edu.tw" },
      { name: "National Dong Hwa University", logo: "https://logo.clearbit.com/ndhu.edu.tw" }
    ]
  }
];

export default function Partners() {
  return (
    <section
      id="partners"
      className="relative py-24 lg:py-32 px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="glass-strong rounded-md p-8 lg:p-16 relative overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-[60vmax] h-[60vmax] rounded-full pointer-events-none opacity-50"
          style={{
            background:
              "radial-gradient(circle, rgba(91,27,255,0.25), transparent 60%)",
            filter: "blur(60px)",
          }}
        />
        
        <div className="text-center mb-16 relative z-10">
          <span className="classified-label text-[var(--atlas-gold)]">
            / 07 — PARTNERS & COLLABORATIONS
          </span>
          <h2
            className="font-display mt-3 text-white"
            style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.95 }}
          >
            A GROWING <span className="outlined">ECOSYSTEM.</span>
          </h2>
          <p className="text-white/75 leading-[1.8] text-sm md:text-[15px] max-w-2xl mx-auto mt-6">
            Atlas Union Summit is proud to work alongside institutions, organizations, and communities that share our vision of building a world-class youth ecosystem.
          </p>
        </div>

        <div className="space-y-16 relative z-10">
          {PARTNERS.map((section, idx) => (
            <div key={idx}>
              <div className="border-b border-white/10 pb-4 mb-8">
                <h3 className="font-display text-white text-xl md:text-2xl tracking-wider text-center lg:text-left">
                  {section.category}
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {section.items.map((partner, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded border border-white/5 p-4 flex flex-col items-center text-center hover:border-[var(--atlas-cyan)]/30 transition-colors"
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded overflow-hidden bg-white flex items-center justify-center mb-4 shrink-0">
                      <img 
                        src={partner.logo} 
                        alt={partner.name} 
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          e.target.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(partner.name)}&background=140b1e&color=fff\`;
                        }}
                      />
                    </div>
                    <h4 className="font-mono text-[10px] md:text-xs text-white uppercase tracking-wider">
                      {partner.name}
                    </h4>
                    {partner.desc && (
                      <p className="text-[var(--atlas-cyan)] font-mono text-[9px] mt-1 tracking-widest">{partner.desc}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center border-t border-white/5 pt-8">
          <p className="font-mono text-[10px] tracking-[0.24em] text-white/40">
            ◇ MORE PARTNERSHIPS AND COLLABORATIONS WILL BE ANNOUNCED SOON · STAY CONNECTED
          </p>
        </div>
      </div>
    </section>
  );
}
