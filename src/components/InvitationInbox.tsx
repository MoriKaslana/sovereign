import { useEffect, useState } from "react";
import { useGame } from "@/context/GameContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Mail, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function InvitationInbox() {
  const { currentUser, acceptInvite } = useGame();
  const [invites, setInvites] = useState<any[]>([]);

  const fetchInvites = async () => {
    if (!currentUser?.email) return;
    
    // Kita ambil data invite + nama pengundangnya
    const { data, error } = await supabase
      .from("invitations")
      .select(`
        id, 
        guild_id, 
        status, 
        inviter_id,
        users!invitations_inviter_id_fkey ( username )
      `)
      .eq("invitee_email", currentUser.email)
      .eq("status", "pending");

    if (!error) setInvites(data || []);
  };

useEffect(() => {
    fetchInvites();

    // TAHAP 1: Matikan Realtime karena PostgREST lokal tidak support WebSocket/Channel
    // Kita komentari dulu agar tidak bikin PostgREST Timeout
    /*
    const channel = supabase
      .channel("realtime_invites")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "invitations",
        filter: `invitee_email=eq.${currentUser?.email}`
      }, () => {
        fetchInvites();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    */
  }, [currentUser]);

  if (invites.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors group">
          <Mail className="h-5 w-5 text-gold group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-bold animate-bounce">
            {invites.length}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-[#0a0a0b] border-gold/30 p-0 shadow-2xl shadow-black" align="end">
        <div className="p-3 border-b border-white/10 bg-gold/5">
          <h4 className="text-[10px] font-heading text-gold uppercase tracking-[2px]">Incoming Summons</h4>
        </div>
        <div className="max-h-[250px] overflow-y-auto">
          {invites.map((invite) => (
            <div key={invite.id} className="p-3 border-b border-white/5 last:border-0">
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                <span className="text-white font-bold">{invite.users?.username || "A Guild Master"}</span> memanggil lo untuk bergabung ke Guild mereka.
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="h-7 flex-1 bg-gold text-black hover:bg-gold/80 text-[10px] font-bold"
                  onClick={() => acceptInvite(invite.id, invite.guild_id)}
                >
                  ACCEPT
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 px-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}