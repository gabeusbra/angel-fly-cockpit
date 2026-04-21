import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { useOutletContext } from "react-router-dom";
import { Upload, Clock, CheckCircle2, Sparkles, ExternalLink, Link2, X, FileText, Film, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { filterMyRecords } from "@/lib/entity-helpers";
import StatusBadge from "../components/StatusBadge";

const COLS = [
  { key: "backlog", label: "Backlog", color: "bg-slate-400", lightBg: "bg-slate-50" },
  { key: "assigned", label: "Assigned", color: "bg-blue-500", lightBg: "bg-blue-50" },
  { key: "in_progress", label: "In Progress", color: "bg-amber-500", lightBg: "bg-amber-50" },
  { key: "review", label: "Review", color: "bg-purple-500", lightBg: "bg-purple-50" },
  { key: "client_approval", label: "Client Review", color: "bg-orange-500", lightBg: "bg-orange-50" },
  { key: "done", label: "Done", color: "bg-emerald-500", lightBg: "bg-emerald-50" },
];

export default function ProTasks() {
  const { user } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadTask, setUploadTask] = useState(null);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [deliverables, setDeliverables] = useState([]);
  const [linkInput, setLinkInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    const myTasks = await filterMyRecords(api.entities.Task, "assigned_to", user, "assigned_to_name");
    setTasks(myTasks);
    setLoading(false);
  };

  const handleStatus = async (taskId, status) => {
    await api.entities.Task.update(taskId, { status });
    loadTasks();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const { file_url } = await api.integrations.Core.UploadFile({ file });
        const type = file.type.startsWith("video") ? "video" : file.type.startsWith("image") ? "image" : "file";
        setDeliverables(prev => [...prev, { url: file_url, name: file.name, type }]);
      } catch { /* ignore */ }
    }
    setUploading(false);
    e.target.value = "";
  };

  const addDeliverableLink = () => {
    if (!linkInput.trim()) return;
    setDeliverables(prev => [...prev, { url: linkInput.trim(), name: linkInput.trim(), type: "link" }]);
    setLinkInput("");
  };

  const handleSubmitDeliverable = async () => {
    const allUrls = deliverables.map(d => d.url);
    const mainUrl = allUrls[0] || deliverableUrl;
    // Store first URL in deliverable_url, all URLs in description as links
    const deliverableLinks = allUrls.length > 1 ? `\n\n--- Deliverables ---\n${allUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}` : "";
    const noteText = note ? `\n\n[Note]: ${note}` : "";
    await api.entities.Task.update(uploadTask.id, {
      deliverable_url: mainUrl,
      status: "review",
      description: (uploadTask.description || "") + deliverableLinks + noteText,
    });
    setUploadTask(null); setDeliverableUrl(""); setDeliverables([]); setLinkInput(""); setNote("");
    loadTasks();
  };

  const byCol = Object.fromEntries(COLS.map(c => [c.key, tasks.filter(t => t.status === c.key)]));
  const totalActive = tasks.filter(t => t.status !== "done").length;
  const totalDone = tasks.filter(t => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalActive > 0 ? `${totalActive} active · ${totalDone} completed` : "No tasks assigned yet"}
          </p>
        </div>
        {tasks.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
            </div>
            <span className="text-sm font-semibold">{progress}%</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex gap-4">{[...Array(6)].map((_, i) => <div key={i} className="flex-1 h-40 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLS.map(({ key, label, color }) => (
            <div key={key} className="min-w-[200px] flex-1 space-y-3">
              {/* Column header */}
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{byCol[key].length}</span>
              </div>

              {/* Cards */}
              <div className={`min-h-[120px] rounded-xl border-2 border-dashed p-2 space-y-2 ${byCol[key].length > 0 ? "border-transparent p-0" : "border-border"}`}>
                {byCol[key].map(t => {
                  const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== "done";
                  const daysLeft = t.deadline ? Math.ceil((new Date(t.deadline) - new Date()) / 86400000) : null;
                  return (
                    <div key={t.id} className={`bg-card rounded-xl border border-border p-4 hover:shadow-lg hover:shadow-black/5 transition-all cursor-pointer group ${isOverdue ? "border-red-200 bg-red-50/30" : ""}`}
                      onClick={() => setDetail(t)}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold leading-tight flex-1 pr-2">{t.title}</p>
                        <StatusBadge status={t.priority} size="xs" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{t.project_name}</p>

                      {t.deadline && (
                        <div className={`flex items-center gap-1.5 text-xs mb-3 ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                          <Clock className="w-3 h-3" />
                          <span>{isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : daysLeft <= 3 ? `${daysLeft}d left` : new Date(t.deadline).toLocaleDateString()}</span>
                        </div>
                      )}

                      {t.deliverable_url && (
                        <a href={t.deliverable_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-primary hover:underline mb-3">
                          <ExternalLink className="w-3 h-3" /> Deliverable
                        </a>
                      )}

                      {/* Action buttons */}
                      <div onClick={e => e.stopPropagation()}>
                        {(key === "backlog" || key === "assigned") && (
                          <Button size="sm" className="w-full h-8 text-xs gap-1.5" onClick={() => handleStatus(t.id, "in_progress")}>
                            <Sparkles className="w-3 h-3" /> Start Working
                          </Button>
                        )}
                        {key === "in_progress" && (
                          <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5" onClick={() => setUploadTask(t)}>
                            <Upload className="w-3 h-3" /> Upload Deliverable
                          </Button>
                        )}
                        {key === "client_approval" && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600">
                            <Clock className="w-3.5 h-3.5" /> Awaiting client
                          </div>
                        )}
                        {key === "done" && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {byCol[key].length === 0 && (
                  <div className="flex items-center justify-center h-[100px] text-xs text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detail?.title}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={detail.status} />
                <StatusBadge status={detail.priority} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-muted-foreground block">Project</span>{detail.project_name || "—"}</div>
                <div><span className="text-xs text-muted-foreground block">Deadline</span>{detail.deadline ? new Date(detail.deadline).toLocaleDateString() : "No deadline"}</div>
                {detail.estimated_hours > 0 && <div><span className="text-xs text-muted-foreground block">Est. Hours</span>{detail.estimated_hours}h</div>}
                {detail.milestone && <div><span className="text-xs text-muted-foreground block">Milestone</span>{detail.milestone}</div>}
              </div>
              {detail.description && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Description</span>
                  <p className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{detail.description}</p>
                </div>
              )}
              {detail.deliverable_url && (
                <a href={detail.deliverable_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> View Deliverable
                </a>
              )}
              <div className="flex gap-2 justify-end">
                {detail.status === "assigned" && <Button size="sm" onClick={() => { handleStatus(detail.id, "in_progress"); setDetail(null); }}>Start Working</Button>}
                {detail.status === "in_progress" && <Button size="sm" onClick={() => { setDetail(null); setUploadTask(detail); }}>Upload Deliverable</Button>}
                <Button variant="outline" size="sm" onClick={() => setDetail(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload deliverable dialog */}
      <Dialog open={!!uploadTask} onOpenChange={() => { setUploadTask(null); setDeliverableUrl(""); setDeliverables([]); setLinkInput(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Deliverable</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm font-semibold">{uploadTask?.title}</p>
              <p className="text-xs text-muted-foreground">{uploadTask?.project_name}</p>
            </div>

            {/* Uploaded items */}
            {deliverables.length > 0 && (
              <div className="space-y-2">
                {deliverables.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    {d.type === "image" ? <Image className="w-4 h-4 text-blue-500 shrink-0" /> :
                     d.type === "video" ? <Film className="w-4 h-4 text-purple-500 shrink-0" /> :
                     d.type === "link" ? <Link2 className="w-4 h-4 text-emerald-500 shrink-0" /> :
                     <FileText className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <span className="text-xs truncate flex-1">{d.name}</span>
                    <button onClick={() => setDeliverables(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload buttons */}
            <div className="flex gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" /> Upload File
                <input type="file" accept="image/*,.pdf,.doc,.docx,.zip,.psd,.ai,.fig" multiple onChange={handleFileUpload} className="hidden" disabled={uploading} />
              </label>
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors">
                <Film className="w-3.5 h-3.5" /> Upload Video
                <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}

            {/* Link input */}
            <div className="flex gap-2">
              <Input placeholder="Paste link (Google Drive, Figma, Canva, etc.)" value={linkInput} onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addDeliverableLink()} className="text-xs" />
              <Button variant="outline" size="sm" className="shrink-0 gap-1 text-xs" onClick={addDeliverableLink} disabled={!linkInput.trim()}>
                <Link2 className="w-3 h-3" /> Add
              </Button>
            </div>

            <Textarea placeholder="Add a note for the reviewer (optional)" value={note} onChange={e => setNote(e.target.value)} rows={2} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setUploadTask(null); setDeliverableUrl(""); setDeliverables([]); setLinkInput(""); setNote(""); }}>Cancel</Button>
              <Button onClick={handleSubmitDeliverable} disabled={deliverables.length === 0 && !deliverableUrl} className="gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Submit for Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
