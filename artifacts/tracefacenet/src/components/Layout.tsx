import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, UserPlus, ScanFace, Bell, ShieldAlert, LogOut } from "lucide-react";
import { useGetStats } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: stats } = useGetStats();

  const navItems = [
    { href: "/", label: "Command Center", icon: LayoutDashboard },
    { href: "/missing-persons", label: "Registry Database", icon: Users },
    { href: "/missing-persons/new", label: "Log New Case", icon: UserPlus },
    { href: "/search", label: "Biometric Search", icon: ScanFace },
    { 
      href: "/alerts", 
      label: "System Alerts", 
      icon: Bell, 
      badge: stats?.pendingAlerts ? stats.pendingAlerts : undefined 
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden tech-grid">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 glass-panel border-r border-y-0 border-l-0 z-10 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <ShieldAlert className="w-6 h-6 text-primary mr-3" />
          <span className="font-display font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            TRACEFACENET
          </span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 px-3">
            Operations
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent"
              )}>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                )}
                <item.icon className={cn("w-5 h-5 mr-3 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20">
            <LogOut className="w-5 h-5 mr-3" />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 flex items-center justify-between px-8 glass-panel border-b border-x-0 border-t-0 z-10 sticky top-0">
          <div className="flex items-center text-sm text-muted-foreground font-medium">
            <span className="uppercase tracking-wider">Secure Connection Active</span>
            <span className="mx-2 text-primary">•</span>
            <span className="text-primary/70 animate-pulse">Node: TFN-Alpha-9</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right mr-2 hidden md:block">
              <div className="text-sm font-semibold text-foreground">Agent K. Vance</div>
              <div className="text-xs text-primary/80">Clearance Level 4</div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 p-0.5 bg-background shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" alt="User avatar" className="w-full h-full rounded-full object-cover opacity-80 mix-blend-luminosity" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
