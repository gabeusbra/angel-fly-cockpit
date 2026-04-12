import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { filterMyRecords, safeList } from "@/lib/entity-helpers";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function ClientProjects() {
  const { user } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      filterMyRecords(base44.entities.Project, "client_id", user, "client_name"),
      safeList(base44.entities.Task),
    ]).then(([p, t]) => { setProjects(p); setTasks(t); setLoading(false); });
  }, [user]);

  const getProgress = (pid) => {
    const t = tasks.filter(t => t.project_id === pid);
    if (!t.length) return 0;
    return Math.round((t.filter(t => t.status === "done").length / t.length) * 100);
  };

  const getProjectTasks = (pid) => tasks.filter(t => t.project_id === pid);

  return (
    <div className="space-y-6">
      <PageHeader title="My Projects" subtitle="View your project status and deliverables" />

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-28 animate-pulse" />)}</div>
      ) : projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map(p => {
            const prog = getProgress(p.id);
            const pTasks = getProjectTasks(p.id);
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 cursor-pointer" onClick={() => setExpanded(isOpen ? null : p.id)}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{p.name}</h3>
                        <StatusBadge status={p.status} size="xs" />
                      </div>
                      {p.scope_description && <p className="text-xs text-muted-foreground line-clamp-2">{p.scope_description}</p>}
                    </div>
                    <span className="text-lg font-bold text-primary">{prog}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {p.start_date && <span>Start: {new Date(p.start_date).toLocaleDateString()}</span>}
                    {p.end_date && <span>End: {new Date(p.end_date).toLocaleDateString()}</span>}
                    <span>{pTasks.length} tasks</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border p-5 bg-muted/20">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Task Overview</h4>
                    {pTasks.length > 0 ? (
                      <div className="space-y-2">
                        {pTasks.map(t => (
                          <div key={t.id} className="flex items-center justify-between py-1.5">
                            <span className="text-sm">{t.title}</span>
                            <div className="flex gap-2">
                              <StatusBadge status={t.priority} size="xs" />
                              <StatusBadge status={t.status} size="xs" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No tasks yet</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">No projects yet</div>
      )}
    </div>
  );
}
