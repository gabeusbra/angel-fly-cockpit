import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Search, Pencil, Trash2, UserCircle, AlertCircle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const PENDING_KEY = "angel_fly_pending_invites";

function getPendingInvites() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch { return []; }
}

function savePendingInvites(list) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

const COCKPIT_ROLES = ["admin", "pm", "professional", "client"];
const hasCockpitRole = (u) => u?.role && COCKPIT_ROLES.includes(u.role);
const roleLabel = (r) => r === "pm" ? "PM" : r ? r.charAt(0).toUpperCase() + r.slice(1) : "—";
const roleBadgeClass = (r) =>
  r === "admin" ? "bg-purple-100 text-purple-700" :
  r === "pm" ? "bg-blue-100 text-blue-700" :
  r === "professional" ? "bg-orange-100 text-orange-700" :
  "bg-emerald-100 text-emerald-700";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pending, setPending] = useState([]);

  // Invite dialog
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", cockpitRole: "client", specialty: "", hourly_rate: "", company: "", phone: "" });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Edit dialog
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ role: "", specialty: "", hourly_rate: "", company: "", phone: "", status: "active" });

  // Deactivate dialog
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const data = await base44.entities.User.list();
    setUsers(data);
    setLoading(false);

    // Check if any pending invites have signed up → auto-apply role
    const pendingList = getPendingInvites();
    const remaining = [];
    for (const inv of pendingList) {
      const match = data.find(u => u.email === inv.email);
      if (match && !hasCockpitRole(match)) {
        const payload = { role: inv.cockpitRole, status: "active", phone: inv.phone || "" };
        if (inv.cockpitRole === "professional") {
          payload.specialty = inv.specialty || "";
          payload.hourly_rate = inv.hourly_rate ? parseFloat(inv.hourly_rate) : null;
        }
        if (inv.cockpitRole === "client") payload.company = inv.company || "";
        try { await base44.entities.User.update(match.id, payload); } catch { /* ignore */ }
      } else if (!match) {
        remaining.push(inv);
      }
    }
    if (remaining.length !== pendingList.length) {
      savePendingInvites(remaining);
      if (remaining.length < pendingList.length) {
        const refreshed = await base44.entities.User.list();
        setUsers(refreshed);
      }
    }
    setPending(remaining);
  };

  // --- Invite ---
  const handleInvite = async () => {
    if (!inviteForm.email) return;
    setInviting(true);
    setInviteError("");
    try {
      const authRole = inviteForm.cockpitRole === "admin" ? "admin" : "user";
      await base44.users.inviteUser(inviteForm.email, authRole);

      // Try to find user immediately (Base44 may create them right away)
      const updatedUsers = await base44.entities.User.list();
      const newUser = updatedUsers.find(u => u.email === inviteForm.email);
      if (newUser) {
        const payload = { role: inviteForm.cockpitRole, status: "active", phone: inviteForm.phone || "" };
        if (inviteForm.cockpitRole === "professional") {
          payload.specialty = inviteForm.specialty;
          payload.hourly_rate = inviteForm.hourly_rate ? parseFloat(inviteForm.hourly_rate) : null;
        }
        if (inviteForm.cockpitRole === "client") payload.company = inviteForm.company;
        await base44.entities.User.update(newUser.id, payload);
      } else {
        // User not created yet — save to pending so we track it
        const pendingList = getPendingInvites();
        pendingList.push({
          email: inviteForm.email,
          cockpitRole: inviteForm.cockpitRole,
          specialty: inviteForm.specialty,
          hourly_rate: inviteForm.hourly_rate,
          company: inviteForm.company,
          phone: inviteForm.phone,
          invitedAt: new Date().toISOString(),
        });
        savePendingInvites(pendingList);
        setPending(pendingList);
      }

      setShowInvite(false);
      setInviteForm({ email: "", cockpitRole: "client", specialty: "", hourly_rate: "", company: "", phone: "" });
      load();
    } catch (err) {
      setInviteError(err?.response?.data?.message || err?.message || "Failed to invite user");
    }
    setInviting(false);
  };

  const removePending = (email) => {
    const updated = getPendingInvites().filter(p => p.email !== email);
    savePendingInvites(updated);
    setPending(updated);
  };

  // --- Edit ---
  const openEdit = (user) => {
    setEditing(user);
    setEditForm({
      role: hasCockpitRole(user) ? user.role : "",
      specialty: user.specialty || "",
      hourly_rate: user.hourly_rate ? String(user.hourly_rate) : "",
      company: user.company || "",
      phone: user.phone || "",
      status: user.status || "active",
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    const payload = {
      role: editForm.role,
      specialty: editForm.role === "professional" ? editForm.specialty : "",
      hourly_rate: editForm.role === "professional" && editForm.hourly_rate ? parseFloat(editForm.hourly_rate) : null,
      company: editForm.role === "client" ? editForm.company : "",
      phone: editForm.phone,
      status: editForm.status,
    };
    await base44.entities.User.update(editing.id, payload);
    setEditing(null);
    load();
  };

  // --- Deactivate ---
  const handleDeactivate = async () => {
    if (!confirmDelete) return;
    await base44.entities.User.update(confirmDelete.id, { status: "inactive" });
    setConfirmDelete(null);
    load();
  };

  // --- Permanent delete ---
  const handlePermanentDelete = async () => {
    if (!confirmDelete) return;
    await base44.entities.User.delete(confirmDelete.id);
    setConfirmDelete(null);
    load();
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.company || "").toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeUsers = users.filter(u => u.status !== "inactive");
  const roleCounts = { admin: 0, pm: 0, professional: 0, client: 0 };
  activeUsers.forEach(u => { if (u.role && roleCounts[u.role] !== undefined) roleCounts[u.role]++; });
  const unconfigured = activeUsers.filter(u => !hasCockpitRole(u));

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Invite users and assign cockpit roles">
        <Button onClick={() => setShowInvite(true)} className="gap-2"><Mail className="w-4 h-4" /> Invite User</Button>
      </PageHeader>

      {/* Pending invites */}
      {pending.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-800">Pending Invites ({pending.length})</p>
          </div>
          <p className="text-xs text-blue-700 mb-3">These users have been invited but haven't signed up yet. Their role will be applied automatically when they join.</p>
          <div className="space-y-2">
            {pending.map(inv => (
              <div key={inv.email} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-100">
                <div>
                  <p className="text-sm font-medium">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadgeClass(inv.cockpitRole)}`}>
                      {roleLabel(inv.cockpitRole)}
                    </span>
                    {inv.cockpitRole === "professional" && inv.specialty && <span className="text-[10px] text-muted-foreground">{inv.specialty}</span>}
                    {inv.cockpitRole === "client" && inv.company && <span className="text-[10px] text-muted-foreground">{inv.company}</span>}
                    <span className="text-[10px] text-muted-foreground">Invited {new Date(inv.invitedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500" onClick={() => removePending(inv.email)} title="Remove">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unconfigured users alert */}
      {unconfigured.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{unconfigured.length} user{unconfigured.length > 1 ? "s" : ""} need a cockpit role</p>
            <p className="text-xs text-amber-700 mt-0.5">Click edit to assign them as PM, Professional, or Client.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {unconfigured.map(u => (
                <button key={u.id} onClick={() => openEdit(u)}
                  className="text-xs bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 hover:bg-amber-100 transition-colors text-amber-800 font-medium">
                  {u.full_name || u.email} — Set Role
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { role: "admin", label: "Admins" },
          { role: "pm", label: "Project Managers" },
          { role: "professional", label: "Professionals" },
          { role: "client", label: "Clients" },
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
                {["User", "Cockpit Role", "Details", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5}><div className="h-4 bg-muted rounded animate-pulse mx-4 my-3" /></td></tr>)
              ) : filtered.length > 0 ? filtered.map(u => (
                <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${!hasCockpitRole(u) ? "bg-amber-50/50" : ""}`}>
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
                    {hasCockpitRole(u) ? (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleBadgeClass(u.role)}`}>
                        {roleLabel(u.role)}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.role === "professional" && u.specialty && <span>{u.specialty} · R${u.hourly_rate || 0}/hr</span>}
                    {u.role === "client" && u.company && <span>{u.company}</span>}
                    {u.phone && <span className="block">{u.phone}</span>}
                    {!hasCockpitRole(u) && <span className="text-amber-600">Needs role assignment</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.status || "active"} size="xs" /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(u)} title="Edit user">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {u.role !== "admin" && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => setConfirmDelete(u)} title="Deactivate user">
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
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
              <Input type="email" placeholder="user@example.com" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Cockpit Role</label>
              <Select value={inviteForm.cockpitRole} onValueChange={v => setInviteForm({ ...inviteForm, cockpitRole: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteForm.cockpitRole === "professional" && (
              <>
                <Input placeholder="Specialty (e.g. Designer, Developer)" value={inviteForm.specialty} onChange={e => setInviteForm({ ...inviteForm, specialty: e.target.value })} />
                <Input type="number" placeholder="Hourly Rate (R$)" value={inviteForm.hourly_rate} onChange={e => setInviteForm({ ...inviteForm, hourly_rate: e.target.value })} />
              </>
            )}
            {inviteForm.cockpitRole === "client" && (
              <Input placeholder="Company Name" value={inviteForm.company} onChange={e => setInviteForm({ ...inviteForm, company: e.target.value })} />
            )}
            <Input placeholder="Phone (optional)" value={inviteForm.phone} onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })} />
            {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteForm.email}>{inviting ? "Sending..." : "Send Invite"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit role dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configure User — {editing?.full_name || editing?.email}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Cockpit Role</label>
              <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.role === "professional" && (
              <>
                <Input placeholder="Specialty (e.g. Designer, Developer)" value={editForm.specialty} onChange={e => setEditForm({ ...editForm, specialty: e.target.value })} />
                <Input type="number" placeholder="Hourly Rate (R$)" value={editForm.hourly_rate} onChange={e => setEditForm({ ...editForm, hourly_rate: e.target.value })} />
              </>
            )}
            {editForm.role === "client" && (
              <Input placeholder="Company Name" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} />
            )}
            <Input placeholder="Phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
              <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!editForm.role}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete / Deactivate confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove User — {confirmDelete?.full_name || confirmDelete?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-800">Deactivate</p>
              <p className="text-xs text-amber-700 mt-0.5">Block access but keep their data. Can be reactivated later.</p>
              <Button className="mt-2 bg-amber-600 hover:bg-amber-700" size="sm" onClick={handleDeactivate}>Deactivate User</Button>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800">Permanently Delete</p>
              <p className="text-xs text-red-700 mt-0.5">Remove the user and all their data. This cannot be undone.</p>
              <Button variant="destructive" className="mt-2" size="sm" onClick={handlePermanentDelete}>Delete Permanently</Button>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
