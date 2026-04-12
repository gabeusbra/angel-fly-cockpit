import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Pencil, Trash2, UserCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const emptyForm = { role: "client", specialty: "", hourly_rate: "", company: "", phone: "", status: "active" };
const emptyInvite = { email: "", role: "user" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const data = await base44.entities.User.list();
    setUsers(data);
    setLoading(false);
  };

  const openInvite = () => {
    setInvite(emptyInvite);
    setInviteSuccess(false);
    setShowInvite(true);
  };

  const handleInvite = async () => {
    setInviting(true);
    await base44.users.inviteUser(invite.email, invite.role);
    setInviting(false);
    setInviteSuccess(true);
    load();
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      role: user.role || "client",
      specialty: user.specialty || "",
      hourly_rate: user.hourly_rate ? String(user.hourly_rate) : "",
      company: user.company || "",
      phone: user.phone || "",
      status: user.status || "active",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = {
      role: form.role,
      specialty: form.role === "professional" ? form.specialty : "",
      hourly_rate: form.role === "professional" && form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      company: form.role === "client" ? form.company : "",
      phone: form.phone,
      status: form.status,
    };
    if (editing) {
      await base44.entities.User.update(editing.id, payload);
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await base44.entities.User.update(confirmDelete.id, { status: "inactive" });
    setConfirmDelete(null);
    load();
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.company || "").toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = { admin: 0, pm: 0, professional: 0, client: 0 };
  users.forEach(u => { if (u.role && roleCounts[u.role] !== undefined) roleCounts[u.role]++; });

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Manage all users, roles, and access">
        <Button onClick={openInvite} className="gap-2"><Mail className="w-4 h-4" /> Invite User</Button>
      </PageHeader>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { role: "admin", label: "Admins", color: "bg-purple-100 text-purple-700" },
          { role: "pm", label: "Project Managers", color: "bg-blue-100 text-blue-700" },
          { role: "professional", label: "Professionals", color: "bg-orange-100 text-orange-700" },
          { role: "client", label: "Clients", color: "bg-emerald-100 text-emerald-700" },
        ].map(r => (
          <div key={r.role} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">{r.label}</p>
            <p className="text-2xl font-bold">{roleCounts[r.role]}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or company..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="pm">Project Manager</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["User", "Role", "Details", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5}><div className="h-4 bg-muted rounded animate-pulse mx-4 my-3" /></td></tr>)
              ) : filtered.length > 0 ? filtered.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.full_name || "No name"}</p>
                        <p className="text-xs text-muted-foreground">{u.email || "No email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      u.role === "admin" ? "bg-purple-100 text-purple-700" :
                      u.role === "pm" ? "bg-blue-100 text-blue-700" :
                      u.role === "professional" ? "bg-orange-100 text-orange-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      {u.role === "pm" ? "PM" : (u.role || "client").charAt(0).toUpperCase() + (u.role || "client").slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.role === "professional" && u.specialty && <span>{u.specialty} · R${u.hourly_rate || 0}/hr</span>}
                    {u.role === "client" && u.company && <span>{u.company}</span>}
                    {u.phone && <span className="block">{u.phone}</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.status || "active"} size="xs" /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(u)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {u.role !== "admin" && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => setConfirmDelete(u)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {inviteSuccess ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✉️</p>
                <p className="text-sm font-medium">Invitation sent!</p>
                <p className="text-xs text-muted-foreground mt-1">They will receive an email to join the platform.</p>
                <Button className="mt-4" onClick={() => setShowInvite(false)}>Done</Button>
              </div>
            ) : (
              <>
                <Input placeholder="Email address" type="email" value={invite.email} onChange={e => setInvite({ ...invite, email: e.target.value })} />
                <Select value={invite.role} onValueChange={v => setInvite({ ...invite, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Regular User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">After they join, you can update their specific role (PM, Professional, Client) via the edit button.</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
                  <Button onClick={handleInvite} disabled={!invite.email || inviting}>{inviting ? "Sending…" : "Send Invite"}</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="pm">Project Manager</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>

            {form.role === "professional" && (
              <>
                <Input placeholder="Specialty (e.g. Designer, Developer)" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
                <Input type="number" placeholder="Hourly Rate (R$)" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} />
              </>
            )}

            {form.role === "client" && (
              <Input placeholder="Company Name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            )}

            <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deactivate User</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm">Are you sure you want to deactivate <strong>{confirmDelete?.full_name}</strong>? They will lose access to their portal.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Deactivate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}