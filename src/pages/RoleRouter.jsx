import { useOutletContext } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import PMDashboard from "./PMDashboard";
import ProDashboard from "./ProDashboard";
import ClientDashboard from "./ClientDashboard";

export default function RoleRouter() {
  const { user } = useOutletContext();
  if (!user) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (user.role === "admin") return <AdminDashboard user={user} />;
  if (user.role === "pm") return <PMDashboard user={user} />;
  if (user.role === "professional") return <ProDashboard user={user} />;
  return <ClientDashboard user={user} />;
}