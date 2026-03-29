import { useGame } from "@/context/GameContext"; // 👈 Sesuaikan path-nya ke file GameContext lo
import { toast } from "sonner";

export function RoleSwitcher() {
  const { currentUser, switchRole } = useGame();

  if (!currentUser) return null;

  // 1. Cek apakah user punya kedua role (biar tombolnya gak mubazir)
  const canSwitch = currentUser.isGuildMaster && currentUser.isAdventurer;

  if (!canSwitch) {
    return (
      <div className="text-xs text-gray-400 p-3 bg-white/5 rounded-lg border border-dashed border-gray-700">
        💡 Akun ini cuma punya 1 role. Daftarkan email ini ke role satunya lagi pas Register biar bisa ganti role!
      </div>
    );
  }

  // 2. Tentukan target role berikutnya
  const targetRole = currentUser.role === "guild_master" ? "adventurer" : "guild_master";
  const targetLabel = targetRole === "guild_master" ? "Guild Master" : "Adventurer";
  const icon = targetRole === "guild_master" ? "👑" : "⚔️";

  return (
    <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm">
      <p className="text-xs text-gray-500 mb-2">Role Aktif: <span className="text-white font-bold">{currentUser.role}</span></p>
      
      <button
        onClick={() => switchRole(targetRole)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-semibold shadow-md"
      >
        <span>{icon}</span>
        Switch ke {targetLabel}
      </button>
    </div>
  );
}