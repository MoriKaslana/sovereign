import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Lock } from "lucide-react";

const Tavern = () => {
  const { chatMessages, sendMessage, currentUser } = useGame();
  const [msg, setMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    sendMessage(msg.trim());
    setMsg("");
  };

  // Proteksi: Jika user belum memiliki Guild
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

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] max-w-3xl mx-auto">
      <div className="p-6 pb-0">
        <h1 className="font-heading text-2xl text-gold">🍻 Warkop Ngumpul</h1>
        <p className="text-muted-foreground text-sm font-body">Ceritakan Kisah mu Wahai para Adventurer</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {chatMessages.length === 0 && (
          <p className="text-center text-muted-foreground font-body py-12">Meja masih kosong... Jadilah yang pertama untuk bercerita!</p>
        )}
        {chatMessages.map(m => {
          // DISESUAIKAN: Menggunakan user_id dari Supabase
          const isMine = m.user_id === currentUser?.id;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${isMine ? "flex-row-reverse" : ""}`}
            >
              <div className="text-2xl shrink-0">{m.avatar || "👤"}</div>
              <div className={`scroll-card rounded-lg px-4 py-2.5 max-w-[70%] ${isMine ? "border-gold/20" : ""}`}>
                <div className="text-xs text-gold font-heading mb-1">{m.username}</div>
                {/* DISESUAIKAN: Menggunakan content dari Supabase */}
                <p className="text-sm text-foreground font-body">{m.content}</p>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
        <Input
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Berbincanglah dengan sesama adventurer..."
          className="bg-secondary flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default Tavern;