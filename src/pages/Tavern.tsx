import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Lock } from "lucide-react";
import { TutorialOverlay } from "@/components/TutorialOverlay";

const Tavern = () => {
  const { chatMessages, sendMessage, currentUser } = useGame();
  const [msg, setMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- LOGIKA TUTORIAL (SINGKAT 1 STEP) ---
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (currentUser?.guildId) {
      const hasSeen = localStorage.getItem(`tavern_tutorial_done_${currentUser.id}`);
      if (!hasSeen) {
        setShowTutorial(true);
      }
    }
  }, [currentUser]);

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(`tavern_tutorial_done_${currentUser?.id}`, "true");
  };

  // Auto scroll ke pesan terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    sendMessage(msg.trim());
    setMsg("");
  };

  if (!currentUser?.guildId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-10 text-center opacity-60">
        <Lock className="h-12 w-12 mb-4 text-gold" />
        <h2 className="text-xl font-heading text-gold mb-2">Akses Terbatas</h2>
        <p className="font-body text-sm text-white/70">
          Kamu harus bergabung dengan Guild terlebih dahulu untuk memasuki Tavern rahasia ini.
        </p>
      </div>
    );
  }

  // --- CONFIG TUTORIAL ---
  // Kita ubah targetId-nya ke 'tavern-header-box'
  const tutorialStep = {
    targetId: "tavern-header-box", 
    title: "🍻 Tavern Guild",
    text: "Selamat datang di Warkop Ngumpul! Gunakan tempat ini untuk berkoordinasi strategi quest, berbagi cerita, atau sekadar berbincang santai dengan sesama anggota Guild secara real-time."
  };

  return (
    // ID Utama biarin aja buat layout, tapi bukan buat target tutorial
    <div id="tavern-container" className="flex flex-col h-[calc(100vh-3rem)] max-w-3xl mx-auto relative overflow-hidden">
      
      {/* Overlay Tutorial - Sekarang menyorot Header */}
      <TutorialOverlay 
        isOpen={showTutorial}
        targetId={tutorialStep.targetId}
        title={tutorialStep.title}
        text={tutorialStep.text}
        currentStep={0}
        totalSteps={1}
        onNext={finishTutorial}
        onPrev={() => {}}
        onSkip={finishTutorial}
      />

      {/* Header Halaman - KITA KASIH ID DI SINI SEBAGAI TARGET */}
      <div className="p-6 pb-3 border-b border-border bg-background" id="tavern-header-box">
        <h1 className="font-heading text-2xl text-gold uppercase tracking-tighter flex items-center gap-2">
          🍻 Warkop Ngumpul
        </h1>
        <p className="text-muted-foreground text-sm font-body italic mt-1 leading-relaxed relative z-10">
          "Tempat berbagi cerita, strategi, dan canda tawa di antara sela-sela Quest."
        </p>
      </div>

      {/* Area Pesan Chat - Tambah padding top dikit */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar"
      >
        {chatMessages.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground font-body text-sm italic">
              Meja-meja masih kosong... <br /> Jadilah yang pertama memulai percakapan di Tavern ini!
            </p>
          </div>
        ) : (
          chatMessages.map((m) => {
            const isMine = m.user_id === currentUser?.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: isMine ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-start gap-3 ${isMine ? "flex-row-reverse" : ""}`}
              >
                <div className="text-2xl shrink-0 bg-secondary/50 p-2 rounded-full border border-white/5">
                  {m.avatar || "👤"}
                </div>
                <div className={`scroll-card rounded-2xl px-4 py-2.5 max-w-[75%] border shadow-sm ${
                  isMine ? "border-gold/30 bg-gold/5" : "border-border bg-secondary/20"
                }`}>
                  <div className={`text-[10px] font-heading mb-1 ${isMine ? "text-gold text-right" : "text-emerald-glow"}`}>
                    {m.username}
                  </div>
                  <p className="text-sm text-foreground font-body leading-relaxed">{m.content}</p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Form Input Chat */}
      <form 
        onSubmit={handleSend} 
        className="p-4 bg-background border-t border-border flex gap-2 sticky bottom-0 z-10"
      >
        <Input
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Tulis pesanmu..."
          className="bg-secondary/50 border-white/10 focus-visible:ring-gold/50"
        />
        <Button type="submit" size="icon" className="bg-gold hover:bg-gold/80 text-black">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default Tavern;