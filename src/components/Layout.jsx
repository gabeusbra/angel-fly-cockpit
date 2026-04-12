import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Sidebar from "./Sidebar";
import { ShieldX, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const COCKPIT_ROLES = ["admin", "pm", "professional", "client"];

function BlockedScreen({ icon: Icon, iconBg, iconColor, title, message }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" style={{ fontFamily: "var(--font-inter)" }}>
      <div className="text-center max-w-md px-6">
        <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <Button variant="outline" onClick={() => base44.auth.logout()}>Sign Out</Button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [blockType, setBlockType] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
      if (!authUser) { setUser(null); setChecked(true); return; }

      // For admins: look up entity data to get the full picture
      // For regular users: auth.me() should include entity fields
      let finalUser = { ...authUser };

      // Try to enrich with entity data (works for admins, may fail for regular users)
      try {
        const allUsers = await base44.entities.User.list();
        const dbUser = allUsers.find(u =>
          u.email?.toLowerCase() === authUser.email?.toLowerCase()
        );
        if (dbUser) {
          finalUser = { ...authUser, ...dbUser };
        }
      } catch {
        // Regular users may not have list permission — that's OK,
        // auth.me() should already include their entity fields
      }

      // Check status
      if (finalUser.status === "inactive") {
        setBlockType("inactive");
        setUser(finalUser);
        setChecked(true);
        return;
      }

      // Check cockpit role
      if (COCKPIT_ROLES.includes(finalUser.role)) {
        setUser(finalUser);
        setChecked(true);
        return;
      }

      // No valid cockpit role — show pending
      setBlockType("no_role");
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

  if (blockType === "inactive") {
    return <BlockedScreen icon={ShieldX} iconBg="bg-red-100" iconColor="text-red-600"
      title="Access Deactivated"
      message="Your account has been deactivated. Please contact your administrator for assistance." />;
  }

  if (blockType === "no_role") {
    return <BlockedScreen icon={Clock} iconBg="bg-blue-100" iconColor="text-blue-600"
      title="Account Pending Setup"
      message="Your account has been created but an administrator still needs to assign your role. Please contact your administrator to get access." />;
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-inter)" }}>
      <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`transition-all duration-300 min-h-screen ${collapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        <div className="p-6 lg:p-8">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}
