import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function AdminPaymentApprovals() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [estDate, setEstDate] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const data = await base44.entities.PaymentOutgoing.list("-created_date");
    setPayments(data); setLoading(false);
  };

  const handleApprove = async () => {
    await base44.entities.PaymentOutgoing.update(dialog.payment.id, {
      status: "approved",
      admin_notes: notes || undefined,
      approved_date: new Date().toISOString().split("T")[0],
      amount: amount ? parseFloat(amount) : dialog.payment.amount,
      estimated_pay_date: estDate || undefined,
    });
    closeDialog(); load();
  };

  const handleReject = async () => {
    await base44.entities.PaymentOutgoing.update(dialog.payment.id, { status: "rejected", admin_notes: notes });
    closeDialog(); load();
  };

  const closeDialog = () => { setDialog(null); setNotes(""); setAmount(""); setEstDate(""); };

  const requested = payments.filter(p => p.status === "requested");
  const history = payments.filter(p => p.status !== "requested");

  return (
    <div className="space-y-8">
      <PageHeader title="Payment Approvals" subtitle="Review and approve professional payment requests" />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Pending ({requested.length})
        </h3>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-20 animate-pulse" />)}</div>
        ) : requested.length > 0 ? (
          <div className="space-y-3">
            {requested.map((p) => (
              <div key={p.id} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{p.professional_name || "Professional"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.task_title} · {p.project_name} · by {p.requested_by_name}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-lg font-bold">R${(p.amount || 0).toLocaleString()}</span>
                  <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setDialog({ type: "approve", payment: p }); setAmount(String(p.amount || "")); }}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDialog({ type: "reject", payment: p })}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
            All caught up! No pending approvals.
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">History</h3>
          <div className="space-y-2">
            {history.slice(0, 15).map((p) => (
              <div key={p.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.professional_name}</p>
                  <p className="text-xs text-muted-foreground">{p.task_title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">R${(p.amount || 0).toLocaleString()}</span>
                  <StatusBadge status={p.status} size="xs" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.type === "approve" ? "Approve Payment" : "Reject Payment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm font-medium">{dialog?.payment?.professional_name} — {dialog?.payment?.task_title}</p>
            {dialog?.type === "approve" && (
              <>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Amount (modify if needed)</label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Estimated Pay Date</label>
                  <Input type="date" value={estDate} onChange={e => setEstDate(e.target.value)} /></div>
              </>
            )}
            <div><label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={dialog?.type === "reject" ? "Reason for rejection..." : "Optional notes..."} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              {dialog?.type === "approve"
                ? <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>Approve</Button>
                : <Button variant="destructive" onClick={handleReject}>Reject</Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}