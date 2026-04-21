import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function PMTickets() {
  const [tickets, setTickets] = useState([]);
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const init = async () => {
      let t = [], u = [];
      try { t = await api.entities.Ticket.list("-created_date"); } catch { try { t = await api.entities.Ticket.list(); } catch { /* ignore */ } }
      try { u = await api.entities.User.filter({ role: "professional", status: "active" }); } catch { try { const all = await api.entities.User.list(); u = all.filter(usr => usr.role === "professional"); } catch { /* ignore */ } }
      setTickets(t); setPros(u); setLoading(false);
    };
    init();
  }, []);

  const load = async () => {
    const t = await api.entities.Ticket.list("-created_date");
    setTickets(t);
  };

  const handleAssign = async (ticketId, userId) => {
    const pro = pros.find(u => u.id === userId);
    await api.entities.Ticket.update(ticketId, { assigned_to: userId, assigned_to_name: pro?.full_name || "", status: "in_progress" });
    load();
  };

  const handleStatus = async (ticketId, status) => {
    await api.entities.Ticket.update(ticketId, { status });
    load();
  };

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return (t.subject?.toLowerCase().includes(q) || t.client_name?.toLowerCase().includes(q))
      && (statusFilter === "all" || t.status === statusFilter);
  });

  // Satisfaction stats
  const rated = tickets.filter(t => t.satisfaction_rating);
  const avgSatisfaction = rated.length > 0 ? (rated.reduce((s, t) => s + t.satisfaction_rating, 0) / rated.length).toFixed(1) : null;
  const slaTotal = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" subtitle="Track and resolve client issues" />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="text-xl font-bold text-blue-600">{openCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">In Progress</p>
          <p className="text-xl font-bold text-amber-600">{inProgressCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Resolved</p>
          <p className="text-xl font-bold text-emerald-600">{slaTotal}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Avg Satisfaction</p>
          {avgSatisfaction ? (
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xl font-bold">{avgSatisfaction}</span>
              <span className="text-xs text-muted-foreground">/ 5</span>
            </div>
          ) : (
            <p className="text-xl font-bold text-muted-foreground">—</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-20 animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold">{t.subject}</h3>
                    <StatusBadge status={t.status} size="xs" />
                    <StatusBadge status={t.priority} size="xs" />
                    <StatusBadge status={t.category} size="xs" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.client_name} · {t.project_name} · {new Date(t.created_date).toLocaleDateString()}</p>
                  {t.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.satisfaction_rating && (
                    <div className="flex items-center gap-0.5 mr-2">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold">{t.satisfaction_rating}</span>
                    </div>
                  )}
                  {t.status === "open" && (
                    <Select onValueChange={v => handleAssign(t.id, v)}>
                      <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Assign..." /></SelectTrigger>
                      <SelectContent>
                        {pros.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {t.status === "in_progress" && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStatus(t.id, "resolved")}>Resolve</Button>}
                  {t.status === "resolved" && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStatus(t.id, "closed")}>Close</Button>}
                </div>
              </div>
              {t.assigned_to_name && <p className="text-xs text-muted-foreground mt-2">Assigned to: {t.assigned_to_name}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">No tickets found</div>
      )}
    </div>
  );
}
