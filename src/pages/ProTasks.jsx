import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const COLS = [
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

export default function ProTasks() {
  const { user } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadTask, setUploadTask] = useState(null);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    base44.entities.Task.filter({ assigned_to: user.id }).then(t => { setTasks(t); setLoading(false); });
  }, [user]);

  const reload = async () => {
    const t = await base44.entities.Task.filter({ assigned_to: user.id });
    setTasks(t);
  };

  const handleStatus = async (taskId, status) => {
    await base44.entities.Task.update(taskId, { status });
    reload();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setDeliverableUrl(file_url);
    setUploading(false);
  };

  const handleSubmitDeliverable = async () => {
    await base44.entities.Task.update(uploadTask.id, { deliverable_url: deliverableUrl, status: "review" });
    setUploadTask(null); setDeliverableUrl("");
    reload();
  };

  const byCol = Object.fromEntries(COLS.map(c => [c.key, tasks.filter(t => t.status === c.key)]));

  return (
    <div className="space-y-6">
      <PageHeader title="My Tasks" subtitle="Manage and track your assigned tasks" />

      {loading ? (
        <div className="flex gap-4">{[...Array(4)].map((_, i) => <div key={i} className="w-60 h-40 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLS.map(({ key, label }) => (
            <div key={key} className="min-w-[240px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={key} size="xs" />
                <span className="text-xs text-muted-foreground">({byCol[key].length})</span>
              </div>
              <div className="space-y-2">
                {byCol[key].map(t => (
                  <div key={t.id} className="bg-card rounded-lg border border-border p-3 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium mb-1">{t.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{t.project_name}</p>
                    <div className="flex items-center justify-between mb-2">
                      <StatusBadge status={t.priority} size="xs" />
                      {t.deadline && <span className="text-[10px] text-muted-foreground">{new Date(t.deadline).toLocaleDateString()}</span>}
                    </div>
                    {key === "assigned" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs w-full" onClick={() => handleStatus(t.id, "in_progress")}>Start</Button>
                    )}
                    {key === "in_progress" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs w-full gap-1" onClick={() => setUploadTask(t)}>
                        <Upload className="w-3 h-3" /> Upload Deliverable
                      </Button>
                    )}
                  </div>
                ))}
                {byCol[key].length === 0 && (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground">Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!uploadTask} onOpenChange={() => { setUploadTask(null); setDeliverableUrl(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Deliverable</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm font-medium">{uploadTask?.title}</p>
            <Input type="file" onChange={handleFileUpload} disabled={uploading} />
            {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
            {deliverableUrl && <p className="text-xs text-emerald-600">✓ File uploaded</p>}
            <Input placeholder="Or paste a URL" value={deliverableUrl} onChange={e => setDeliverableUrl(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setUploadTask(null); setDeliverableUrl(""); }}>Cancel</Button>
              <Button onClick={handleSubmitDeliverable} disabled={!deliverableUrl}>Submit for Review</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}