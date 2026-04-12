import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { DollarSign } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import StatCard from "../components/StatCard";

export default function ProPayments() {
  const { user } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.PaymentOutgoing.filter({ professional_id: user.id }).then(p => { setPayments(p); setLoading(false); });
  }, [user]);

  const pending = payments.filter(p => p.status === "requested" || p.status === "approved");
  const paid = payments.filter(p => p.status === "paid");
  const totalEarned = paid.reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = pending.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="My Payments" subtitle="Track your earnings and payment status" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Earned" value={`R$${totalEarned.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatCard label="Pending" value={`R$${totalPending.toLocaleString()}`} icon={DollarSign} color="yellow" />
        <StatCard label="Payments" value={paid.length} icon={DollarSign} color="blue" subtitle="completed" />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Pending Payments</h3>
        {pending.length > 0 ? (
          <div className="space-y-2">
            {pending.map(p => (
              <div key={p.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.task_title || "Task"}</p>
                  <p className="text-xs text-muted-foreground">{p.project_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">R${(p.amount || 0).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={p.status} size="xs" />
                    {p.estimated_pay_date && <span className="text-[10px] text-muted-foreground">Est: {new Date(p.estimated_pay_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">No pending payments</div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Payment History</h3>
        {paid.length > 0 ? (
          <div className="space-y-2">
            {paid.map(p => (
              <div key={p.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.task_title || "Task"}</p>
                  <p className="text-xs text-muted-foreground">{p.project_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">R${(p.amount || 0).toLocaleString()}</p>
                  {p.paid_date && <p className="text-[10px] text-muted-foreground">{new Date(p.paid_date).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">No payment history</div>
        )}
      </div>
    </div>
  );
}