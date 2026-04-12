import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function AdminProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      base44.entities.Project.list("-created_date"),
      base44.entities.Task.list(),
      base44.entities.PaymentIncoming.list(),
    ]).then(([p, t, i]) => { setProjects(p); setTasks(t); setIncoming(i); setLoading(false); });
  }, []);

  const getProgress = (pid) => {
    const t = tasks.filter(t => t.project_id === pid);
    return t.length ? Math.round((t.filter(t => t.status === "done").length / t.length) * 100) : 0;
  };

  const getBudgetUsed = (pid) => {
    return incoming.filter(p => p.project_id === pid && p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  };

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return (p.name?.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q))
      && (statusFilter === "all" || p.status === statusFilter);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="All Projects" subtitle="Bird's-eye view of every project" />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search projects or clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Project", "Client", "Status", "Progress", "Budget", "Used", "End Date"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7}><div className="h-4 bg-muted rounded animate-pulse mx-4 my-3" /></td></tr>)
              ) : filtered.length > 0 ? filtered.map(p => {
                const prog = getProgress(p.id);
                const used = getBudgetUsed(p.id);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/admin/projects/${p.id}`)}>
                    <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.client_name || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} size="xs" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${prog}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{prog}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">R${(p.total_budget || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">R${used.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No projects found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}