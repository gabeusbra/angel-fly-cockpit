import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext, useNavigate } from "react-router-dom";
import { FolderKanban, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { filterMyRecords, safeList } from "@/lib/entity-helpers";
import StatusBadge from "../components/StatusBadge";

export default function ProProjects() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const myTasks = await filterMyRecords(base44.entities.Task, "assigned_to", user, "assigned_to_name");
      setTasks(myTasks);
      const projectIds = [...new Set(myTasks.map(t => t.project_id).filter(Boolean))];
      if (projectIds.length > 0) {
        const allProjects = await safeList(base44.entities.Project);
        setProjects(allProjects.filter(p => projectIds.includes(p.id)));
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  const getMyTasks = (pid) => tasks.filter(t => t.project_id === pid);

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalProjects > 0 ? `${totalProjects} project${totalProjects !== 1 ? "s" : ""} · ${doneTasks}/${totalTasks} tasks completed` : "No projects assigned yet"}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-48 animate-pulse" />)}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => {
            const myTasks = getMyTasks(p.id);
            const done = myTasks.filter(t => t.status === "done").length;
            const active = myTasks.filter(t => t.status === "in_progress").length;
            const overdue = myTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
            const progress = myTasks.length > 0 ? Math.round((done / myTasks.length) * 100) : 0;

            return (
              <div key={p.id}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-black/5 transition-all cursor-pointer group"
                onClick={() => navigate(`/pro/projects/${p.id}`)}>

                {/* Project header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, #FF4D35, #FFB74D)" }}>
                      <FolderKanban className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold group-hover:text-primary transition-colors">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{p.client_name}</p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} size="xs" />
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{done}/{myTasks.length} tasks</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-muted/30 rounded-lg py-2">
                    <p className="text-base font-bold text-amber-600">{active}</p>
                    <p className="text-[10px] text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg py-2">
                    <p className="text-base font-bold text-emerald-600">{done}</p>
                    <p className="text-[10px] text-muted-foreground">Done</p>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg py-2">
                    <p className={`text-base font-bold ${overdue > 0 ? "text-red-600" : "text-muted-foreground"}`}>{overdue}</p>
                    <p className="text-[10px] text-muted-foreground">Overdue</p>
                  </div>
                </div>

                {/* Task list preview */}
                <div className="space-y-1.5">
                  {myTasks.slice(0, 3).map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${t.status === "done" ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                      <span className={`flex-1 truncate ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                      <StatusBadge status={t.priority} size="xs" />
                    </div>
                  ))}
                  {myTasks.length > 3 && <p className="text-[10px] text-muted-foreground pl-5">+{myTasks.length - 3} more tasks</p>}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  {p.end_date ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Due {new Date(p.end_date).toLocaleDateString()}</span>
                    </div>
                  ) : <span />}
                  <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <FolderKanban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1">Projects will appear here when tasks are assigned to you</p>
        </div>
      )}
    </div>
  );
}
