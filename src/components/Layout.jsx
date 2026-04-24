import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "@/api/client";
import Sidebar from "./Sidebar";
import { Menu, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

const COCKPIT_ROLES = ["admin", "pm", "professional", "client"];

function BlockedScreen({ title, message }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <Button variant="outline" onClick={() => api.auth.logout()}>Sign Out</Button>
      </div>
    </div>
  );
}

async function resolveUser(authUser) {
  const email = authUser.email?.toLowerCase();
  if (!email) return authUser;

  // Try to get entity data (works for admins, may fail for regular users)
  const attempts = [
    () => api.entities.User.list(),
    () => api.entities.User.filter({ email: authUser.email }),
  ];

  for (const attempt of attempts) {
    try {
      const results = await attempt();
      const match = Array.isArray(results)
        ? results.find(u => u.email?.toLowerCase() === email)
        : null;
      if (match) {
        return { ...authUser, ...match, authId: authUser.id };
      }
    } catch {
      continue;
    }
  }

  // If entity lookup fails, return auth user as-is
  // The role will default to "client" in RoleRouter
  return authUser;
}

export default function Layout() {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api.auth.me().then(async (authUser) => {
      if (!authUser) { setUser(null); setChecked(true); return; }

      const finalUser = await resolveUser(authUser);

      // Only block inactive users — never block for missing role
      if (finalUser.status === "inactive") {
        setBlocked(true);
        setUser(finalUser);
        setChecked(true);
        return;
      }

      // If role is not a cockpit role, default to "client"
      // and schedule a one-time auto-reload to pick up the real role
      if (!COCKPIT_ROLES.includes(finalUser.role)) {
        finalUser.role = "client";

        // Auto-reload once after 5 seconds if we haven't already
        const reloadKey = "af_role_reload_" + (finalUser.email || "");
        if (!sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, "1");
          setTimeout(() => window.location.reload(), 5000);
        }
      }

      setUser(finalUser);
      setChecked(true);
    }).catch(err => {
      console.error("Layout auth me error:", err);
      setChecked(true); // Let AuthContext handle the redirect if it was an auth error
    });
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (blocked) {
    return <BlockedScreen title="Access Deactivated"
      message="Your account has been deactivated. Please contact your administrator for assistance." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-white/85 dark:bg-[#0d111d]/85 border-b border-black/10 dark:border-white/10 sticky top-0 z-30 glass">
        <div className="flex items-center gap-3">
          <img
            src="/branding/logo-angelfly.png"
            alt="Angel Fly"
            className="w-8 h-8 rounded-md object-cover border border-black/10 dark:border-white/10"
          />
          <span className="font-bold text-sm text-foreground tracking-tight">Angel Fly</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setMobileMenuOpen(true)}
          className="text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <Sidebar 
        user={user} 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(!collapsed)} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <main className={`transition-all duration-300 min-h-screen flex-1 min-w-0 ${collapsed ? "md:ml-[96px]" : "md:ml-[272px]"}`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}
