import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { Plus, Star, Upload, Link2, X, FileText, Film, Image, ExternalLink } from "lucide-react";
import { filterMyRecords } from "@/lib/entity-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

function StarRating({ value, onChange, readonly }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          <Star
            className={`w-5 h-5 ${(hover || value) >= star ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ClientTickets() {
  const { user } = useOutletContext();
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [ratingTicket, setRatingTicket] = useState(null);
  const [rating, setRating] = useState(0);
  const [form, setForm] = useState({ project_id: "", category: "question", subject: "", description: "", priority: "medium" });
  const [attachments, setAttachments] = useState([]);
  const [linkInput, setLinkInput] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      filterMyRecords(base44.entities.Ticket, "client_id", user, "client_name"),
      filterMyRecords(base44.entities.Project, "client_id", user, "client_name"),
    ]).then(([t, p]) => { setTickets(t); setProjects(p); setLoading(false); });
  }, [user]);

  const load = async () => {
    const t = await filterMyRecords(base44.entities.Ticket, "client_id", user, "client_name");
    setTickets(t);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const type = file.type.startsWith("video") ? "video" : file.type.startsWith("image") ? "image" : "file";
        setAttachments(prev => [...prev, { url: file_url, name: file.name, type }]);
      } catch { /* ignore */ }
    }
    setUploading(false);
    e.target.value = "";
  };

  const addLink = () => {
    if (!linkInput.trim()) return;
    setAttachments(prev => [...prev, { url: linkInput.trim(), name: linkInput.trim(), type: "link" }]);
    setLinkInput("");
  };

  const removeAttachment = (idx) => setAttachments(prev => prev.filter((_, i) => i !== idx));

  const handleCreate = async () => {
    const proj = projects.find(p => p.id === form.project_id);
    await base44.entities.Ticket.create({
      ...form,
      client_id: user.id,
      client_name: user.full_name,
      project_name: proj?.name || "",
      status: "open",
      attachments: attachments.map(a => a.url),
    });
    setShowCreate(false);
    setForm({ project_id: "", category: "question", subject: "", description: "", priority: "medium" });
    setAttachments([]);
    load();
  };

  const handleRate = async () => {
    if (!ratingTicket || !rating) return;
    await base44.entities.Ticket.update(ratingTicket.id, { satisfaction_rating: rating });
    setRatingTicket(null);
    setRating(0);
    load();
  };

  const resolved = tickets.filter(t => (t.status === "resolved" || t.status === "closed") && !t.satisfaction_rating);

  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" subtitle="Submit and track your support requests">
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Ticket</Button>
      </PageHeader>

      {/* Rating prompt for resolved tickets without rating */}
      {resolved.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">Rate your resolved tickets</p>
          <div className="space-y-2">
            {resolved.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                <span className="text-sm">{t.subject}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => { setRatingTicket(t); setRating(0); }}>
                  <Star className="w-3 h-3" /> Rate
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  {t.attachments?.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {t.attachments.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground hover:text-primary transition-colors">
                          <ExternalLink className="w-3 h-3" /> Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={t.category} size="xs" />
                  {t.estimated_resolution && (
                    <p className="text-xs text-muted-foreground mt-1">Est: {new Date(t.estimated_resolution).toLocaleDateString()}</p>
                  )}
                  {t.satisfaction_rating && (
                    <div className="mt-1.5">
                      <StarRating value={t.satisfaction_rating} readonly />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">No tickets yet. Need help?</div>
      )}

      {/* Create ticket dialog */}
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

            {/* Attachments */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground block">Attachments (optional)</label>

              {/* Uploaded items */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                      {a.type === "image" ? <Image className="w-4 h-4 text-blue-500 shrink-0" /> :
                       a.type === "video" ? <Film className="w-4 h-4 text-purple-500 shrink-0" /> :
                       a.type === "link" ? <Link2 className="w-4 h-4 text-emerald-500 shrink-0" /> :
                       <FileText className="w-4 h-4 text-muted-foreground shrink-0" />}
                      <span className="text-xs truncate flex-1">{a.name}</span>
                      <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload buttons */}
              <div className="flex gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Upload File
                  <input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors">
                  <Film className="w-3.5 h-3.5" /> Upload Video
                  <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
              {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}

              {/* Link input */}
              <div className="flex gap-2">
                <Input placeholder="Paste a link (Google Drive, Figma, Loom, etc.)" value={linkInput} onChange={e => setLinkInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addLink()} className="text-xs" />
                <Button variant="outline" size="sm" className="shrink-0 gap-1 text-xs" onClick={addLink} disabled={!linkInput.trim()}>
                  <Link2 className="w-3 h-3" /> Add
                </Button>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowCreate(false); setAttachments([]); setLinkInput(""); }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.subject}>Submit Ticket</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating dialog */}
      <Dialog open={!!ratingTicket} onOpenChange={() => { setRatingTicket(null); setRating(0); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rate this ticket resolution</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2 text-center">
            <p className="text-sm font-medium">{ratingTicket?.subject}</p>
            <p className="text-xs text-muted-foreground">How satisfied were you with the resolution?</p>
            <div className="flex justify-center">
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => { setRatingTicket(null); setRating(0); }}>Skip</Button>
              <Button onClick={handleRate} disabled={!rating}>Submit Rating</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
