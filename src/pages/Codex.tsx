import { motion } from "framer-motion";

const BUFFS = [
  { name: "Adventurer's Haste", icon: "⚡", desc: "Didapatkan dengan mengirimkan misi setidaknya 24 jam sebelum batas waktu. Kecepatanmu sungguh legendaris!", howTo: "Kirimkan tugas apa pun dengan sisa waktu 24 jam atau lebih sebelum batas waktu.", effect: "+50% XP Bonus", duration: "Bertahan 24 Jam" },
  { name: "Scholar's Focus", icon: "📚", desc: "Didapatkan dengan menyelesaikan tugas dengan tingkat kesulitan Hard. Dedikasimu terhadap tugas yang menantang sangat mengagumkan.", howTo: "Kirimkan tugas dengan tingkat kesulitan set ke Hard.", effect: "+20% XP Bonus", duration: "Bertahan 24 Jam" },
  { name: "Weekend Warrior", icon: "🗡️", desc: "Didapatkan dengan mengirimkan tugas pada akhir pekan. Bahkan di hari libur, kamu terus maju!", howTo: "Kirimkan tugas apa pun pada Sabtu atau Minggu.", effect: "+10% XP Bonus", duration: "Bertahan 24 Jam" },
  { name: "Night Owl", icon: "🦉", desc: "Didapatkan dengan mengirimkan tugas antara tengah malam dan 5 pagi. Guild tidak pernah tidur.", howTo: "Kirimkan tugas antara 12:00 AM dan 4:59 AM.", effect: "Buff pengakuan", duration: "Bertahan 24 Jam" },
  { name: "Clutch Player", icon: "🎯", desc: "Didapatkan dengan mengirimkan tugas tepat sebelum tenggat waktu — dalam 10% waktu terakhir. Hidup di ujung pedang!", howTo: "Kirimkan tugas ketika tersisa kurang dari 10% waktu total.", effect: "Buff pengakuan", duration: "Bertahan 24 Jam" },
  { name: "First Strike", icon: "⚔️", desc: "Didapatkan dengan mengirimkan tugas dalam 1 jam setelah menerimanya. Eksekusi yang cepat seperti kilat!", howTo: "Terima dan kirimkan tugas dalam waktu 60 menit.", effect: "Buff pengakuan", duration: "Bertahan 24 Jam" },
  { name: "Chain Quest (Combo)", icon: "🔗", desc: "Earned by submitting 3 quests within a 24-hour window. You're on fire!", howTo: "Submit 3 quests within a rolling 24-hour period. The buff applies on the 3rd submission.", effect: "+15% XP Bonus on the 3rd quest", duration: "Lasts 24 hours" },
  { name: "Aura of Purity", icon: "✨", desc: "The ultimate buff. Completing a Legendary quest purifies your soul, clearing all debuffs and granting immunity.", howTo: "Submit a quest with Legendary difficulty.", effect: "Clears ALL active debuffs + grants immunity to next debuff", duration: "Lasts 24 hours (immunity until consumed)" },
];

const DEBUFFS = [
  { name: "Cursed Procrastination", icon: "🐌", desc: "Diterapkan jika sebuah misi diajukan setelah batas waktu yang ditentukan. Waktu tidak menunggu siapa pun!", howTo: "Kirimkan tugas apa pun setelah batas waktu telah berlalu.", effect: "-10 XP Flat Penalty", duration: "Bertahan 48 Jam" },
  { name: "Slacker's Fatigue", icon: "😴", desc: "Diterapkan ketika kamu memiliki lebih dari 5 tugas aktif (diterima tapi belum dikirim). Terlalu banyak tugas membuatmu lelah.", howTo: "Terima lebih dari 5 tugas tanpa menyelesaikannya atau mengirimkannya.", effect: "-5% XP pada tugas berikutnya", duration: "Bertahan 24 Jam" },
  { name: "Rusty Equipment", icon: "🪓", desc: "Diterapkan setelah 3 hari tidak aktif. Seorang pejuang harus menjaga pedangnya tetap tajam!", howTo: "Tidak menyelesaikan tugas apa pun selama 3 hari berturut-turut.", effect: "Avatar menjadi grayscale; SEMUA buff dinonaktifkan hingga 1 tugas diselesaikan", duration: "Hingga kamu menyelesaikan sebuah tugas" },
  { name: "Broken Shield", icon: "🛡️💔", desc: "Diterapkan ketika Master Guild menolak tugas yang kamu kirim. Kepercayaanmu terguncang.", howTo: "Memiliki tugas yang dikirim ditolak oleh Master Guild.", effect: "-25% pengurangan XP ketika tugas tersebut akhirnya disetujui", duration: "Bertahan 48 Jam atau hingga tugas disetujui ulang" },
  { name: "Stagnant Soul", icon: "⛓️", desc: "Debuff terkuat. Tiga pengiriman terlambat berturut-turut akan membatasi jiwa mu, memblokir semua buff.", howTo: "Kirimkan 3 tugas berturut-turut setelah tenggat waktu mereka (pengiriman terlambat berturut-turut).", effect: "Memblokir SEMUA Buff/Multiplier untuk 3 tugas berikutnya (XP dasar saja)", duration: "Hingga 3 tugas diselesaikan" },
];

const ACHIEVEMENTS = [
  { name: "First Blood", icon: "⚔️", desc: "Selesaikan tugas pertamamu.", howTo: "Buat Tugas Pertama mu di Terima Oleh Guild Master." },
  { name: "Elite Contributor", icon: "🛡️", desc: "Selesaikan 5 tugas.", howTo: "Kumpulkan 5 penyelesaian misi yang disetujui." },
  { name: "Veteran", icon: "🏅", desc: "Selesaikan 10 tugas.", howTo: "Kumpulkan 10 penyelesaian misi yang disetujui." },
  { name: "Speed Demon", icon: "⚡", desc: "Kirimkan tugas dalam 1 jam setelah menerimanya.", howTo: "Terima tugas dan kirimkan dalam waktu 60 menit." },
  { name: "Legendary Slayer", icon: "👑", desc: "Selesaikan tugas dengan kesulitan legendary.", howTo: "Dapatkan persetujuan untuk quest dengan tingkat kesulitan Legendary." },
  { name: "Tavern Regular", icon: "🍻", desc: "Kirimkan 10 pesan di kedai ngumpul.", howTo: "Kirim setidaknya 10 pesan di obrolan Kedai Ngumpul." },
  { name: "Rising Star", icon: "⭐", desc: "Capai level 5.", howTo: "Kumpulkan XP yang cukup untuk mencapai level 5 (total 800 XP)." },
  { name: "Elite Warrior", icon: "💎", desc: "Capai level 10.", howTo: "Kumpulkan XP yang cukup untuk mencapai level 10 (total 1800 XP)." },
  { name: "Hat Trick", icon: "🎯", desc: "Selesaikan 3 tugas berturut-turut tanpa terkena debuff.", howTo: "Selesaikan 3 misi berturut-turut tanpa mendapatkan efek negatif." },
  { name: "Jack of All Trades", icon: "🃏", desc: "Selesaikan satu misi untuk setiap tingkat kesulitan.", howTo: "Selesaikan setidaknya satu tugas untuk setiap tingkat kesulitan: Easy, Medium, Hard, and Legendary." },
  { name: "Night Owl", icon: "🦉", desc: "Kirimkan misi antara tengah malam dan pukul 5 pagi.", howTo: "Kirimkan misi apa pun antara pukul 12:00 AM dan 4:59 AM." },
  { name: "Streak Master", icon: "🔥", desc: "Selesaikan 3 Tugas Berturut-turut.", howTo: "Selesaikan 3 misi secara beruntun tanpa kegagalan atau pembatalan." },
];

const ROLES = [
  { name: "Guild Master", icon: "👑", desc: "Pemimpin yang membuat tugas, meninjau pengajuan, menolak atau menyetujui tugas, dan mengelola guild. Dapat mengundang adventurer." },
  { name: "Adventurer", icon: "⚔️", desc: "Sosok pemberani yang menerima tugas, berpacu dengan tenggat waktu, dan mendapatkan XP. Dapat menerima tugas dan mengirimkannya untuk ditinjau." },
];

const Codex = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-heading text-2xl text-gold mb-2">📖 Guild Codex</h1>
      <p className="text-muted-foreground font-body mb-8">The sacred tome of guild knowledge</p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <CodexSection title="⚜️ Roles" items={ROLES} />

        <div>
          <h2 className="font-heading text-lg text-gold mb-3">✨ Buffs (XP Multipliers)</h2>
          <div className="space-y-3">
            {BUFFS.map(item => (
              <div key={item.name} className="scroll-card rounded-lg p-4 flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <h3 className="font-heading text-sm text-emerald-glow">{item.name}</h3>
                  <p className="text-sm text-muted-foreground font-body mt-0.5">{item.desc}</p>
                  <div className="mt-2 flex items-start gap-1.5 bg-emerald/10 rounded px-2.5 py-1.5 border border-emerald/20">
                    <span className="text-xs font-heading text-emerald-glow shrink-0">HOW:</span>
                    <span className="text-xs text-foreground font-body">{item.howTo}</span>
                  </div>
                  <div className="mt-1.5 flex gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-heading px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">{item.effect}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-heading px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">⏱️ {item.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg text-gold mb-3">💀 Debuffs (Penalties)</h2>
          <div className="space-y-3">
            {DEBUFFS.map(item => (
              <div key={item.name} className="scroll-card rounded-lg p-4 flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <h3 className="font-heading text-sm text-crimson">{item.name}</h3>
                  <p className="text-sm text-muted-foreground font-body mt-0.5">{item.desc}</p>
                  <div className="mt-2 flex items-start gap-1.5 bg-crimson/10 rounded px-2.5 py-1.5 border border-crimson/20">
                    <span className="text-xs font-heading text-crimson shrink-0">TRIGGER:</span>
                    <span className="text-xs text-foreground font-body">{item.howTo}</span>
                  </div>
                  <div className="mt-1.5 flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-heading px-2 py-0.5 rounded bg-crimson/10 text-crimson border border-crimson/20">{item.effect}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-heading px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">⏱️ {item.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg text-gold mb-3">🏆 Achievements</h2>
          <div className="space-y-3">
            {ACHIEVEMENTS.map(item => (
              <div key={item.name} className="scroll-card rounded-lg p-4 flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <h3 className="font-heading text-sm text-gold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground font-body mt-0.5">{item.desc}</p>
                  <div className="mt-2 flex items-start gap-1.5 bg-gold/10 rounded px-2.5 py-1.5 border border-gold/20">
                    <span className="text-xs font-heading text-gold shrink-0">UNLOCK:</span>
                    <span className="text-xs text-foreground font-body">{item.howTo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="parchment-bg rounded-lg p-6 border border-gold/20">
          <h2 className="font-heading text-lg text-gold mb-3">📋 Quest Workflow</h2>
          <div className="space-y-2 font-body text-sm text-foreground">
            <p>1. <strong className="text-gold">Guild Master</strong> posts a quest with title, description, difficulty, and deadline.</p>
            <p>2. <strong className="text-gold">Adventurer</strong> accepts the quest from the board.</p>
            <p>3. Adventurer works on the quest and clicks <strong>"Submit for Review"</strong>.</p>
            <p>4. <strong>⏱️ CRITICAL:</strong> The deadline timer <strong>freezes</strong> upon submission.</p>
            <p>5. Guild Master reviews and <strong>approves</strong> or <strong>rejects</strong> the quest.</p>
            <p>6. If rejected, <strong>Broken Shield</strong> debuff applies (-25% XP on re-approval).</p>
            <p>7. XP breakdown shown: Base XP + Buff Bonuses − Debuff Penalties = Total XP.</p>
          </div>
        </div>

        <div className="parchment-bg rounded-lg p-6 border border-gold/20">
          <h2 className="font-heading text-lg text-gold mb-3">📊 XP & Leveling</h2>
          <div className="space-y-2 font-body text-sm text-foreground">
            <p>Each quest awards XP based on difficulty:</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <span className="text-emerald-glow font-heading text-xs">Easy → 50 XP</span>
              <span className="text-gold font-heading text-xs">Medium → 100 XP</span>
              <span className="text-crimson font-heading text-xs">Hard → 200 XP</span>
              <span className="text-royal-purple font-heading text-xs">Legendary → 500 XP</span>
            </div>
            <p className="mt-2">Every <strong>200 XP</strong> earns you a new level. XP is modified by active Buffs and Debuffs.</p>
            <p className="mt-1 text-crimson text-xs">⛓️ <strong>Stagnant Soul</strong> blocks all multipliers — you earn base XP only until lifted.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CodexSection = ({ title, items }: { title: string; items: { name: string; icon: string; desc: string }[]; }) => (
  <div>
    <h2 className="font-heading text-lg text-gold mb-3">{title}</h2>
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.name} className="scroll-card rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">{item.icon}</span>
          <div>
            <h3 className="font-heading text-sm text-foreground">{item.name}</h3>
            <p className="text-sm text-muted-foreground font-body mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Codex;
