import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function ClientApprovals() {
  const { user } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    // Get client's projects first, then filter approval tasks to only those projects
    const projects = await base44.entities.Project.filter({ client_id: user.id });
    const projectIds = new Set(projects.map(p => p.id));
    const allApproval = await base44.entities.Task.filter({ status: "client_approval" });
    setTasks(allApproval.filter(t => projectIds.has(t.project_id)));
    setLoading(false);
  };

  const handleApprove = async (task) => {
    await base44.entities.Task.update(task.id, { status: "done" });
    loadTasks();
  };

  const handleRequestChanges = async () => {
    await base44.entities.Task.update(dialog.id, { status: "review", description: (dialog.description || "") + (comment ? `\n\n[Client feedback]: ${comment}` : "") });
    setDialog(null); setComment("");
    loadTasks();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pending Approvals" subtitle="Review and approve deliverables from your team" />

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-32 animate-pulse" />)}</div>
      ) : tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">{t.title}</h3>
                  <p className="text-xs text-muted-foreground">{t.project_name} · by {t.assigned_to_name}</p>
                  {t.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">{t.description}</p>}
                </div>
                <StatusBadge status="client_approval" size="xs" />
              </div>

              {t.deliverable_url && (
                <a href={t.deliverable_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline mb-4">
                  <ExternalLink className="w-3.5 h-3.5" /> View Deliverable
                </a>
              )}

              <div className="flex gap-2">
                <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => handleApprove(t)}>
                  <Check className="w-4 h-4" /> Approve
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setDialog(t); setComment(""); }}>
                  <X className="w-4 h-4" /> Request Changes
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm font-medium mb-1">All caught up!</p>
          <p className="text-xs text-muted-foreground">No deliverables waiting for your approval.</p>
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={() => { setDialog(null); setComment(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Changes</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm font-medium">{dialog?.title}</p>
            <Textarea placeholder="Describe what needs to be changed..." value={comment} onChange={e => setComment(e.target.value)} rows={4} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setDialog(null); setComment(""); }}>Cancel</Button>
              <Button variant="destructive" onClick={handleRequestChanges}>Send Feedback</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
