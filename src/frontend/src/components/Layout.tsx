import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Archive,
  Bell,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

export type Page =
  | "dashboard"
  | "contacts"
  | "campaigns"
  | "mission"
  | "archive";

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  activeCampaignName?: string;
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "campaigns", label: "Campaigns", icon: Zap },
  { id: "mission", label: "Mission Runner", icon: MessageSquare },
  { id: "archive", label: "Archive", icon: Archive },
];

export function Layout({
  children,
  currentPage,
  onNavigate,
  activeCampaignName,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 z-10",
          sidebarOpen ? "w-64" : "w-16",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border min-h-[64px]">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-primary leading-tight">
                KAHANAT
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                WA BOT
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.link`}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors relative",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    active && "text-primary",
                  )}
                />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && item.id === "mission" && activeCampaignName && (
                  <Badge className="ml-auto text-[10px] py-0 h-4 bg-primary text-primary-foreground">
                    LIVE
                  </Badge>
                )}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="px-4 pb-4 text-[10px] text-muted-foreground">
            <p>Created by Malverin</p>
            <p className="text-[9px] opacity-50 mt-0.5">v1.0.0</p>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm min-h-[64px]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground"
            data-ocid="nav.menu.toggle"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </Button>

          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">
              {NAV_ITEMS.find((n) => n.id === currentPage)?.label}
            </h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            data-ocid="nav.notification.button"
          >
            <Bell className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              M
            </div>
            <span className="text-sm text-foreground hidden sm:block">
              Malverin
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
