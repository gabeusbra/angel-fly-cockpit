import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate, useLocation, useOutletContext } from "react-router-dom";
import { Plus, ArrowLeft, Sparkles, Pencil, MessageSquare, CheckSquare, FileText, ExternalLink, Download, Globe, FileUp, Link2, Trash2, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "../components/StatusBadge";

const COLUMNS = ["backlog", "assigned", "in_progress", "review", "client_approval", "done"];

function HtmlDocViewer({ doc }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doc?.url) { setLoading(false); return; }
    fetch(doc.url)
      .then(r => r.text())
      .then(text => { setContent(text); setLoading(false); })
      .catch(() => { setContent(null); setLoading(false); });
  }, [doc?.url]);

  if (loading) return <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></div>;

  if (!content) return (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground">Could not load document.</p>
      {doc?.url && <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-2 inline-block">Open file directly</a>}
    </div>
  );

  return (
    <div className="pt-2">
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <Globe className="w-3.5 h-3.5" />
        <span>HTML Document</span>
        <span>{new Date(doc.at).toLocaleDateString()}</span>
        {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary hover:underline ml-auto">Open in new tab</a>}
      </div>
      {content.trim().startsWith("<") ? (
        <iframe srcDoc={content} className="w-full border border-border rounded-lg bg-white" style={{ minHeight: "70vh" }} title={doc.title} sandbox="allow-same-origin" />
      ) : (
        <div className="border border-border rounded-lg p-6 bg-white">
          <pre className="text-sm whitespace-pre-wrap font-sans">{content}</pre>
        </div>
      )}
    </div>
  );
}

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
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isPro = user?.role === "professional";
  const backPath = location.pathname.startsWith("/admin") ? "/admin/projects" : location.pathname.startsWith("/pro") ? "/pro/projects" : "/pm/projects";
  const [project, setProject] = useState(null);
  const [projectDocs, setProjectDocs] = useState([]);
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

  // Project settings
  const [showSettings, setShowSettings] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", client_name: "", scope_description: "", status: "active", start_date: "", end_date: "", total_budget: "", payment_type: "one-time", recurrence_interval: "none" });

  // Project docs
  const [showDocs, setShowDocs] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [newDoc, setNewDoc] = useState({ title: "", type: "html", content: "", url: "" });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    // Try multiple approaches to load project (permissions vary by role)
    let proj = null;
    try { const r = await base44.entities.Project.filter({ id }); proj = r[0] || null; } catch { /* ignore */ }
    if (!proj) {
      try { const all = await base44.entities.Project.list(); proj = all.find(p => p.id === id) || null; } catch { /* ignore */ }
    }

    let t = [], at = [], u = [];
    try { t = await base44.entities.Task.filter({ project_id: id }); } catch {
      try { const allT = await base44.entities.Task.list(); t = allT.filter(tk => tk.project_id === id); } catch { /* ignore */ }
    }
    try { at = await base44.entities.Task.list(); } catch { /* ignore */ }
    try { u = await base44.entities.User.filter({ role: "professional", status: "active" }); } catch {
      try { const allU = await base44.entities.User.list(); u = allU.filter(usr => usr.role === "professional" && usr.status === "active"); } catch { /* ignore */ }
    }

    // For professionals: only show their tasks
    const myTasks = isPro
      ? t.filter(tk => tk.assigned_to === user?.id || tk.assigned_to_name?.toLowerCase() === user?.full_name?.toLowerCase())
      : t;
    setProject(proj); setTasks(myTasks); setAllTasks(at); setPros(u); setLoading(false);

    // Load docs after project is set
    if (proj) {
      const docsData = await loadDocsData(proj);
      setProjectDocs(docsData);
    }
  };

  const loadDocsData = async (proj) => {
    // Try entity field (URL to JSON file)
    if (proj?.docs) {
      try {
        if (proj.docs.startsWith("http")) {
          const res = await fetch(proj.docs);
          return await res.json();
        }
        return parseJson(proj.docs, []);
      } catch { /* fall through */ }
    }
    // Fallback to localStorage
    return parseJson(localStorage.getItem(`project_docs_${id}`), []);
  };

  const openSettings = () => {
    if (!project) return;
    setProjectForm({
      name: project.name || "", client_name: project.client_name || "",
      scope_description: project.scope_description || "", status: project.status || "active",
      start_date: project.start_date || "", end_date: project.end_date || "",
      total_budget: project.total_budget ? String(project.total_budget) : "",
      payment_type: project.payment_type || "one-time",
      recurrence_interval: project.recurrence_interval || "none",
    });
    setShowSettings(true);
  };

  const handleSaveProject = async () => {
    if (!project) return;
    await base44.entities.Project.update(project.id, {
      ...projectForm,
      total_budget: projectForm.total_budget ? parseFloat(projectForm.total_budget) : 0,
    });
    setProject({ ...project, ...projectForm, total_budget: projectForm.total_budget ? parseFloat(projectForm.total_budget) : 0 });
    setShowSettings(false);
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

  // --- Docs (stored as uploaded JSON file, URL saved in localStorage + entity) ---
  const DOCS_KEY = `project_docs_${id}`;

  const saveDocs = async (docsArray) => {
    // Update state immediately
    setProjectDocs(docsArray);

    // Save to localStorage (always works, instant)
    localStorage.setItem(DOCS_KEY, JSON.stringify(docsArray));

    // Also upload as JSON file and try to store URL in entity
    try {
      const blob = new Blob([JSON.stringify(docsArray)], { type: "application/json" });
      const file = new File([blob], `project_${id}_docs.json`, { type: "application/json" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Project.update(project.id, { docs: file_url });
      setProject(p => ({ ...p, docs: file_url }));
    } catch {
      // Entity update failed — localStorage is the backup
    }
  };

  const handleDocFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewDoc(d => ({ ...d, url: file_url }));
    } catch { /* ignore */ }
    setUploadingDoc(false);
  };

  const addDoc = async () => {
    if (!newDoc.title || !project) return;
    if (newDoc.type === "link" && !newDoc.url) return;
    if (newDoc.type === "pdf" && !newDoc.url) return;
    if (newDoc.type === "html" && !newDoc.content) return;

    let docUrl = newDoc.url;

    // For HTML: upload content as a file to avoid field size limits
    if (newDoc.type === "html" && newDoc.content) {
      setUploadingDoc(true);
      try {
        const blob = new Blob([newDoc.content], { type: "text/html" });
        const file = new File([blob], `${newDoc.title.replace(/[^a-zA-Z0-9]/g, "_")}.html`, { type: "text/html" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        docUrl = file_url;
      } catch {
        setUploadingDoc(false);
        return;
      }
      setUploadingDoc(false);
    }

    const updated = [...projectDocs, { title: newDoc.title, type: newDoc.type, url: docUrl, at: new Date().toISOString() }];
    await saveDocs(updated);
    setNewDoc({ title: "", type: "html", content: "", url: "" });
  };

  const removeDoc = async (idx) => {
    const updated = projectDocs.filter((_, i) => i !== idx);
    await saveDocs(updated);
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

  const docs = projectDocs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(backPath)} className="p-2 hover:bg-muted rounded-lg transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.client_name} · {progress}% complete</p>
          </div>
          <div className="flex gap-2">
            {!isPro && <Button variant="ghost" size="sm" onClick={openSettings} className="h-9 w-9 p-0" title="Project Settings"><Settings className="w-4 h-4" /></Button>}
            <Button variant="outline" size="sm" onClick={() => setShowDocs(true)} className="gap-1"><FileText className="w-4 h-4" /> Docs ({docs.length})</Button>
            {!isPro && <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Task</Button>}
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
      <Dialog open={showDocs && !viewDoc} onOpenChange={setShowDocs}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Project Documents</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {docs.map((d, i) => (
              <div key={i} className="border border-border rounded-lg p-4 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    d.type === "pdf" ? "bg-red-100" : d.type === "link" ? "bg-blue-100" : "bg-emerald-100"
                  }`}>
                    {d.type === "pdf" ? <Download className="w-4 h-4 text-red-600" /> :
                     d.type === "link" ? <Link2 className="w-4 h-4 text-blue-600" /> :
                     <Globe className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold truncate">{d.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="uppercase font-medium">{d.type}</span>
                      <span>{new Date(d.at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {d.type === "html" && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewDoc(d)} title="View">
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {d.type === "pdf" && d.url && (
                    <a href={d.url} download className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors" title="Download PDF">
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  {d.type === "link" && d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors" title="Open link">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700" onClick={() => removeDoc(i)} title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {docs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No documents yet. Add your PRD, specs, or reference links below.</p>}

            {/* Add new document */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Document</p>
              <Input placeholder="Document title (e.g. PRD v2.2, API Specs, Design Link)" value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} />
              <div className="flex gap-2">
                {[
                  { val: "html", label: "HTML / Text", icon: Globe },
                  { val: "pdf", label: "PDF Upload", icon: FileUp },
                  { val: "link", label: "External Link", icon: Link2 },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setNewDoc({ ...newDoc, type: opt.val, content: "", url: "" })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                      newDoc.type === opt.val ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                    <opt.icon className="w-3.5 h-3.5" /> {opt.label}
                  </button>
                ))}
              </div>

              {newDoc.type === "html" && (
                <Textarea placeholder="Paste your PRD, specs, or HTML content here..." value={newDoc.content} onChange={e => setNewDoc({ ...newDoc, content: e.target.value })} rows={8} />
              )}

              {newDoc.type === "pdf" && (
                <div className="space-y-2">
                  <Input type="file" accept=".pdf" onChange={handleDocFileUpload} disabled={uploadingDoc} />
                  {uploadingDoc && <p className="text-xs text-muted-foreground">Uploading PDF...</p>}
                  {newDoc.url && <p className="text-xs text-emerald-600">PDF uploaded successfully</p>}
                </div>
              )}

              {newDoc.type === "link" && (
                <Input type="url" placeholder="https://..." value={newDoc.url} onChange={e => setNewDoc({ ...newDoc, url: e.target.value })} />
              )}

              <Button onClick={addDoc} disabled={!newDoc.title || (newDoc.type === "html" && !newDoc.content) || ((newDoc.type === "pdf" || newDoc.type === "link") && !newDoc.url)}>
                Add Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* HTML doc viewer — fetches content from uploaded file URL */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewDoc?.title}</DialogTitle>
          </DialogHeader>
          {viewDoc && <HtmlDocViewer doc={viewDoc} />}
        </DialogContent>
      </Dialog>

      {/* Project settings */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Project Settings</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Project Name</label>
              <Input value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Client Name</label>
              <Input value={projectForm.client_name} onChange={e => setProjectForm({ ...projectForm, client_name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Scope Description</label>
              <Textarea value={projectForm.scope_description} onChange={e => setProjectForm({ ...projectForm, scope_description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
                <Select value={projectForm.status} onValueChange={v => setProjectForm({ ...projectForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Budget (R$)</label>
                <Input type="number" value={projectForm.total_budget} onChange={e => setProjectForm({ ...projectForm, total_budget: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Start Date</label>
                <Input type="date" value={projectForm.start_date} onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">End Date</label>
                <Input type="date" value={projectForm.end_date} onChange={e => setProjectForm({ ...projectForm, end_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Type</label>
                <Select value={projectForm.payment_type} onValueChange={v => setProjectForm({ ...projectForm, payment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {projectForm.payment_type === "recurring" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Recurrence</label>
                  <Select value={projectForm.recurrence_interval} onValueChange={v => setProjectForm({ ...projectForm, recurrence_interval: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button onClick={handleSaveProject} disabled={!projectForm.name}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
