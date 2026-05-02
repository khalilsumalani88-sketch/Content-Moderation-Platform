import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import {
  LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Store, Menu, X,
  Sparkles, Gift, TrendingUp, CreditCard, Shield
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/settings", label: "Settings", icon: Settings },
];

const growthItems = [
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/ai-tools", label: "AI Tools", icon: Sparkles },
  { href: "/growth", label: "Growth Tools", icon: TrendingUp },
  { href: "/referrals", label: "Referrals", icon: Gift },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);

  function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<any> }) {
    const active = location === href || (href !== "/dashboard" && location.startsWith(href));
    return (
      <Link key={href} href={href}>
        <a
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {label}
        </a>
      </Link>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden" data-testid="dashboard-layout">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="sidebar"
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">StoreLink</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => <NavItem key={item.href} {...item} />)}
          </div>

          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">Growth</p>
            <div className="space-y-1">
              {growthItems.map((item) => <NavItem key={item.href} {...item} />)}
            </div>
          </div>

          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">Platform</p>
            <div className="space-y-1">
              {adminItems.map((item) => <NavItem key={item.href} {...item} />)}
            </div>
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
              {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent text-sm"
            onClick={() => signOut({ redirectUrl: "/" })}
            data-testid="button-signout"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <span className="font-bold text-sidebar-foreground">StoreLink</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
