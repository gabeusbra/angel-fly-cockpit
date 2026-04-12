import { Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import Sidebar from "./Sidebar";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

const COCKPIT_ROLES = ["admin", "pm", "professional", "client"];
const MAX_RETRIES = 6;
const RETRY_INTERVAL = 5000;

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

function SetupScreen({ retryCount }) {
  const progress = Math.min(((retryCount + 1) / MAX_RETRIES) * 100, 95);

  useEffect(() => {
    // Auto-reload the entire page every 10 seconds to get fresh auth data
    const timer = setTimeout(() => {
      window.location.reload();
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center" style={{ fontFamily: "var(--font-inter)" }}>
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
          <span className="text-white font-extrabold text-lg">AF</span>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Setting up your account</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your workspace is being configured. This usually takes a few seconds...
        </p>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
        </div>
        <p className="text-xs text-muted-foreground mb-4">Auto-refreshing...</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh Now</Button>
      </div>
    </div>
  );
}

async function resolveUser(authUser) {
  const email = authUser.email?.toLowerCase();
  if (!email) return authUser;

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

  return authUser;
}

export default function Layout() {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [blockType, setBlockType] = useState(null);
  const [checked, setChecked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryRef = useRef(null);
  const authUserRef = useRef(null);

  const checkUser = async (authUser) => {
    const finalUser = await resolveUser(authUser);

    if (finalUser.status === "inactive") {
      setBlockType("inactive");
      setUser(finalUser);
      setChecked(true);
      return true;
    }

    if (COCKPIT_ROLES.includes(finalUser.role)) {
      setUser(finalUser);
      setBlockType(null);
      setChecked(true);
      return true;
    }

    return false;
  };

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
      if (!authUser) { setUser(null); setChecked(true); return; }
      authUserRef.current = authUser;

      const resolved = await checkUser(authUser);
      if (!resolved) {
        // No valid role yet — start polling
        setBlockType("setting_up");
        setChecked(true);
      }
    });

    return () => { if (retryRef.current) clearInterval(retryRef.current); };
  }, []);

  // Polling for role assignment
  useEffect(() => {
    if (blockType !== "setting_up" || !authUserRef.current) return;

    retryRef.current = setInterval(async () => {
      setRetryCount(prev => {
        const next = prev + 1;
        if (next >= MAX_RETRIES) {
          clearInterval(retryRef.current);
          setBlockType("no_role");
          return next;
        }
        return next;
      });

      const resolved = await checkUser(authUserRef.current);
      if (resolved && retryRef.current) {
        clearInterval(retryRef.current);
      }
    }, RETRY_INTERVAL);

    return () => { if (retryRef.current) clearInterval(retryRef.current); };
  }, [blockType]);

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

  if (blockType === "setting_up") {
    return <SetupScreen retryCount={retryCount} />;
  }

  if (blockType === "no_role") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ fontFamily: "var(--font-inter)" }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <span className="text-white font-extrabold text-lg">AF</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Almost there!</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your account is ready but your role is still being configured. Try refreshing, or contact your administrator.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>Refresh</Button>
            <Button variant="outline" onClick={() => base44.auth.logout()}>Sign Out</Button>
          </div>
        </div>
      </div>
    );
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
