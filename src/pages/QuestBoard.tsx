import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, QuestDifficulty, Quest } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QuestCard from "@/components/QuestCard";
import InviteModal from "@/components/InviteModal";

const QuestBoard = () => {
  const { currentUser, quests, createQuest } = useGame();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [diff, setDiff] = useState<QuestDifficulty>("medium");
  const [hours, setHours] = useState(24);
  const [open, setOpen] = useState(false);

  const isGM = currentUser?.role === "guild_master";

  const openQuests = quests.filter(q => q.status === "open");
  const myActive = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "accepted");
  const mySubmitted = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "submitted");
  const myCompleted = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "completed");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createQuest(title, desc, diff, hours);
    setTitle(""); setDesc(""); setOpen(false);
  };

  const diffColors: Record<QuestDifficulty, string> = {
    easy: "text-emerald-glow",
    medium: "text-gold",
    hard: "text-crimson",
    legendary: "text-royal-purple",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl text-gold">📜 Quest Board</h1>
        <div className="flex gap-2">
          {isGM && <InviteModal />}
          {isGM && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="font-heading">+ Post Quest</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-heading text-gold">Post New Quest</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label>Quest Title</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-secondary" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={desc} onChange={e => setDesc(e.target.value)} required className="bg-secondary" />
                  </div>
                  <div>
                    <Label>Difficulty</Label>
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
                    <Label>Deadline (hours)</Label>
                    <Input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} min={1} className="bg-secondary" />
                  </div>
                  <Button type="submit" className="w-full font-heading">Dispatch Quest</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Open Quests */}
      <Section title="Available Quests" count={openQuests.length}>
        {openQuests.map(q => <QuestCard key={q.id} quest={q} />)}
      </Section>

      <Section title="Active Quests" count={myActive.length}>
        {myActive.map(q => <QuestCard key={q.id} quest={q} />)}
      </Section>
      <Section title="Submitted (Awaiting Review)" count={mySubmitted.length} glow="gold">
        {mySubmitted.map(q => <QuestCard key={q.id} quest={q} />)}
      </Section>
      <Section title="Completed" count={myCompleted.length} glow="green">
        {myCompleted.map(q => <QuestCard key={q.id} quest={q} />)}
      </Section>
    </div>
  );
};

const Section = ({ title, count, children, glow }: { title: string; count: number; children: React.ReactNode; glow?: "gold" | "green" }) => (
  <div className="mb-8">
    <h2 className="font-heading text-lg text-foreground mb-3 flex items-center gap-2">
      {title}
      <span className="text-sm text-muted-foreground font-body">({count})</span>
    </h2>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {count === 0 && (
          <p className="text-muted-foreground font-body col-span-full text-center py-8">No quests here yet.</p>
        )}
        {children}
      </AnimatePresence>
    </div>
  </div>
);

export default QuestBoard;
