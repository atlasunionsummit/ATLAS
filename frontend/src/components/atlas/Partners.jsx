import { motion } from "framer-motion";

const PARTNERS = [
  {
    category: "IIT Delhi and D.U Ecosystem",
    items: [
      { name: "IIT Delhi", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781190327/download_9_pwd5y9.png" },
      { name: "Hindu College", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781366106/download_6_nr6knj.jpg" }
    ]
  },
  {
    category: "Educational Partner",
    items: [
      { name: "Oxford International", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189436/oi-logo_qqmqt4.png" }
    ]
  },
  {
    category: "Academic & Institutional Collaborations",
    items: [
      { name: "Rendezvous, IIT Delhi", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781190246/iit_delhi_i02q1b.png" },
      { name: "DebSoc IIT Delhi", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781279328/download_10_bv5xns.png" },
      { name: "Robotics Club, IIT Delhi", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781279399/download_11_vbpmnv.png" }
    ]
  },
  {
    category: "Strategic & Ecosystem Partners",
    items: [
      { name: "AUVREO International", desc: "(MSME Registered)", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781191277/Screenshot_2026-06-11_204215_rtfbj9.png" },
      { name: "Auvresence", desc: "Official Technology Partner", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781191361/653980240_17935731552191292_2345474767558320038_n_vkhwb7.jpg" },
      { name: "Writistic Studios", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781278858/541925934_18042953570662296_4174604590993081332_n_uwcxzx.jpg" }
    ]
  },
  {
    category: "International Academic Outreach",
    items: [
      { name: "University of Oxford", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781278693/Screenshot_2026-06-12_205531_opyeq3.png" },
      { name: "Tomsk State University", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189412/download_1_cvneph.jpg" },
      { name: "Far Eastern Federal University", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189380/download_2_b7ou7n.jpg" },
      { name: "Novosibirsk State University", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189373/download_3_lfgbqe.jpg" },
      { name: "University of Sydney", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189358/download_4_qjdwlu.jpg" },
      { name: "University of Newcastle", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189343/download_4_kejgou.png" },
      { name: "Massey University", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189332/download_5_p5ks9a.png" },
      { name: "Lincoln University", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189320/download_6_rrgwrp.png" },
      { name: "Auckland University of Technology", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189302/download_5_dlwndp.jpg" },
      { name: "National Central University", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189283/download_7_rtyaut.png" },
      { name: "National Dong Hwa University", logo: "https://res.cloudinary.com/dgdgulrae/image/upload/q_auto/f_auto/v1781189278/download_8_unifh2.png" }
    ]
  }
];

export default function Partners() {
  return (
    <section
      id="partners"
      className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-10 max-w-[1240px] mx-auto"
    >
      <div className="glass-strong rounded-md p-5 sm:p-8 lg:p-16 relative overflow-hidden">
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
            className="font-display mt-3 text-[#FFE6E6]"
            style={{ fontSize: "clamp(48px, 6vw, 84px)", lineHeight: 0.9 }}
          >
            HEARTBEAT OF OUR <br />
            <span className="outlined">ECOSYSTEM.</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {section.items.map((partner, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-strong rounded-xl border border-white/10 p-5 sm:p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)] hover:border-[var(--atlas-gold)]/40 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--atlas-gold)]/0 to-[var(--atlas-gold)]/0 group-hover:from-[var(--atlas-gold)]/5 group-hover:to-transparent transition-all duration-500" />
                    
                    <div className="w-20 h-20 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-lg overflow-hidden bg-white/90 shadow-inner flex items-center justify-center mb-5 shrink-0 transform transition-transform duration-300 group-hover:scale-105 border border-white/20">
                      <img 
                        src={partner.logo} 
                        alt={partner.name} 
                        className="w-full h-full object-contain p-2 md:p-3 drop-shadow-sm"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=140b1e&color=fff`;
                        }}
                      />
                    </div>
                    <h4 className="font-display tracking-widest text-xs md:text-[13px] text-white uppercase drop-shadow-sm relative z-10 group-hover:text-[var(--atlas-gold)] transition-colors">
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
