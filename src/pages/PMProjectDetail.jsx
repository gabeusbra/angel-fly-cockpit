import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { Plus, ArrowLeft, Sparkles, Pencil, MessageSquare, CheckSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "../components/StatusBadge";

const COLUMNS = ["backlog", "assigned", "in_progress", "review", "client_approval", "done"];

function parseTags(str) { return str ? str.split(",").map(s => s.trim()).filter(Boolean) : []; }
function parseJson(str, fallback) { try { return JSON.parse(str || "null") || fallback; } catch { return fallback; } }

function scoreProfessionals(pros, allTasks, projectName) {
  return pros.map(pro => {
    const myTasks = allTasks.filter(t => t.assigned_to === pro.id);
    const active = myTasks.filter(t => t.status !== "done").length;
    const done = myTasks.filter(t => t.status === "done").length;
    const overdue = myTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
    const total = myTasks.length;
    const onTimeRate = total > 0 ? Math.round(((done - overdue) / Math.max(total, 1)) * 100) : 100;
    const availScore = Math.max(0, 40 - active * 8);
    const reliabilityScore = Math.round((onTimeRate / 100) * 35);
    const specMatch = pro.specialty && projectName && pro.specialty.toLowerCase().split(/[\s,]+/).some(w => projectName.toLowerCase().includes(w)) ? 25 : 0;
    return { ...pro, active, done, onTimeRate, score: availScore + reliabilityScore + specMatch };
  }).sort((a, b) => b.score - a.score);
}

const TAG_COLORS = {
  backend: "bg-purple-100 text-purple-700", frontend: "bg-blue-100 text-blue-700",
  integration: "bg-teal-100 text-teal-700", api: "bg-indigo-100 text-indigo-700",
  design: "bg-pink-100 text-pink-700", ops: "bg-amber-100 text-amber-700",
  security: "bg-red-100 text-red-700", devops: "bg-slate-100 text-slate-700",
};

export default function PMProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [milestoneFilter, setMilestoneFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  // Create task
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", priority: "medium", deadline: "", estimated_hours: "", milestone: "", tags: "" });

  // Task detail panel
  const [activeTask, setActiveTask] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  // Project docs
  const [showDocs, setShowDocs] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: "", content: "" });

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    const [p, t, at, u] = await Promise.all([
      base44.entities.Project.filter({ id }),
      base44.entities.Task.filter({ project_id: id }),
      base44.entities.Task.list(),
      base44.entities.User.filter({ role: "professional", status: "active" }),
    ]);
    setProject(p[0] || null); setTasks(t); setAllTasks(at); setPros(u); setLoading(false);
  };

  const reloadTasks = async () => {
    const [t, at] = await Promise.all([
      base44.entities.Task.filter({ project_id: id }),
      base44.entities.Task.list(),
    ]);
    setTasks(t); setAllTasks(at);
  };

  // --- Create ---
  const handleCreate = async () => {
    const pro = pros.find(u => u.id === form.assigned_to);
    await base44.entities.Task.create({
      ...form,
      project_id: id, project_name: project?.name || "", client_name: project?.client_name || "",
      assigned_to_name: pro?.full_name || "",
      status: form.assigned_to ? "assigned" : "backlog",
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : 0,
      subtasks: "[]", comments: "[]",
    });
    setShowCreate(false);
    setForm({ title: "", description: "", assigned_to: "", priority: "medium", deadline: "", estimated_hours: "", milestone: "", tags: "" });
    reloadTasks();
  };

  // --- Edit ---
  const openTask = (task) => {
    setActiveTask(task);
    setEditForm({
      title: task.title || "", description: task.description || "",
      assigned_to: task.assigned_to || "", priority: task.priority || "medium",
      deadline: task.deadline || "", estimated_hours: task.estimated_hours ? String(task.estimated_hours) : "",
      status: task.status || "backlog", milestone: task.milestone || "", tags: task.tags || "",
    });
    setNewComment(""); setNewSubtask("");
  };

  const handleEditSave = async () => {
    if (!activeTask) return;
    const pro = pros.find(u => u.id === editForm.assigned_to);
    await base44.entities.Task.update(activeTask.id, {
      ...editForm,
      assigned_to_name: pro?.full_name || activeTask.assigned_to_name || "",
      estimated_hours: editForm.estimated_hours ? parseFloat(editForm.estimated_hours) : 0,
    });
    setActiveTask(null);
    reloadTasks();
  };

  // --- Subtasks ---
  const addSubtask = async () => {
    if (!newSubtask || !activeTask) return;
    const subs = parseJson(activeTask.subtasks, []);
    subs.push({ text: newSubtask, done: false, created: new Date().toISOString() });
    await base44.entities.Task.update(activeTask.id, { subtasks: JSON.stringify(subs) });
    setNewSubtask("");
    const updated = { ...activeTask, subtasks: JSON.stringify(subs) };
    setActiveTask(updated);
    reloadTasks();
  };

  const toggleSubtask = async (idx) => {
    if (!activeTask) return;
    const subs = parseJson(activeTask.subtasks, []);
    subs[idx].done = !subs[idx].done;
    await base44.entities.Task.update(activeTask.id, { subtasks: JSON.stringify(subs) });
    setActiveTask({ ...activeTask, subtasks: JSON.stringify(subs) });
    reloadTasks();
  };

  // --- Comments ---
  const addComment = async () => {
    if (!newComment || !activeTask) return;
    const cmts = parseJson(activeTask.comments, []);
    cmts.push({ text: newComment, at: new Date().toISOString(), by: "You" });
    await base44.entities.Task.update(activeTask.id, { comments: JSON.stringify(cmts) });
    setNewComment("");
    setActiveTask({ ...activeTask, comments: JSON.stringify(cmts) });
  };

  // --- Docs ---
  const addDoc = async () => {
    if (!newDoc.title || !project) return;
    const docs = parseJson(project.docs, []);
    docs.push({ ...newDoc, at: new Date().toISOString() });
    await base44.entities.Project.update(project.id, { docs: JSON.stringify(docs) });
    setProject({ ...project, docs: JSON.stringify(docs) });
    setNewDoc({ title: "", content: "" });
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-muted rounded" /><div className="h-64 bg-muted rounded-xl" /></div>;
  if (!project) return <div className="text-center py-20 text-muted-foreground">Project not found</div>;

  // Milestones from tasks
  const allMilestones = [...new Set(tasks.map(t => t.milestone).filter(Boolean))];
  const allTagsList = [...new Set(tasks.flatMap(t => parseTags(t.tags)))];

  const filtered = tasks.filter(t => {
    if (milestoneFilter !== "all" && t.milestone !== milestoneFilter) return false;
    if (tagFilter !== "all" && !parseTags(t.tags).includes(tagFilter)) return false;
    return true;
  });

  const byStatus = Object.fromEntries(COLUMNS.map(s => [s, filtered.filter(t => t.status === s)]));
  const progress = filtered.length > 0 ? Math.round((byStatus.done.length / filtered.length) * 100) : 0;
  const rankedPros = scoreProfessionals(pros, allTasks, project.name);

  // Milestone progress
  const milestoneProgress = allMilestones.map(m => {
    const mTasks = tasks.filter(t => t.milestone === m);
    const done = mTasks.filter(t => t.status === "done").length;
    return { name: m, total: mTasks.length, done, pct: mTasks.length ? Math.round((done / mTasks.length) * 100) : 0 };
  });

  const docs = parseJson(project.docs, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/pm/projects" className="p-2 hover:bg-muted rounded-lg transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.client_name} · {progress}% complete</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDocs(true)} className="gap-1"><FileText className="w-4 h-4" /> Docs ({docs.length})</Button>
            <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Task</Button>
          </div>
        </div>
      </div>

      {/* Milestone progress bars */}
      {milestoneProgress.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {milestoneProgress.map(m => (
            <button key={m.name} onClick={() => setMilestoneFilter(milestoneFilter === m.name ? "all" : m.name)}
              className={`bg-card rounded-xl border p-3 text-left transition-all ${milestoneFilter === m.name ? "border-primary shadow-md" : "border-border hover:shadow-sm"}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold truncate">{m.name}</span>
                <span className="text-xs text-muted-foreground">{m.done}/{m.total}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setMilestoneFilter("all"); setTagFilter("all"); }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${milestoneFilter === "all" && tagFilter === "all" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
          All Tasks ({tasks.length})
        </button>
        {allTagsList.map(tag => (
          <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? "all" : tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tagFilter === tag ? "bg-primary text-white" : (TAG_COLORS[tag.toLowerCase()] || "bg-muted text-muted-foreground") + " hover:opacity-80"}`}>
            {tag}
          </button>
        ))}
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col} className="min-w-[250px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={col} size="xs" />
              <span className="text-xs text-muted-foreground">({byStatus[col].length})</span>
            </div>
            <div className="space-y-2">
              {byStatus[col].map(t => {
                const tags = parseTags(t.tags);
                const subs = parseJson(t.subtasks, []);
                const subsDone = subs.filter(s => s.done).length;
                return (
                  <div key={t.id} className="bg-card rounded-lg border border-border p-3 hover:shadow-md transition-shadow group cursor-pointer" onClick={() => openTask(t)}>
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium mb-1 flex-1">{t.title}</p>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </div>
                    {t.milestone && <p className="text-[10px] text-primary font-medium mb-1">{t.milestone}</p>}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{t.assigned_to_name || "Unassigned"}</span>
                      <StatusBadge status={t.priority} size="xs" />
                    </div>
                    {tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-1">
                        {tags.map(tag => <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[tag.toLowerCase()] || "bg-muted text-muted-foreground"}`}>{tag}</span>)}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {t.deadline && <span>{new Date(t.deadline).toLocaleDateString()}</span>}
                      {subs.length > 0 && <span className="flex items-center gap-0.5"><CheckSquare className="w-3 h-3" />{subsDone}/{subs.length}</span>}
                      {parseJson(t.comments, []).length > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{parseJson(t.comments, []).length}</span>}
                    </div>
                  </div>
                );
              })}
              {byStatus[col].length === 0 && (
                <div className="border-2 border-dashed border-border rounded-lg p-5 text-center text-xs text-muted-foreground">Empty</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task detail panel */}
      <Dialog open={!!activeTask} onOpenChange={() => setActiveTask(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Task Details</DialogTitle></DialogHeader>
          {activeTask && (
            <div className="space-y-4 pt-2">
              {/* Edit fields */}
              <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="text-base font-semibold" />
              <Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description..." rows={3} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Select value={editForm.assigned_to} onValueChange={v => setEditForm({ ...editForm, assigned_to: v })}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Assignee" /></SelectTrigger>
                  <SelectContent>{pros.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{COLUMNS.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={editForm.priority} onValueChange={v => setEditForm({ ...editForm, priority: v })}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input type="date" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} />
                <Input placeholder="Milestone" value={editForm.milestone} onChange={e => setEditForm({ ...editForm, milestone: e.target.value })} />
                <Input placeholder="Tags (comma-sep)" value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} />
              </div>

              {/* Subtasks */}
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">Subtasks</span>
                </div>
                {parseJson(activeTask.subtasks, []).map((sub, i) => (
                  <label key={i} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={sub.done} onChange={() => toggleSubtask(i)} className="rounded" />
                    <span className={`text-sm ${sub.done ? "line-through text-muted-foreground" : ""}`}>{sub.text}</span>
                  </label>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Add subtask..." value={newSubtask} onChange={e => setNewSubtask(e.target.value)} className="h-8 text-xs"
                    onKeyDown={e => e.key === "Enter" && addSubtask()} />
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addSubtask}>Add</Button>
                </div>
              </div>

              {/* Comments */}
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">Comments</span>
                </div>
                {parseJson(activeTask.comments, []).map((c, i) => (
                  <div key={i} className="py-1.5 border-b border-border last:border-0">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span className="font-medium">{c.by}</span>
                      <span>{new Date(c.at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{c.text}</p>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Add comment..." value={newComment} onChange={e => setNewComment(e.target.value)} className="h-8 text-xs"
                    onKeyDown={e => e.key === "Enter" && addComment()} />
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addComment}>Post</Button>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setActiveTask(null)}>Cancel</Button>
                <Button onClick={handleEditSave}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create task dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Task Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            {rankedPros[0] && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2"><Sparkles className="w-3.5 h-3.5 text-blue-600" /><span className="text-xs font-semibold text-blue-700">AI Recommendation</span></div>
                <div className="space-y-1.5">
                  {rankedPros.slice(0, 3).map((p, i) => (
                    <button key={p.id} onClick={() => setForm({ ...form, assigned_to: p.id })}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${form.assigned_to === p.id ? "bg-blue-200 text-blue-900" : "hover:bg-blue-100 text-blue-800"}`}>
                      <span className="font-medium">{i === 0 && "\u2605 "}{p.full_name}{p.specialty ? ` (${p.specialty})` : ""}</span>
                      <span className="text-blue-600">{p.active} active · {p.onTimeRate}% on-time</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
              <SelectTrigger><SelectValue placeholder="Assign to professional" /></SelectTrigger>
              <SelectContent>{pros.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name} {u.specialty ? `(${u.specialty})` : ""}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
              </Select>
              <Input placeholder="Milestone (e.g. Week 1)" value={form.milestone} onChange={e => setForm({ ...form, milestone: e.target.value })} />
            </div>
            <Input placeholder="Tags (comma-separated: backend, frontend, api)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
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

      {/* Project docs */}
      <Dialog open={showDocs} onOpenChange={setShowDocs}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Project Documents</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {docs.map((d, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <div className="flex justify-between mb-1">
                  <h4 className="text-sm font-semibold">{d.title}</h4>
                  <span className="text-[10px] text-muted-foreground">{new Date(d.at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{d.content}</p>
              </div>
            ))}
            {docs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No documents yet</p>}
            <div className="border-t border-border pt-4 space-y-3">
              <Input placeholder="Document title" value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} />
              <Textarea placeholder="Content (PRD, specs, notes, decisions...)" value={newDoc.content} onChange={e => setNewDoc({ ...newDoc, content: e.target.value })} rows={6} />
              <Button onClick={addDoc} disabled={!newDoc.title}>Add Document</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
