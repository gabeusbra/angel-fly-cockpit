import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Sidebar from "./Sidebar";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
      // Check if user is deactivated
      if (authUser?.id) {
        try {
          const users = await base44.entities.User.filter({ id: authUser.id });
          const dbUser = users[0];
          if (dbUser?.status === "inactive") {
            setBlocked(true);
            setUser(authUser);
            return;
          }
        } catch {
          // If we can't check, let them through
        }
      }
      setUser(authUser);
    });
  }, []);

  if (blocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ fontFamily: "var(--font-inter)" }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Access Deactivated</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your account has been deactivated. Please contact your administrator for assistance.
          </p>
          <Button variant="outline" onClick={() => base44.auth.logout()}>
            Sign Out
          </Button>
        </div>
      </div>
    );
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
