import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Gavel } from "lucide-react";
import { User } from "@/context/GameContext"; // Pastikan path import User bener

interface ExileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  member: User | null;
}

const ExileDialog: React.FC<ExileDialogProps> = ({ isOpen, onClose, onConfirm, member }) => {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader className="items-center text-center">
          <div className="bg-red-500/10 p-3 rounded-full mb-2 border border-red-500/20">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <DialogTitle className="font-heading text-xl text-red-400">
            Judgment of Exile
          </DialogTitle>
          <DialogDescription className="font-body text-muted-foreground pt-2">
            Guild Master, you are about to banish <span className="text-foreground font-bold">{member.username}</span> {member.avatar} from the <span className="text-gold font-bold">Sovereign Guild</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-secondary/50 p-4 rounded-md border border-border my-2">
          <p className="text-xs text-muted-foreground font-body leading-relaxed text-center">
            Their guild marks will be stripped, and they will become a wanderer once more. This decree is immediate and irrevocable.
          </p>
        </div>

        <DialogFooter className="sm:justify-center gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="font-heading border-border">
            Mercy
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="font-heading gap-2 bg-red-600 hover:bg-red-700">
            <Gavel className="h-4 w-4" />
            Seal Fate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExileDialog;