import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { filterMyRecords } from "@/lib/entity-helpers";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import StatCard from "../components/StatCard";

export default function ClientPayments() {
  const { user } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    filterMyRecords(base44.entities.PaymentIncoming, "client_id", user, "client_name")
      .then(p => { setPayments(p); setLoading(false); });
  }, [user]);

  const paid = payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const pending = payments.filter(p => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0);
  const overdue = payments.filter(p => p.status === "overdue");

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Your payment history and upcoming invoices" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Paid" value={`R$${paid.toLocaleString()}`} icon={CreditCard} color="green" />
        <StatCard label="Pending" value={`R$${pending.toLocaleString()}`} icon={CreditCard} color="yellow" />
        <StatCard label="Overdue" value={overdue.length} icon={CreditCard} color="red" />
      </div>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">Overdue Payments</p>
          {overdue.map(p => (
            <p key={p.id} className="text-xs text-red-600">{p.project_name} — R${(p.amount || 0).toLocaleString()} due {p.due_date ? new Date(p.due_date).toLocaleDateString() : "—"}</p>
          ))}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Invoice", "Project", "Amount", "Due Date", "Paid Date", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => <tr key={i}><td colSpan={6}><div className="h-4 bg-muted rounded animate-pulse mx-4 my-3" /></td></tr>)
              ) : payments.length > 0 ? payments.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.invoice_number || "\u2014"}</td>
                  <td className="px-4 py-3 text-sm">{p.project_name || "\u2014"}</td>
                  <td className="px-4 py-3 text-sm font-bold">R${(p.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.due_date ? new Date(p.due_date).toLocaleDateString() : "\u2014"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.paid_date ? new Date(p.paid_date).toLocaleDateString() : "\u2014"}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} size="xs" /></td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No payment records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
