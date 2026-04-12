import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function AdminClientPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ client_name: "", project_name: "", amount: "", type: "one-time", status: "pending", due_date: "", recurrence: "none" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const d = await base44.entities.PaymentIncoming.list("-created_date");
    setPayments(d); setLoading(false);
  };

  const handleCreate = async () => {
    await base44.entities.PaymentIncoming.create({
      ...form,
      amount: parseFloat(form.amount),
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    });
    setShowCreate(false);
    setForm({ client_name: "", project_name: "", amount: "", type: "one-time", status: "pending", due_date: "", recurrence: "none" });
    load();
  };

  const markPaid = async (id) => {
    await base44.entities.PaymentIncoming.update(id, { status: "paid", paid_date: new Date().toISOString().split("T")[0] });
    load();
  };

  const filtered = filter === "all" ? payments : payments.filter(p => p.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader title="Client Payments" subtitle="Manage incoming payments and invoices">
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Payment</Button>
      </PageHeader>

      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "paid", "overdue"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Invoice", "Client", "Project", "Amount", "Due Date", "Status", "Action"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length > 0 ? filtered.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.invoice_number || "—"}</td>
                  <td className="px-4 py-3 text-sm font-medium">{p.client_name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.project_name || "—"}</td>
                  <td className="px-4 py-3 text-sm font-bold">R${(p.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.due_date ? new Date(p.due_date).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} size="xs" /></td>
                  <td className="px-4 py-3">
                    {(p.status === "pending" || p.status === "overdue") && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => markPaid(p.id)}>Mark Paid</Button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No payments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Payment</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Client Name" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
            <Input placeholder="Project Name" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} />
            <Input type="number" placeholder="Amount (R$)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}