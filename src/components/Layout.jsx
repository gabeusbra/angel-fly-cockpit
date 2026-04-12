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
  const [blockType, setBlockType] = useState(null); // "inactive" | "no_role" | "deleted"

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
      if (!authUser) { setUser(null); return; }

      try {
        const allUsers = await base44.entities.User.list();
        const dbUser = allUsers.find(u =>
          u.email?.toLowerCase() === authUser.email?.toLowerCase()
        );

        if (!dbUser) {
          // User was deleted from entity — block
          setBlockType("deleted");
          setUser(authUser);
          return;
        }

        if (dbUser.status === "inactive") {
          setBlockType("inactive");
          setUser(authUser);
          return;
        }

        if (!COCKPIT_ROLES.includes(dbUser.role)) {
          setBlockType("no_role");
          setUser(authUser);
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
      } catch {
        setUser(authUser);
      }
    });
  }, []);

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
