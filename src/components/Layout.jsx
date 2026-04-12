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

async function findUserRecord(authUser) {
  // Try multiple approaches to find the user entity record
  const email = authUser.email?.toLowerCase();
  if (!email) return null;

  // Approach 1: list all users (works for admins)
  try {
    const allUsers = await base44.entities.User.list();
    const match = allUsers.find(u => u.email?.toLowerCase() === email);
    if (match) return match;
  } catch {
    // May fail for non-admin users
  }

  // Approach 2: filter by email directly
  try {
    const filtered = await base44.entities.User.filter({ email: authUser.email });
    if (filtered.length > 0) return filtered[0];
  } catch {
    // May also fail
  }

  return null;
}

export default function Layout() {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [blockType, setBlockType] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
      if (!authUser) { setUser(null); setChecked(true); return; }

      const dbUser = await findUserRecord(authUser);

      if (!dbUser) {
        setBlockType("deleted");
        setUser(authUser);
        setChecked(true);
        return;
      }

      if (dbUser.status === "inactive") {
        setBlockType("inactive");
        setUser(authUser);
        setChecked(true);
        return;
      }

      if (!COCKPIT_ROLES.includes(dbUser.role)) {
        setBlockType("no_role");
        setUser(authUser);
        setChecked(true);
        return;
      }

      // Valid user — merge entity data
      setUser({
        ...authUser,
        role: dbUser.role,
        specialty: dbUser.specialty,
        hourly_rate: dbUser.hourly_rate,
        company: dbUser.company,
        phone: dbUser.phone,
        status: dbUser.status,
      });
      setChecked(true);
    });
  }, []);

  // Show loading until check completes — never let anyone through unchecked
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

  if (blockType === "deleted") {
    return <BlockedScreen icon={ShieldX} iconBg="bg-red-100" iconColor="text-red-600"
      title="Access Denied"
      message="Your account has been removed from the system. Please contact your administrator." />;
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
