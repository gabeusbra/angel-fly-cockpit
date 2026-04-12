import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function ClientTickets() {
  const { user } = useOutletContext();
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ project_id: "", category: "question", subject: "", description: "", priority: "medium" });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      base44.entities.Ticket.filter({ client_id: user.id }),
      base44.entities.Project.filter({ client_id: user.id }),
    ]).then(([t, p]) => { setTickets(t); setProjects(p); setLoading(false); });
  }, [user]);

  const load = async () => {
    const t = await base44.entities.Ticket.filter({ client_id: user.id });
    setTickets(t);
  };

  const handleCreate = async () => {
    const proj = projects.find(p => p.id === form.project_id);
    await base44.entities.Ticket.create({
      ...form,
      client_id: user.id,
      client_name: user.full_name,
      project_name: proj?.name || "",
      status: "open",
    });
    setShowCreate(false);
    setForm({ project_id: "", category: "question", subject: "", description: "", priority: "medium" });
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" subtitle="Submit and track your support requests">
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Ticket</Button>
      </PageHeader>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-20 animate-pulse" />)}</div>
      ) : tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold">{t.subject}</h3>
                    <StatusBadge status={t.status} size="xs" />
                    <StatusBadge status={t.priority} size="xs" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.project_name || "General"} · {new Date(t.created_date).toLocaleDateString()}</p>
                  {t.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={t.category} size="xs" />
                  {t.estimated_resolution && (
                    <p className="text-xs text-muted-foreground mt-1">Est: {new Date(t.estimated_resolution).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">No tickets yet. Need help?</div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select Project (optional)" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="change_request">Change Request</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <Textarea placeholder="Describe your issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Submit Ticket</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}