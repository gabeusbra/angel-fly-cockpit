import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";

export default function PMTeam() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteType, setInviteType] = useState("professional");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.User.list(),
      base44.entities.Task.list(),
    ]).then(([u, t]) => { setUsers(u); setTasks(t); setLoading(false); });
  }, []);

  const load = async () => {
    const u = await base44.entities.User.list();
    setUsers(u);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError("");
    try {
      await base44.auth.inviteUser(inviteEmail, "user");
      // After invite, we need to wait for the user to appear and then update their role.
      // For now, show success — admin can assign the cockpit role from User Management.
      setShowInvite(false);
      setInviteEmail("");
      load();
    } catch (err) {
      setInviteError(err?.response?.data?.message || err?.message || "Failed to send invite");
    }
    setInviting(false);
  };

  const professionals = users.filter(u => u.role === "professional" && u.status === "active");
  const clients = users.filter(u => u.role === "client" && u.status === "active");

  const getStats = (userId) => {
    const myTasks = tasks.filter(t => t.assigned_to === userId);
    const active = myTasks.filter(t => t.status !== "done").length;
    const done = myTasks.filter(t => t.status === "done").length;
    const overdue = myTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
    const workload = myTasks.length > 0 ? Math.round((active / Math.max(myTasks.length, 1)) * 100) : 0;
    return { active, done, overdue, load: workload, total: myTasks.length };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Team & Clients" subtitle="View your professionals and client accounts">
        <Button onClick={() => { setInviteType("professional"); setShowInvite(true); }} className="gap-2"><Mail className="w-4 h-4" /> Invite Member</Button>
      </PageHeader>

      {/* Professionals */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Professionals ({professionals.length})
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-40 animate-pulse" />)}
          </div>
        ) : professionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {professionals.map(u => {
              const stats = getStats(u.id);
              return (
                <div key={u.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold">{u.full_name || "Professional"}</h3>
                      <p className="text-xs text-muted-foreground">{u.specialty || "No specialty"}</p>
                      {u.hourly_rate && <p className="text-xs text-muted-foreground">R${u.hourly_rate}/hr</p>}
                      {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full ${stats.load > 80 ? "bg-red-100 text-red-700" : stats.load > 50 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {stats.load}% load
                    </div>
                  </div>

                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(stats.load, 100)}%`, background: stats.load > 80 ? "#ef4444" : "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">{stats.active}</p>
                      <p className="text-[10px] text-muted-foreground">Active</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-600">{stats.done}</p>
                      <p className="text-[10px] text-muted-foreground">Done</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${stats.overdue > 0 ? "text-red-600" : ""}`}>{stats.overdue}</p>
                      <p className="text-[10px] text-muted-foreground">Overdue</p>
                    </div>
                  </div>

                  {stats.active > 5 && (
                    <p className="text-xs text-amber-600 mt-3 font-medium">High workload — consider redistributing tasks</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No professionals yet. Invite your first team member above.
          </div>
        )}
      </div>

      {/* Clients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Clients ({clients.length})
          </h3>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setInviteType("client"); setShowInvite(true); }}>
            <Mail className="w-3 h-3" /> Invite Client
          </Button>
        </div>
        {clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clients.map(u => (
              <div key={u.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                <h4 className="text-sm font-semibold">{u.full_name || "Client"}</h4>
                {u.company && <p className="text-xs text-muted-foreground">{u.company}</p>}
                {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No clients yet.
          </div>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite {inviteType === "professional" ? "Professional" : "Client"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Send an email invite. After they sign up, an admin can assign their cockpit role and details from User Management.
            </p>

            <Input type="email" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />

            <Select value={inviteType} onValueChange={setInviteType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>

            {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>{inviting ? "Sending..." : "Send Invite"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
