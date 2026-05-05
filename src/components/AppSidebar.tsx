import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useGame } from "@/context/GameContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCcw } from "lucide-react";
import { InvitationInbox } from "./InvitationInbox";

const AppSidebar = () => {
  const { currentUser, logout, switchRole } = useGame();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isGM = currentUser?.role === "guild_master";
  const canSwitch = currentUser?.isGuildMaster && currentUser?.isAdventurer;

  const navItems = [
    { title: "Papan Tugas", url: "/quests", icon: "📜" },
    ...(isGM ? [{ title: "Papan Ulasan", url: "/review", icon: "⚖️" }] : []),
    { title: "Warkop Ngumpul", url: "/tavern", icon: "🍻" },
    { title: "Naskah Guild", url: "/codex", icon: "📖" },
    { title: "Aula", url: "/fame", icon: "🏆" },
    { title: "Profil", url: "/profile", icon: "👤" },
  ];

  const handleSwitchRole = () => {
    if (!currentUser) return;
    const targetRole = currentUser.role === "guild_master" ? "adventurer" : "guild_master";
    switchRole(targetRole);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border transition-all duration-300 ease-in-out">
      <SidebarContent>
        <div className="p-4 border-b border-border flex items-center justify-center h-16">
          {!collapsed ? (
            <div className="font-heading text-gold text-lg truncate animate-in fade-in duration-500">
              ⚜️ Sovereign Guild
            </div>
          ) : (
            <div className="text-xl animate-in zoom-in duration-300">⚜️</div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-gold font-medium"
                    >
                      {/* Container Ikon diperbaiki agar tidak terpotong (shrink-0) */}
                      <span className="text-xl shrink-0 flex items-center justify-center w-6">
                        {item.icon}
                      </span>
                      
                      {/* Teks dengan transisi smooth */}
                      <span className={`font-body transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
                        collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                      }`}>
                        {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3 space-y-3 transition-all duration-300">
        {currentUser && (
          <div className={`flex items-center gap-2 p-1 rounded-lg bg-secondary/20 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
              <span className="text-2xl shrink-0">{currentUser.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-heading text-gold truncate">{currentUser.username}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
            </div>
            
            <div className={`${collapsed ? 'scale-90 transition-transform' : ''}`}>
              <InvitationInbox />
            </div>
          </div>
        )}

        {canSwitch && (
          <Button 
            variant="outline" 
            size={collapsed ? "icon" : "sm"} 
            onClick={handleSwitchRole}
            className="w-full border-gold/30 hover:border-gold hover:bg-gold/10 text-gold transition-all duration-300 overflow-hidden"
          >
            <RefreshCcw className={`h-4 w-4 shrink-0 ${collapsed ? "" : "mr-2"}`} />
            {!collapsed && (
              <span className="text-[10px] font-bold uppercase truncate animate-in slide-in-from-left-2">
                Switch Role
              </span>
            )}
          </Button>
        )}

        <Button 
          variant="ghost" 
          size={collapsed ? "icon" : "default"} 
          onClick={logout} 
          className="w-full text-muted-foreground hover:text-crimson hover:bg-crimson/5 transition-all duration-300"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2 font-body animate-in fade-in">Keluar</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;