import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Sidebar from "./Sidebar";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

const COCKPIT_ROLES = ["admin", "pm", "professional", "client"];

function BlockedScreen({ title, message }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" style={{ fontFamily: "var(--font-inter)" }}>
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <Button variant="outline" onClick={() => base44.auth.logout()}>Sign Out</Button>
      </div>
    </div>
  );
}

async function resolveUser(authUser) {
  const email = authUser.email?.toLowerCase();
  if (!email) return authUser;

  // Try to get entity data (works for admins, may fail for regular users)
  const attempts = [
    () => base44.entities.User.list(),
    () => base44.entities.User.filter({ email: authUser.email }),
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
  const [blocked, setBlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
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
      // This handles: role="user" (Base44 default), role=undefined, etc.
      if (!COCKPIT_ROLES.includes(finalUser.role)) {
        finalUser.role = "client";
      }

      setUser(finalUser);
      setChecked(true);
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
    <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-inter)" }}>
      <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`transition-all duration-300 min-h-screen ${collapsed ? "ml-[68px]" : "ml-[260px]"}`}>
        <div className="p-6 lg:p-8">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}
