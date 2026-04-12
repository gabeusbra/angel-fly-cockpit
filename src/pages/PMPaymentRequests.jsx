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

export default function PMPaymentRequests() {
  const { user } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ professional_id: "", task_id: "", amount: "", notes: "" });

  useEffect(() => {
    Promise.all([
      base44.entities.PaymentOutgoing.list("-created_date"),
      base44.entities.Task.list(),
      base44.entities.User.filter({ role: "professional", status: "active" }),
    ]).then(([p, t, u]) => { setPayments(p); setTasks(t); setPros(u); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    const pro = pros.find(u => u.id === form.professional_id);
    const task = tasks.find(t => t.id === form.task_id);
    await base44.entities.PaymentOutgoing.create({
      professional_id: form.professional_id,
      professional_name: pro?.full_name || "",
      task_id: form.task_id,
      task_title: task?.title || "",
      project_id: task?.project_id || "",
      project_name: task?.project_name || "",
      amount: parseFloat(form.amount),
      requested_by: user?.id,
      requested_by_name: user?.full_name || "",
      status: "requested",
      admin_notes: form.notes,
    });
    setShowCreate(false);
    setForm({ professional_id: "", task_id: "", amount: "", notes: "" });
    const p = await base44.entities.PaymentOutgoing.list("-created_date");
    setPayments(p);
  };

  const proTasks = form.professional_id ? tasks.filter(t => t.assigned_to === form.professional_id) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Payment Requests" subtitle="Submit payment requests to Admin for approval">
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Request</Button>
      </PageHeader>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-20 animate-pulse" />)}</div>
      ) : payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map(p => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">{p.professional_name}</p>
                  <StatusBadge status={p.status} size="xs" />
                </div>
                <p className="text-xs text-muted-foreground">{p.task_title} · {p.project_name}</p>
                {p.admin_notes && p.status === "rejected" && <p className="text-xs text-red-500 mt-1">Reason: {p.admin_notes}</p>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">R${(p.amount || 0).toLocaleString()}</p>
                {p.estimated_pay_date && <p className="text-xs text-muted-foreground">Est: {new Date(p.estimated_pay_date).toLocaleDateString()}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">No payment requests yet</div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Payment Request</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Select value={form.professional_id} onValueChange={v => setForm({ ...form, professional_id: v, task_id: "" })}>
              <SelectTrigger><SelectValue placeholder="Select Professional" /></SelectTrigger>
              <SelectContent>{pros.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.task_id} onValueChange={v => setForm({ ...form, task_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select Task" /></SelectTrigger>
              <SelectContent>{proTasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" placeholder="Amount (R$)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <Textarea placeholder="Notes for admin" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Submit Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}