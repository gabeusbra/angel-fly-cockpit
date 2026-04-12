import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { Plus, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "../components/StatusBadge";

const COLUMNS = ["backlog", "assigned", "in_progress", "review", "client_approval", "done"];

function scoreProfessionals(pros, allTasks, projectName) {
  return pros.map(pro => {
    const myTasks = allTasks.filter(t => t.assigned_to === pro.id);
    const active = myTasks.filter(t => t.status !== "done").length;
    const done = myTasks.filter(t => t.status === "done").length;
    const overdue = myTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
    const total = myTasks.length;
    const onTimeRate = total > 0 ? Math.round(((done - overdue) / Math.max(total, 1)) * 100) : 100;

    // Lower active tasks = more available (0-40 points)
    const availScore = Math.max(0, 40 - active * 8);
    // Higher on-time rate = more reliable (0-35 points)
    const reliabilityScore = Math.round((onTimeRate / 100) * 35);
    // Specialty keyword match bonus (0-25 points)
    const specMatch = pro.specialty && projectName && pro.specialty.toLowerCase().split(/[\s,]+/).some(w => projectName.toLowerCase().includes(w)) ? 25 : 0;

    const score = availScore + reliabilityScore + specMatch;
    return { ...pro, active, done, onTimeRate, score };
  }).sort((a, b) => b.score - a.score);
}

export default function PMProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", priority: "medium", deadline: "", estimated_hours: "" });

  useEffect(() => {
    Promise.all([
      base44.entities.Project.filter({ id }),
      base44.entities.Task.filter({ project_id: id }),
      base44.entities.Task.list(),
      base44.entities.User.filter({ role: "professional", status: "active" }),
    ]).then(([p, t, at, u]) => { setProject(p[0] || null); setTasks(t); setAllTasks(at); setPros(u); setLoading(false); });
  }, [id]);

  const handleCreate = async () => {
    const pro = pros.find(u => u.id === form.assigned_to);
    await base44.entities.Task.create({
      ...form,
      project_id: id,
      project_name: project?.name || "",
      client_name: project?.client_name || "",
      assigned_to_name: pro?.full_name || "",
      status: form.assigned_to ? "assigned" : "backlog",
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : 0,
    });
    setShowCreate(false);
    setForm({ title: "", description: "", assigned_to: "", priority: "medium", deadline: "", estimated_hours: "" });
    const t = await base44.entities.Task.filter({ project_id: id });
    setTasks(t);
    const at = await base44.entities.Task.list();
    setAllTasks(at);
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-muted rounded" /><div className="h-64 bg-muted rounded-xl" /></div>;
  if (!project) return <div className="text-center py-20 text-muted-foreground">Project not found</div>;

  const byStatus = Object.fromEntries(COLUMNS.map(s => [s, tasks.filter(t => t.status === s)]));
  const progress = tasks.length > 0 ? Math.round((byStatus.done.length / tasks.length) * 100) : 0;

  const rankedPros = scoreProfessionals(pros, allTasks, project.name);
  const topPick = rankedPros[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/pm/projects" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.client_name} · {progress}% complete</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Task</Button>
        </div>
      </div>

      {project.scope_description && (
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Scope</p>
          <p className="text-sm">{project.scope_description}</p>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col} className="min-w-[240px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={col} size="xs" />
              <span className="text-xs text-muted-foreground">({byStatus[col].length})</span>
            </div>
            <div className="space-y-2">
              {byStatus[col].map(t => (
                <div key={t.id} className="bg-card rounded-lg border border-border p-3 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium mb-1">{t.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t.assigned_to_name || "Unassigned"}</span>
                    <StatusBadge status={t.priority} size="xs" />
                  </div>
                  {t.deadline && <p className="text-xs text-muted-foreground mt-1">{new Date(t.deadline).toLocaleDateString()}</p>}
                </div>
              ))}
              {byStatus[col].length === 0 && (
                <div className="border-2 border-dashed border-border rounded-lg p-5 text-center text-xs text-muted-foreground">Empty</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Task Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

            {/* AI Suggestion Box */}
            {topPick && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">AI Recommendation</span>
                </div>
                <div className="space-y-1.5">
                  {rankedPros.slice(0, 3).map((p, i) => (
                    <button key={p.id} onClick={() => setForm({ ...form, assigned_to: p.id })}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${form.assigned_to === p.id ? "bg-blue-200 text-blue-900" : "hover:bg-blue-100 text-blue-800"}`}>
                      <span className="font-medium">
                        {i === 0 && "★ "}{p.full_name}
                        {p.specialty ? ` (${p.specialty})` : ""}
                      </span>
                      <span className="text-blue-600">{p.active} active · {p.onTimeRate}% on-time</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
              <SelectTrigger><SelectValue placeholder="Assign to professional" /></SelectTrigger>
              <SelectContent>
                {pros.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name} {u.specialty ? `(${u.specialty})` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              <Input type="number" placeholder="Est. Hours" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
