import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, QuestDifficulty, Quest } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Swords, Scroll as ScrollIcon } from "lucide-react"; // Tambah icon
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import QuestCard from "@/components/QuestCard";
import InviteModal from "@/components/InviteModal";

const QuestBoard = () => {
  const { currentUser, quests, createQuest, respondToDuel, users } = useGame();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [diff, setDiff] = useState<QuestDifficulty>("medium");
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [deadlineHour, setDeadlineHour] = useState("12");
  const [deadlineMinute, setDeadlineMinute] = useState("00");
  const [deadlinePeriod, setDeadlinePeriod] = useState<"AM" | "PM">("PM");
  const [open, setOpen] = useState(false);

  const isGM = currentUser?.role === "guild_master";

  // --- LOGIKA FILTER BARU ---
  const openQuests = quests.filter(q => q.status === "open" && !q.isDuel); 
  
  // Sekarang Active Quests termasuk duel yang sudah accepted
  const myActive = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "accepted");
  
  const mySubmitted = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "submitted");
  const myCompleted = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "completed");

  // Cari tantangan duel yang masuk (Invitation Scroll)
  const incomingDuel = quests.find(q => 
    q.isDuel && 
    q.duelStatus === "pending" && 
    q.duelOpponentId === currentUser?.id
  );

  const challenger = users.find(u => u.id === incomingDuel?.challengerId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadlineDate) return;
    const deadline = new Date(deadlineDate);
    let h = parseInt(deadlineHour);
    if (deadlinePeriod === "AM" && h === 12) h = 0;
    if (deadlinePeriod === "PM" && h !== 12) h += 12;
    deadline.setHours(h, parseInt(deadlineMinute), 0, 0);
    const deadlineMs = deadline.getTime();
    createQuest(title, desc, diff, deadlineMs);
    setTitle(""); setDesc(""); setDeadlineDate(undefined); setOpen(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto relative">
      
      {/* --- INVITATION SCROLL POP-UP --- */}
      <AnimatePresence>
        {incomingDuel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#fdf2d9] border-y-[12px] border-[#8b5a2b] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ borderRadius: "2px" }}
            >
              {/* Texture Kertas Kuno */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/old-paper.png')]" />
              
              <div className="relative z-10 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-[#8b5a2b]/10 rounded-full border border-[#8b5a2b]/20">
                    <Swords className="h-12 w-12 text-[#8b5a2b] animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="font-heading text-3xl text-[#5d4037] uppercase tracking-tighter">Tantangan Duel!</h2>
                  <div className="h-0.5 w-24 bg-[#8b5a2b]/30 mx-auto" />
                </div>

                <p className="font-body text-[#795548] text-lg leading-relaxed italic">
                  "Dengar Lah, adventurer! <span className="font-bold text-[#5d4037]">@{challenger?.username}</span> telah menantang Anda untuk bertarung demi membuktikan kehebatan di medan pertempuran! Apakah Anda siap menerima tantangan ini dan menunjukkan keberanian sejati Anda? <br/><br/>
                  Jika Anda menerima, bersiaplah untuk menghadapi ujian yang akan menguji keterampilan, strategi, dan keberanian Anda: 
                  <br/>
                  <span className="not-italic font-heading text-sm bg-[#8b5a2b]/10 px-2 py-1 rounded mt-2 inline-block">
                    {incomingDuel.title}
                  </span>"
                </p>

                <div className="flex gap-3 pt-4 font-heading">
                  <Button 
                    onClick={() => respondToDuel && respondToDuel(incomingDuel.id, 'accept')}
                    className="flex-1 bg-[#8b5a2b] hover:bg-[#5d4037] text-[#fdf2d9] py-6 text-lg shadow-lg"
                  >
                    Terima 
                  </Button>
                  <Button 
                    onClick={() => respondToDuel && respondToDuel(incomingDuel.id, 'reject')}
                    variant="outline"
                    className="flex-1 border-[#8b5a2b] text-[#8b5a2b] hover:bg-[#8b5a2b]/10 py-6 text-lg"
                  >
                    Kabur  
                  </Button>
                </div>
              </div>

              {/* Dekorasi Gulungan Samping */}
              <div className="absolute -left-6 top-0 bottom-0 w-8 bg-[#6d4c41] rounded-full shadow-inner" />
              <div className="absolute -right-6 top-0 bottom-0 w-8 bg-[#6d4c41] rounded-full shadow-inner" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl text-gold flex items-center gap-2">
          <ScrollIcon className="h-6 w-6" />
          Papan Tugas
        </h1>
        <div className="flex gap-2">
          {isGM && <InviteModal />}
          {isGM && (
            <Dialog open={open} onOpenChange={setOpen}>
              {/* ... trigger & content dialog post quest lo tetep sama ... */}
              <DialogTrigger asChild>
                <Button className="font-heading">+ Tugas Baru</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-heading text-gold">Pasang Tugas Barus</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label>Judul Tugas</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-secondary" />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Textarea value={desc} onChange={e => setDesc(e.target.value)} required className="bg-secondary" />
                  </div>
                  <div>
                    <Label>Kesulitan</Label>
                    <div className="flex gap-2 mt-1">
                      {(["easy", "medium", "hard", "legendary"] as QuestDifficulty[]).map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDiff(d)}
                          className={`px-3 py-1.5 rounded border text-sm font-heading capitalize transition-all ${
                            diff === d ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Batas Tugas</Label>
                    <div className="flex gap-2 mt-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("flex-1 justify-start text-left font-body bg-secondary border-border", !deadlineDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {deadlineDate ? format(deadlineDate, "PPP") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={deadlineDate}
                            onSelect={setDeadlineDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <Select value={deadlineHour} onValueChange={setDeadlineHour}>
                        <SelectTrigger className="w-20 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const val = String(i + 1).padStart(2, "0");
                            return (
                              <SelectItem key={val} value={val}>
                                {val}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <span className="flex items-center text-muted-foreground">:</span>
                      <Select value={deadlineMinute} onValueChange={setDeadlineMinute}>
                        <SelectTrigger className="w-20 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["00", "15", "30", "45"].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={deadlinePeriod} onValueChange={(v) => setDeadlinePeriod(v as "AM" | "PM")}>
                        <SelectTrigger className="w-20 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-heading">Pasang Tugas</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* --- SECTIONS --- */}
      <Section title="Tugas Tersedia" count={openQuests.length}>
        {openQuests.map(q => <QuestCard key={q.id} quest={q} />)}
      </Section>

      {/* Duel Challenges HAPUS (Sudah diganti pop-up & masuk ke Active) */}

      <Section title="Tugas Aktif" count={myActive.length}>
        {myActive.map(q => <QuestCard key={q.id} quest={q} />)}
      </Section>

      <Section title="Diajukan (Menunggu Ulasan)" count={mySubmitted.length} glow="gold">
        {mySubmitted.map(q => <QuestCard key={q.id} quest={q} />)}
      </Section>

      <Section title="Selesai" count={myCompleted.length} glow="green">
        {myCompleted.map(q => <QuestCard key={q.id} quest={q} />)}
      </Section>
    </div>
  );
};

// ... Section component tetap sama ...
const Section = ({ title, count, children, glow }: { title: string; count: number; children: React.ReactNode; glow?: "gold" | "green" }) => (
  <div className="mb-8">
    <h2 className="font-heading text-lg text-foreground mb-3 flex items-center gap-2">
      {title}
      <span className="text-sm text-muted-foreground font-body">({count})</span>
    </h2>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {count === 0 && (
          <p className="text-muted-foreground font-body col-span-full text-center py-8">Sedang menunggu tugas baru...</p>
        )}
        {children}
      </AnimatePresence>
    </div>
  </div>
);

export default QuestBoard;