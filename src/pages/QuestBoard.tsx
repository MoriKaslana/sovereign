import { useState, useEffect } from "react"; // Tambahkan useEffect
import { motion, AnimatePresence } from "framer-motion";
import { QuestDifficulty } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Swords, Scroll as ScrollIcon, Sword, Timer, Archive } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import QuestCard from "@/components/QuestCard";
import InviteModal from "@/components/InviteModal";
import { useGame } from "@/context/GameContext";
import { TutorialOverlay } from "@/components/TutorialOverlay"; // Import Tutorial kita

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

  // --- LOGIKA MULTI-STEP TUTORIAL ---
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  const tutorialSteps = [
    {
      targetId: "quest-board-title",
      title: "Selamat Datang, GM!",
      text: "Ini adalah Papan Tugas Guild. Tempat utama untuk memantau semua tugas dan aktivitas adventurer Anda."
    },
    {
      targetId: "sidebar-container", // Mengincar ID yang kita pasang di AppSidebar tadi
      title: "Navigasi Guild",
      text: "Gunakan sidebar ini untuk berpindah ke Papan Ulasan, Warkop Numpul, Naskah Guild, Aula, dan Profil Anda."
    },
    {
      targetId: "step-create-quest",
      title: "Posting Tugas Baru",
      text: "Sebagai Guild Master, Anda bisa membuat tugas baru di sini. Tentukan kesulitan dan batas waktunya!"
    },
    {
      targetId: "step-invite-member",
      title: "Rekrut Anggota",
      text: "Klik tombol ini untuk mengundang adventurer baru bergabung ke dalam guild Sovereign Anda."
    }
  ];

  useEffect(() => {
    if (isGM && currentUser) {
      // Tutorial hanya muncul sekali per User ID
      const hasSeen = localStorage.getItem(`gm_onboarding_done_${currentUser.id}`);
      if (!hasSeen) {
        setShowTutorial(true);
      }
    }
  }, [isGM, currentUser]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTutorial();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(`gm_onboarding_done_${currentUser?.id}`, "true");
  };

  // --- LOGIKA FILTER ---
  const openQuests = quests.filter(q => q.status === "open" && !q.isDuel);
  const myActive = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "accepted");
  const mySubmitted = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "submitted");
  const myCompleted = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "completed");

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
    <div className="p-6 max-w-6xl mx-auto relative space-y-10">
      
      {/* Overlay Tutorial */}
      <TutorialOverlay 
        isOpen={showTutorial}
        targetId={tutorialSteps[currentStep]?.targetId}
        title={tutorialSteps[currentStep]?.title}
        text={tutorialSteps[currentStep]?.text}
        currentStep={currentStep}
        totalSteps={tutorialSteps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={finishTutorial}
      />

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
                  "Dengar Lah, adventurer! <span className="font-bold text-[#5d4037]">@{challenger?.username}</span> telah menantang Anda untuk bertarung! <br/><br/>
                  Ujian keberanian: <br/>
                  <span className="not-italic font-heading text-sm bg-[#8b5a2b]/10 px-2 py-1 rounded mt-2 inline-block border border-[#8b5a2b]/20 text-[#5d4037]">
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
              <div className="absolute -left-6 top-0 bottom-0 w-8 bg-[#6d4c41] rounded-full shadow-inner" />
              <div className="absolute -right-6 top-0 bottom-0 w-8 bg-[#6d4c41] rounded-full shadow-inner" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <h1 
          id="quest-board-title" // ID STEP 1
          className="font-heading text-3xl text-gold flex items-center gap-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          <ScrollIcon className="h-8 w-8" />
          Papan Tugas Guild
        </h1>
        <div className="flex gap-3">
          {isGM && (
            <div id="step-invite-member"> {/* ID STEP 4 */}
              <InviteModal />
            </div>
          )}
          {isGM && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  id="step-create-quest" // ID STEP 3
                  className="font-heading bg-gold text-black hover:bg-gold/80 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                  + Tugas Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl text-gold">Pasang Tugas Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div>
                    <Label>Judul Tugas</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-secondary border-border" />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Textarea value={desc} onChange={e => setDesc(e.target.value)} required className="bg-secondary border-border min-h-[100px]" />
                  </div>
                  <div>
                    <Label>Tingkat Kesulitan</Label>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {(["easy", "medium", "hard", "legendary"] as QuestDifficulty[]).map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDiff(d)}
                          className={`px-2 py-2 rounded border text-[10px] font-heading uppercase transition-all ${
                            diff === d ? "border-gold bg-gold/10 text-gold shadow-[0_0_10px_rgba(212,175,55,0.1)]" : "border-border text-muted-foreground hover:border-muted-foreground"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Batas Waktu (Deadline)</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("flex-1 min-w-[150px] justify-start text-left font-body bg-secondary border-border", !deadlineDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {deadlineDate ? format(deadlineDate, "PPP") : "Pilih Tanggal"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={deadlineDate}
                            onSelect={setDeadlineDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <div className="flex items-center gap-1 bg-secondary border border-border rounded-md px-2">
                        <Select value={deadlineHour} onValueChange={setDeadlineHour}>
                          <SelectTrigger className="w-14 border-none bg-transparent focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(val => (
                              <SelectItem key={val} value={val}>{val}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">:</span>
                        <Select value={deadlineMinute} onValueChange={setDeadlineMinute}>
                          <SelectTrigger className="w-14 border-none bg-transparent focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["00", "15", "30", "45"].map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={deadlinePeriod} onValueChange={(v) => setDeadlinePeriod(v as "AM" | "PM")}>
                          <SelectTrigger className="w-16 border-none bg-transparent focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-heading h-12 text-lg">Buat Tugas</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* --- SECTIONS DENGAN FRAME --- */}
      <div className="grid gap-12">
        <Section title="Tugas Tersedia" count={openQuests.length} variant="default" icon={<ScrollIcon size={16}/>}>
          {openQuests.map(q => <QuestCard key={q.id} quest={q} />)}
        </Section>

        <Section title="Tugas Aktif" count={myActive.length} variant="active" icon={<Sword size={16}/>}>
          {myActive.map(q => <QuestCard key={q.id} quest={q} />)}
        </Section>

        <Section title="Menunggu Ulasan" count={mySubmitted.length} variant="review" icon={<Timer size={16}/>}>
          {mySubmitted.map(q => <QuestCard key={q.id} quest={q} />)}
        </Section>

        <Section title="Arsip Selesai" count={myCompleted.length} variant="completed" icon={<Archive size={16}/>}>
          {myCompleted.map(q => <QuestCard key={q.id} quest={q} />)}
        </Section>
      </div>
    </div>
  );
};

// --- Komponen Section tetap sama seperti sebelumnya (SectionProps, Section) ---
// (Paste kembali Section component di bawah sini seperti yang kamu punya)

export default QuestBoard;

// --- KOMPONEN SECTION (Taruh di bawah fungsi QuestBoard) ---
interface SectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  variant: "default" | "active" | "review" | "completed";
  icon: React.ReactNode;
}

const Section = ({ title, count, children, variant, icon }: SectionProps) => {
  const styles = {
    default: "border-border/40 bg-secondary/10 shadow-none",
    active: "border-blue-500/30 bg-blue-500/5 shadow-[inset_0_0_30px_rgba(59,130,246,0.03)]",
    review: "border-gold/30 bg-gold/5 shadow-[inset_0_0_30px_rgba(212,175,55,0.03)]",
    completed: "border-emerald-500/30 bg-emerald-500/5 shadow-[inset_0_0_30px_rgba(16,185,129,0.03)]",
  };

  const dotColors = {
    default: "bg-muted-foreground/40",
    active: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
    review: "bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]",
    completed: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative rounded-xl border p-6 pt-10 transition-all duration-300",
        styles[variant]
      )}
    >
      <div className="absolute -top-4 left-6 flex items-center gap-2.5 px-4 py-1.5 rounded-lg bg-background border border-inherit shadow-lg z-10">
        <span className={cn("text-foreground", variant === 'review' ? 'text-gold' : '')}>
          {icon}
        </span>
        <h2 className="font-heading text-sm tracking-widest uppercase text-foreground whitespace-nowrap">
          {title} <span className="ml-1 opacity-50 font-body text-xs lowercase">({count})</span>
        </h2>
        <span className={cn("w-1.5 h-1.5 rounded-full ml-1", dotColors[variant])} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 relative">
        <AnimatePresence mode="popLayout">
          {count === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-border/40 rounded-xl bg-background/40"
            >
              <div className="text-5xl mb-3 opacity-10 font-heading select-none italic text-gold">Kosong</div>
              <p className="text-muted-foreground font-body text-sm italic tracking-wide">Tidak ada catatan tugas ditemukan.</p>
            </motion.div>
          ) : (
            children
          )}
        </AnimatePresence>
      </div>

      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-inherit opacity-20" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-inherit opacity-20" />
    </motion.section>
  );
};