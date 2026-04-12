import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function PMTeam() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.User.filter({ role: "professional", status: "active" }),
      base44.entities.Task.list(),
    ]).then(([u, t]) => { setUsers(u); setTasks(t); setLoading(false); });
  }, []);

  const getStats = (userId) => {
    const myTasks = tasks.filter(t => t.assigned_to === userId);
    const active = myTasks.filter(t => t.status !== "done").length;
    const done = myTasks.filter(t => t.status === "done").length;
    const overdue = myTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
    const load = myTasks.length > 0 ? Math.round((active / Math.max(myTasks.length, 1)) * 100) : 0;
    return { active, done, overdue, load, total: myTasks.length };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Team Overview" subtitle="Professional workload and performance" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-40 animate-pulse" />)}
        </div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map(u => {
            const stats = getStats(u.id);
            return (
              <div key={u.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold">{u.full_name}</h3>
                    <p className="text-xs text-muted-foreground">{u.specialty || "Professional"}</p>
                    {u.hourly_rate && <p className="text-xs text-muted-foreground">R${u.hourly_rate}/hr</p>}
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
                  <p className="text-xs text-amber-600 mt-3 font-medium">⚠ High workload — consider redistributing tasks</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
          No active professionals found
        </div>
      )}
    </div>
  );
}