import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function ProProjects() {
  const { user } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.Task.filter({ assigned_to: user.id }).then(async (t) => {
      setTasks(t);
      const projectIds = [...new Set(t.map(task => task.project_id).filter(Boolean))];
      if (projectIds.length > 0) {
        const projs = await Promise.all(projectIds.map(id => base44.entities.Project.filter({ id }).then(r => r[0])));
        setProjects(projs.filter(Boolean));
      }
      setLoading(false);
    });
  }, [user]);

  const getMyTasks = (pid) => tasks.filter(t => t.project_id === pid);

  return (
    <div className="space-y-6">
      <PageHeader title="My Projects" subtitle="Projects you're contributing to" />

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-28 animate-pulse" />)}</div>
      ) : projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map(p => {
            const myTasks = getMyTasks(p.id);
            const done = myTasks.filter(t => t.status === "done").length;
            return (
              <div key={p.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold mb-0.5">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.client_name}</p>
                  </div>
                  <StatusBadge status={p.status} size="xs" />
                </div>
                <div className="space-y-2">
                  {myTasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <span className="text-xs">{t.title}</span>
                      <div className="flex gap-1.5">
                        <StatusBadge status={t.priority} size="xs" />
                        <StatusBadge status={t.status} size="xs" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">{done}/{myTasks.length} tasks completed</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">No projects assigned yet</div>
      )}
    </div>
  );
}