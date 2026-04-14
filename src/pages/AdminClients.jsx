import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Pencil, Trash2, Building2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getClients, createClient, updateClient, deleteClient, syncLocalClients } from "@/lib/clients-store";

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: "", contact_name: "", email: "", phone: "", logo_url: "", address: "", notes: "", user_email: "", status: "active" });

  useEffect(() => {
    syncLocalClients().then(() => getClients().then(setClients));
    try { base44.entities.User.list().then(u => setUsers(u)); } catch { /* ignore */ }
  }, []);

  const reload = () => getClients().then(setClients);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", contact_name: "", email: "", phone: "", logo_url: "", address: "", notes: "", user_email: "", status: "active" });
    setShowForm(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({
      name: client.name || "", contact_name: client.contact_name || "",
      email: client.email || "", phone: client.phone || "",
      logo_url: client.logo_url || "", address: client.address || "",
      notes: client.notes || "", user_email: client.user_email || "",
      status: client.status || "active",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateClient(editing.id, form);
    } else {
      await createClient(form);
    }
    setShowForm(false);
    reload();
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      await deleteClient(confirmDelete.id);
      setConfirmDelete(null);
      reload();
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, logo_url: file_url }));
    } catch { /* ignore */ }
    setUploading(false);
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.contact_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Client</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-black/5 transition-all group">
              <div className="flex items-start gap-3 mb-4">
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" className="w-12 h-12 rounded-xl object-contain bg-white border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-emerald-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">{c.name}</h3>
                  {c.contact_name && <p className="text-xs text-muted-foreground">{c.contact_name}</p>}
                  {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {c.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              {c.phone && <p className="text-xs text-muted-foreground mb-1">{c.phone}</p>}
              {c.user_email && <p className="text-[10px] text-blue-600">Linked: {c.user_email}</p>}
              <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(c)}>
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-red-500 hover:text-red-700" onClick={() => setConfirmDelete(c)}>
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">No clients yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first client to get started</p>
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Client" : "Add Client"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Logo */}
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img src={form.logo_url} alt="" className="w-16 h-16 rounded-xl object-contain bg-white border border-border" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors w-fit">
                  <Upload className="w-3.5 h-3.5" /> Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                </label>
                {uploading && <p className="text-[10px] text-muted-foreground">Uploading...</p>}
                <Input placeholder="Or paste logo URL" value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} className="text-xs h-7" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Company / Business Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Garlic & Lemon" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Contact Person</label>
                <Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Phone</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Address</label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Link to User Account (optional)</label>
              <div className="flex gap-2">
                <Input placeholder="User email address" value={form.user_email} onChange={e => setForm({ ...form, user_email: e.target.value })} className="flex-1" />
                {form.user_email && (
                  <Button variant="ghost" size="sm" className="shrink-0 text-xs text-red-500" onClick={() => setForm({ ...form, user_email: "" })}>Clear</Button>
                )}
              </div>
              {users.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {users.filter(u => u.role === "client" || !u.role || u.role === "user").map(u => (
                    <button key={u.email || u.id} onClick={() => setForm({ ...form, user_email: u.email })}
                      className={`text-[10px] px-2 py-1 rounded-full transition-all ${form.user_email === u.email ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                      {u.full_name || u.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name}>{editing ? "Save Changes" : "Add Client"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Client</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm">Delete <strong>{confirmDelete?.name}</strong>? This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
