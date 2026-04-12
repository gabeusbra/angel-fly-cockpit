import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { filterMyRecords, safeList } from "@/lib/entity-helpers";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function ProProjects() {
  const { user } = useOutletContext();
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
