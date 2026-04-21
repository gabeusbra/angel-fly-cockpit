import { useOutletContext } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import AdminDashboard from "./AdminDashboard";
import PMDashboard from "./PMDashboard";
import ProDashboard from "./ProDashboard";
import ClientDashboard from "./ClientDashboard";

const COCKPIT_ROLES = ["admin", "pm", "professional", "client"];

function PendingAccess({ user }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Account Pending Setup</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Welcome, {user?.full_name || "there"}! Your account has been created but an administrator still needs to assign your role.
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Please contact your administrator to get access to your portal.
        </p>
        <Button variant="outline" onClick={() => api.auth.logout()}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function RoleRouter() {
  const { user } = useOutletContext();
  if (!user) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!COCKPIT_ROLES.includes(user.role)) return <PendingAccess user={user} />;
  if (user.role === "admin") return <AdminDashboard user={user} />;
  if (user.role === "pm") return <PMDashboard user={user} />;
  if (user.role === "professional") return <ProDashboard user={user} />;
  return <ClientDashboard user={user} />;
}
