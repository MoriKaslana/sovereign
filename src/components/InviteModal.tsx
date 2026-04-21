import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";

const InviteModal = () => {
  const { sendInvite } = useGame();
  const [email, setEmail] = useState("");
  const [result, setResult] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendInvite(email);
    setEmail("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-heading border-gold/30 text-gold hover:bg-gold/10">
          <UserPlus className="h-4 w-4 mr-1" /> Undang
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-gold">Undang Adventurer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            placeholder="Adventurer's email..."
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            type="email"
            className="bg-secondary"
          />
          {result && <p className="text-sm text-muted-foreground font-body">{result}</p>}
          <Button type="submit" className="w-full font-heading">Kirim Undangan</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
