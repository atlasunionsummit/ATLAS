import { motion } from "framer-motion";

export default function TermsAndConditions() {
  const terms = [
    {
      title: "1. Registration",
      content: [
        "Registration is confirmed only after successful payment and approval by the Atlas Organising Committee.",
        "Atlas reserves the right to reject or cancel any registration if false or misleading information is provided."
      ]
    },
    {
      title: "2. Code of Conduct",
      content: [
        "All delegates, Executive Board members, Secretariat members and guests must maintain respectful and professional behaviour throughout the event.",
        "Harassment, discrimination, bullying, violence, damage to property or disruptive conduct may result in removal from the event without a refund."
      ]
    },
    {
      title: "3. Event Changes",
      content: [
        "Atlas reserves the right to modify schedules, committees, venues, speakers, Executive Boards, experiences or activities due to operational, logistical or unforeseen circumstances.",
        "Any such changes will be communicated to participants whenever reasonably possible."
      ]
    },
    {
      title: "4. Photography & Media",
      content: [
        "Atlas may photograph or record the event.",
        "By participating, attendees consent to the use of their photographs, videos and recordings for promotional, marketing and archival purposes without additional compensation."
      ]
    },
    {
      title: "5. Liability",
      content: [
        "Participants are responsible for their own belongings.",
        "Atlas and AUVREO International shall not be responsible for loss, theft or damage to personal property, except where required by law."
      ]
    },
    {
      title: "6. Refund Policy",
      content: [
        "Cancellation requests must be submitted in writing to the official Atlas email.",
        "If a cancellation is approved before the published refund deadline, Atlas will refund 75% of the registration fee. The remaining 25% is retained to cover payment gateway charges, administrative processing and event preparation costs.",
        "No refunds will be issued after the refund deadline or for no-shows.",
        "If Atlas cancels the event without rescheduling, refunds or alternative arrangements will be communicated separately."
      ]
    },
    {
      title: "7. Transfers",
      content: [
        "Registration transfers to another participant may be permitted before a specified deadline, subject to approval by the Organising Committee."
      ]
    },
    {
      title: "8. Intellectual Property",
      content: [
        "The Atlas Union Summit name, logo, branding, website content and event materials are the intellectual property of AUVREO International and may not be used without prior written permission."
      ]
    },
    {
      title: "9. Force Majeure",
      content: [
        "Atlas shall not be liable for delays, postponements or cancellations caused by circumstances beyond its reasonable control, including natural disasters, government restrictions, public safety concerns or other unforeseen events."
      ]
    },
    {
      title: "10. Final Decision",
      content: [
        "The Organising Committee reserves the right to make final decisions on matters relating to registrations, participation, awards, discipline and event operations."
      ]
    }
  ];

  return (
    <section id="terms" className="py-24 relative z-10 border-t border-white/5 bg-[var(--atlas-black)]">
      <div className="absolute inset-0 grid-bg opacity-[0.03]" />
      
      <div className="max-w-[1000px] mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="classified-label text-[var(--atlas-cyan)]">/ LEGAL DOCUMENTATION</span>
          <h2 className="font-display text-white text-3xl md:text-5xl mt-4 tracking-widest uppercase">
            Terms & Conditions
          </h2>
          <p className="text-white/50 text-[11px] md:text-xs font-mono max-w-2xl mx-auto mt-6 tracking-wider">
            ATLAS UNION SUMMIT 2026<br/>
            By registering for Atlas Union Summit 2026, all participants agree to the following Terms & Conditions.
          </p>
        </motion.div>

        <div className="space-y-6">
          {terms.map((term, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="glass-strong border border-white/5 rounded-lg p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-[var(--atlas-cyan)] to-transparent opacity-50" />
              <h3 className="font-display text-[var(--atlas-gold)] text-lg mb-3 uppercase tracking-wider">
                {term.title}
              </h3>
              <ul className="space-y-2">
                {term.content.map((item, i) => (
                  <li key={i} className="text-white/70 font-mono text-xs md:text-sm leading-relaxed flex gap-3">
                    <span className="text-[var(--atlas-cyan)]/50 mt-1">◇</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="font-mono text-[10px] text-white/30 tracking-[0.2em]">
            DOCUMENT ID: AUS-LEGAL-2026-TNC // END OF FILE
          </p>
        </div>
      </div>
    </section>
  );
}
