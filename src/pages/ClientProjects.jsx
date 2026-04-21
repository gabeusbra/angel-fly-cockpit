import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { useOutletContext } from "react-router-dom";
import { FolderKanban, Clock, CheckCircle2 } from "lucide-react";
import { filterMyRecords, safeList } from "@/lib/entity-helpers";
import StatusBadge from "../components/StatusBadge";

export default function ClientProjects() {
  const { user } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      filterMyRecords(api.entities.Project, "client_id", user, "client_name"),
      safeList(api.entities.Task),
    ]).then(([p, t]) => { setProjects(p); setTasks(t); setLoading(false); });
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-6 h-32 animate-pulse" />)}</div>
      ) : projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map(p => {
            const pTasks = tasks.filter(t => t.project_id === p.id);
            const done = pTasks.filter(t => t.status === "done").length;
            const progress = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;
            const daysLeft = p.end_date ? Math.ceil((new Date(p.end_date) - new Date()) / 86400000) : null;
            const inReview = pTasks.filter(t => t.status === "client_approval").length;

            return (
              <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Status bar */}
                <div className={`h-1 ${p.status === "active" ? "bg-emerald-500" : p.status === "paused" ? "bg-amber-500" : "bg-blue-500"}`} />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #FF4D35, #FFB74D)" }}>
                        <FolderKanban className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold">{p.name}</h3>
                        {p.scope_description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.scope_description}</p>}
                      </div>
                    </div>
                    <StatusBadge status={p.status} size="xs" />
                  </div>

                  {/* Progress */}
                  {pTasks.length > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                      </div>
                    </div>
                  )}

                  {/* Info row */}
                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    {p.end_date && (
                      <div className={`flex items-center gap-1 ${daysLeft !== null && daysLeft < 0 ? "text-red-600 font-medium" : daysLeft !== null && daysLeft <= 7 ? "text-amber-600" : ""}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Delivery: {new Date(p.end_date).toLocaleDateString()}</span>
                        {daysLeft !== null && <span>({daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : daysLeft === 0 ? "today" : `${daysLeft}d`})</span>}
                      </div>
                    )}
                    {pTasks.length > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{done}/{pTasks.length} completed</span>
                      </div>
                    )}
                    {inReview > 0 && (
                      <a href="/client/approvals" className="text-primary font-medium hover:underline">
                        {inReview} awaiting your approval
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <FolderKanban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your projects will appear here once your team sets them up</p>
        </div>
      )}
    </div>
  );
}
