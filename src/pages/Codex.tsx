import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- DATA (Tetap Sama, Tidak Ada Yang Dihapus) ---
const BUFFS = [
  { name: "Adventurer's Haste", icon: "⚡", desc: "Didapatkan dengan mengirimkan tugas setidaknya 24 jam sebelum batas waktu. Kecepatanmu sungguh legendaris!", howTo: "Kirimkan tugas apa pun dengan sisa waktu 24 jam atau lebih sebelum batas waktu.", effect: "+50% XP Bonus", duration: "Bertahan 24 Jam" },
  { name: "Scholar's Focus", icon: "📚", desc: "Didapatkan dengan menyelesaikan tugas dengan tingkat kesulitan Hard. Dedikasimu terhadap tugas yang menantang sangat mengagumkan.", howTo: "Kirimkan tugas dengan tingkat kesulitan set ke Hard.", effect: "+20% XP Bonus", duration: "Bertahan 24 Jam" },
  { name: "Weekend Warrior", icon: "🗡️", desc: "Didapatkan dengan mengirimkan tugas pada akhir pekan. Bahkan di hari libur, kamu terus maju!", howTo: "Kirimkan tugas apa pun pada Sabtu atau Minggu.", effect: "+10% XP Bonus", duration: "Bertahan 24 Jam" },
  { name: "Night Owl", icon: "🦉", desc: "Didapatkan dengan mengirimkan tugas antara tengah malam dan 5 pagi. Guild tidak pernah tidur.", howTo: "Kirimkan tugas antara 12:00 AM dan 4:59 AM.", effect: "Buff pengakuan", duration: "Bertahan 24 Jam" },
  { name: "Clutch Player", icon: "🎯", desc: "Didapatkan dengan mengirimkan tugas tepat sebelum tenggat waktu — dalam 10% waktu terakhir. Hidup di ujung pedang!", howTo: "Kirimkan tugas ketika tersisa kurang dari 10% waktu total.", effect: "Buff pengakuan", duration: "Bertahan 24 Jam" },
  { name: "First Strike", icon: "⚔️", desc: "Didapatkan dengan mengirimkan tugas dalam 1 jam setelah menerimanya. Eksekusi yang cepat seperti kilat!", howTo: "Terima dan kirimkan tugas dalam waktu 60 menit.", effect: "Buff pengakuan", duration: "Bertahan 24 Jam" },
  { name: "Chain Quest (Combo)", icon: "🔗", desc: "Didapatkan dengan mengirimkan 3 tugas dalam periode 24 jam. Kamu sedang dalam bentuk api!", howTo: "Kirimkan 3 tugas dalam jendela waktu 24 jam.", effect: "+15% XP Bonus pada tugas ketiga", duration: "Bertahan 24 Jam" },
  { name: "Aura of Purity", icon: "✨", desc: "Didapatkan dengan menyelesaikan tugas dengan tingkat kesulitan Legendary. Jiwa mu menjadi murni, membersihkan semua debuff dan memberimu kekebalan.", howTo: "Kirimkan tugas dengan tingkat kesulitan Legendary.", effect: "Bersihkan SEMUA debuff aktif + memberikan kekebalan terhadap debuff berikutnya", duration: "Bertahan 24 Jam (kekebalan hingga dikonsumsi)" },
];

const DEBUFFS = [
  { name: "Cursed Procrastination", icon: "🐌", desc: "Diterapkan jika sebuah tugas diajukan setelah batas waktu yang ditentukan. Waktu tidak menunggu siapa pun!", howTo: "Kirimkan tugas apa pun setelah batas waktu telah berlalu.", effect: "-10 XP Flat Penalty", duration: "Bertahan 48 Jam" },
  { name: "Slacker's Fatigue", icon: "😴", desc: "Diterapkan ketika kamu memiliki lebih dari 5 tugas aktif (diterima tapi belum dikirim). Terlalu banyak tugas membuatmu lelah.", howTo: "Terima lebih dari 5 tugas tanpa menyelesaikannya atau mengirimkannya.", effect: "-5% XP pada tugas berikutnya", duration: "Bertahan 24 Jam" },
  { name: "Rusty Equipment", icon: "🪓", desc: "Diterapkan setelah 3 hari tidak aktif. Seorang pejuang harus menjaga pedangnya tetap tajam!", howTo: "Tidak menyelesaikan tugas apa pun selama 3 hari berturut-turut.", effect: "Avatar menjadi grayscale; SEMUA buff dinonaktifkan hingga 1 tugas diselesaikan", duration: "Hingga kamu menyelesaikan sebuah tugas" },
  { name: "Broken Shield", icon: "🛡️💔", desc: "Diterapkan ketika Master Guild menolak tugas yang kamu kirim. Kepercayaanmu terguncang.", howTo: "Memiliki tugas yang dikirim ditolak oleh Master Guild.", effect: "-25% pengurangan XP ketika tugas tersebut akhirnya disetujui", duration: "Bertahan 48 Jam atau hingga tugas disetujui ulang" },
  { name: "Stagnant Soul", icon: "⛓️", desc: "Debuff terkuat. Tiga pengiriman terlambat berturut-turut akan membatasi jiwa mu, memblokir semua buff.", howTo: "Kirimkan 3 tugas berturut-turut setelah tenggat waktu mereka (pengiriman terlambat berturut-turut).", effect: "Memblokir SEMUA Buff/Multiplier untuk 3 tugas berikutnya (XP dasar saja)", duration: "Hingga 3 tugas diselesaikan" },
];

const ACHIEVEMENTS = [
  { name: "First Blood", icon: "⚔️", desc: "Selesaikan tugas pertamamu.", howTo: "Buat Tugas Pertama mu di Terima Oleh Guild Master." },
  { name: "Elite Contributor", icon: "🛡️", desc: "Selesaikan 5 tugas.", howTo: "Kumpulkan 5 penyelesaian tugas yang disetujui." },
  { name: "Veteran", icon: "🏅", desc: "Selesaikan 10 tugas.", howTo: "Kumpulkan 10 penyelesaian tugas yang disetujui." },
  { name: "Speed Demon", icon: "⚡", desc: "Kirimkan tugas dalam 1 jam setelah menerimanya.", howTo: "Terima tugas dan kirimkan dalam waktu 60 menit." },
  { name: "Legendary Slayer", icon: "👑", desc: "Selesaikan tugas dengan kesulitan legendary.", howTo: "Dapatkan persetujuan untuk quest dengan tingkat kesulitan Legendary." },
  { name: "Tavern Regular", icon: "🍻", desc: "Kirimkan 10 pesan di kedai ngumpul.", howTo: "Kirim setidaknya 10 pesan di obrolan Kedai Ngumpul." },
  { name: "Rising Star", icon: "⭐", desc: "Capai level 5.", howTo: "Kumpulkan XP yang cukup untuk mencapai level 5 (total 800 XP)." },
  { name: "Elite Warrior", icon: "💎", desc: "Capai level 10.", howTo: "Kumpulkan XP yang cukup untuk mencapai level 10 (total 1800 XP)." },
  { name: "Hat Trick", icon: "🎯", desc: "Selesaikan 3 tugas berturut-turut tanpa terkena debuff.", howTo: "Selesaikan 3 tugas berturut-turut tanpa mendapatkan efek negatif." },
  { name: "Jack of All Trades", icon: "🃏", desc: "Selesaikan satu tugas untuk setiap tingkat kesulitan.", howTo: "Selesaikan setidaknya satu tugas untuk setiap tingkat kesulitan: Easy, Medium, Hard, and Legendary." },
  { name: "Night Owl", icon: "🦉", desc: "Kirimkan tugas antara tengah malam dan pukul 5 pagi.", howTo: "Kirimkan tugas apa pun antara pukul 12:00 AM dan 4:59 AM." },
  { name: "Streak Master", icon: "🔥", desc: "Selesaikan 3 Tugas Berturut-turut.", howTo: "Selesaikan 3 tugas secara beruntun tanpa kegagalan atau pembatalan." },
];

const ROLES = [
  { name: "Guild Master", icon: "👑", desc: "Pemimpin yang membuat tugas, meninjau pengajuan, menolak atau menyetujui tugas, dan mengelola guild. Dapat mengundang adventurer." },
  { name: "Adventurer", icon: "⚔️", desc: "Sosok pemberani yang menerima tugas, berpacu dengan tenggat waktu, dan mendapatkan XP. Dapat menerima tugas dan mengirimkannya untuk ditinjau." },
];

// --- MAIN COMPONENT ---
const Codex = () => {
  // Gunakan state untuk melacak tab aktif agar AnimatePresence bisa bekerja maksimal
  const [activeTab, setActiveTab] = useState("roles");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="text-center mb-10">
        <h1 className="font-heading text-3xl text-gold mb-2">📖 Naskah Guild</h1>
        <p className="text-muted-foreground font-body">Naskah Suci tentang aturan dan tradisi Guild</p>
      </header>

      <Tabs defaultValue="roles" onValueChange={setActiveTab} className="w-full">
        {/* Navigation */}
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-background/50 border border-gold/20 p-1 h-auto mb-8">
          <TabsTrigger value="roles" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold py-2 font-heading text-xs">⚜️ ROLES</TabsTrigger>
          <TabsTrigger value="buffs" className="data-[state=active]:bg-emerald/20 data-[state=active]:text-emerald-glow py-2 font-heading text-xs">✨ BUFFS</TabsTrigger>
          <TabsTrigger value="debuffs" className="data-[state=active]:bg-crimson/20 data-[state=active]:text-crimson py-2 font-heading text-xs">💀 DEBUFFS</TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold py-2 font-heading text-xs">🏆 PRESTASI</TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-royal-purple/20 data-[state=active]:text-royal-purple py-2 font-heading text-xs">📜 ATURAN</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value={activeTab} key={activeTab} asChild>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "roles" && (
                <div className="grid md:grid-cols-2 gap-4">
                  {ROLES.map(role => (
                    <div key={role.name} className="scroll-card rounded-lg p-5 flex items-start gap-4 border border-border">
                      <span className="text-3xl">{role.icon}</span>
                      <div>
                        <h3 className="font-heading text-base text-gold">{role.name}</h3>
                        <p className="text-sm text-muted-foreground font-body mt-1 leading-relaxed">{role.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "buffs" && (
                <div className="grid md:grid-cols-2 gap-4">
                  {BUFFS.map(item => (
                    <div key={item.name} className="scroll-card rounded-lg p-4 flex items-start gap-3 border border-border">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-heading text-sm text-emerald-glow">{item.name}</h3>
                        <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2 hover:line-clamp-none">{item.desc}</p>
                        <div className="mt-3 flex items-start gap-1.5 bg-emerald/10 rounded px-2.5 py-1.5 border border-emerald/20">
                          <span className="text-[10px] font-heading text-emerald-glow shrink-0">HOW:</span>
                          <span className="text-[10px] text-foreground font-body">{item.howTo}</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <span className="inline-flex items-center gap-1 text-[9px] font-heading px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">{item.effect}</span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-heading px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">⏱️ {item.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "debuffs" && (
                <div className="grid md:grid-cols-2 gap-4">
                  {DEBUFFS.map(item => (
                    <div key={item.name} className="scroll-card rounded-lg p-4 flex items-start gap-3 border border-border">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-heading text-sm text-crimson">{item.name}</h3>
                        <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2 hover:line-clamp-none">{item.desc}</p>
                        <div className="mt-3 flex items-start gap-1.5 bg-crimson/10 rounded px-2.5 py-1.5 border border-crimson/20">
                          <span className="text-[10px] font-heading text-crimson shrink-0">TRIGGER:</span>
                          <span className="text-[10px] text-foreground font-body">{item.howTo}</span>
                        </div>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[9px] font-heading px-2 py-0.5 rounded bg-crimson/10 text-crimson border border-crimson/20">{item.effect}</span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-heading px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">⏱️ {item.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "achievements" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ACHIEVEMENTS.map(item => (
                    <div key={item.name} className="scroll-card rounded-lg p-4 flex flex-col gap-2 border border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.icon}</span>
                        <h3 className="font-heading text-xs text-gold uppercase tracking-wider">{item.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground font-body line-clamp-2">{item.desc}</p>
                      <div className="mt-auto pt-2 flex items-start gap-1.5 border-t border-gold/10">
                        <span className="text-[9px] font-heading text-gold/60 uppercase">Unlock:</span>
                        <span className="text-[9px] text-foreground/80 font-body">{item.howTo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "rules" && (
                <div className="space-y-4">
                  <div className="parchment-bg rounded-lg p-6 border border-gold/20 shadow-lg">
                    <h2 className="font-heading text-lg text-gold mb-4 flex items-center gap-2">
                      <span className="p-1.5 bg-gold/10 rounded">📋</span> Quest Workflow
                    </h2>
                    <div className="grid gap-3 font-body text-sm text-foreground">
                      {[
                        { step: "1", role: "Guild Master", text: "menulis quest (judul, deskripsi, kesulitan, & deadline)." },
                        { step: "2", role: "Adventurer", text: "mengambil quest dari papan tugas (Quest Board)." },
                        { step: "3", role: "Submission", text: "Adventurer mengumpulkan tugas via 'Submit for Review'." },
                        { step: "4", role: "Frozen", text: "Timer deadline akan terhenti otomatis saat submit.", highlight: true },
                        { step: "5", role: "Review", text: "Guild Master menyetujui atau menolak pengajuan." },
                        { step: "6", role: "Penalty", text: "Jika ditolak, Broken Shield aktif (-25% XP)." },
                        { step: "7", role: "Calculation", text: "Total XP = Base XP + Buffs - Debuffs." }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-3 items-start group">
                          <span className="w-5 h-5 rounded-full bg-gold/20 text-gold text-[10px] flex items-center justify-center shrink-0 border border-gold/30">{item.step}</span>
                          <p className="leading-relaxed">
                            <strong className="text-gold font-heading text-xs uppercase tracking-tighter mr-1">{item.role}:</strong>
                            <span className={item.highlight ? "text-emerald-glow italic" : ""}>{item.text}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="parchment-bg rounded-lg p-6 border border-gold/20 shadow-lg">
                    <h2 className="font-heading text-lg text-gold mb-4 flex items-center gap-2">
                      <span className="p-1.5 bg-gold/10 rounded">📊</span> XP & Leveling System
                    </h2>
                    <div className="space-y-4 font-body text-sm text-foreground">
                      <p>Imbalan XP berdasarkan tingkat kesulitan:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { l: "Easy", v: "50", c: "text-emerald-glow", bg: "bg-emerald/5" },
                          { l: "Medium", v: "100", c: "text-gold", bg: "bg-gold/5" },
                          { l: "Hard", v: "200", c: "text-crimson", bg: "bg-crimson/5" },
                          { l: "Legendary", v: "500", c: "text-royal-purple", bg: "bg-royal-purple/5" }
                        ].map(diff => (
                          <div key={diff.l} className={`${diff.bg} border border-white/5 rounded p-2 text-center`}>
                            <div className={`text-[10px] font-heading ${diff.c}`}>{diff.l}</div>
                            <div className="text-lg font-heading tracking-tighter">{diff.v} <span className="text-[10px]">XP</span></div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-gold/10 text-xs leading-relaxed text-muted-foreground italic">
                        Setiap <strong className="text-foreground">200 XP</strong> naik 1 level. XP dipengaruhi Buff dan Debuff aktif. 
                        <br />
                        <span className="text-crimson">⚠️ Stagnant Soul: Mematikan semua multiplier (hanya Base XP).</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default Codex;