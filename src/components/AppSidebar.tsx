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
import { InvitationInbox } from "./InvitationInbox"; // 👈 Pastikan path import sesuai tempat lo save filenya

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
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          {!collapsed && (
            <div className="font-heading text-gold text-lg">
              ⚜️ Sovereign Guild
            </div>
          )}
          {collapsed && <div className="text-center text-xl">⚜️</div>}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-gold font-medium"
                    >
                      <span className="text-lg">{item.icon}</span>
                      {!collapsed && <span className="font-body">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3 space-y-2">
        {/* Profile & Invitation Section */}
        {currentUser && (
          <div className={`flex items-center gap-2 mb-2 p-1 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-2 overflow-hidden ${collapsed ? 'hidden' : ''}`}>
              <span className="text-2xl shrink-0">{currentUser.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-heading text-gold truncate">{currentUser.username}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
            </div>
            
            {/* Kotak Inbox Undangan */}
            <InvitationInbox />
          </div>
        )}

        {/* Role Switcher Button */}
        {canSwitch && (
          <Button 
            variant="outline" 
            size={collapsed ? "icon" : "sm"} 
            onClick={handleSwitchRole}
            className="w-full border-gold/30 hover:border-gold hover:bg-gold/10 text-gold transition-all"
            title={collapsed ? `Switch to ${isGM ? 'Adventurer' : 'Guild Master'}` : ""}
          >
            <RefreshCcw className={`h-4 w-4 ${collapsed ? "" : "mr-2"}`} />
            {!collapsed && (
              <span className="text-xs font-semibold">
                Ganti ke {isGM ? "Adventurer" : "Guild Master"}
              </span>
            )}
          </Button>
        )}

        {/* Logout Button */}
        <Button 
          variant="ghost" 
          size={collapsed ? "icon" : "default"} 
          onClick={logout} 
          className="w-full text-muted-foreground hover:text-crimson hover:bg-crimson/5"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2 font-body">Keluar</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;