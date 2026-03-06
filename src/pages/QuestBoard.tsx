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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import QuestCard from "@/components/QuestCard";
import InviteModal from "@/components/InviteModal";

const QuestBoard = () => {
  const { currentUser, quests, createQuest } = useGame();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [diff, setDiff] = useState<QuestDifficulty>("medium");
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [deadlineHour, setDeadlineHour] = useState("12");
  const [deadlineMinute, setDeadlineMinute] = useState("00");
  const [open, setOpen] = useState(false);

  const isGM = currentUser?.role === "guild_master";

  const openQuests = quests.filter(q => q.status === "open");
  const myActive = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "accepted");
  const mySubmitted = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "submitted");
  const myCompleted = quests.filter(q => q.assignedTo === currentUser?.id && q.status === "completed");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadlineDate) return;
    const deadline = new Date(deadlineDate);
    deadline.setHours(parseInt(deadlineHour), parseInt(deadlineMinute), 0, 0);
    const deadlineMs = deadline.getTime();
    createQuest(title, desc, diff, deadlineMs);
    setTitle(""); setDesc(""); setDeadlineDate(undefined); setOpen(false);
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
                    <Label>Deadline</Label>
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
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i).padStart(2, "0")}>
                              {String(i).padStart(2, "0")}
                            </SelectItem>
                          ))}
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
                    </div>
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
