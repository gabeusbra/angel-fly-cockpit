import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { Plus, Trash2, Copy, ExternalLink, CheckCircle2, X, FileText, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const QUOTES_KEY = "angel_fly_quotes";
function getQuotes() { try { return JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]"); } catch { return []; } }
function saveQuotes(q) { localStorage.setItem(QUOTES_KEY, JSON.stringify(q)); }

export default function QuoteBuilder() {
  const { user } = useOutletContext();
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [showImportHtml, setShowImportHtml] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [importClient, setImportClient] = useState("");

  // Form state
  const [form, setForm] = useState({
    client_name: "", client_company: "", client_email: "", client_logo: "",
    title: "Quote", notes: "", valid_until: "",
    items: [{ name: "", description: "", image_url: "", specs: [], pricing: [{ qty: "", price: "", label: "", best_value: false }] }],
  });

  useEffect(() => {
    setQuotes(getQuotes());
    // Load clients from Client store (not User entity)
    import("@/lib/clients-store").then(({ getClients }) => {
      setClients(getClients().filter(c => c.status === "active"));
    });
  }, []);

  // Smart parser: paste raw text → structured quote
  const parseQuoteText = () => {
    if (!pasteText.trim()) return;
    const raw = pasteText.replace(/\r\n/g, "\n");
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);

    const items = [];
    let currentItem = null;
    let clientCompany = "";

    // Normalize dashes
    const norm = (s) => s.replace(/[—–]/g, "-").replace(/\s+/g, " ");

    // Detect a pricing line: must contain a number AND a price ($xxx or R$xxx)
    const isPricingLine = (line) => {
      const n = norm(line);
      return /[\d,]+\s*\w*.*?[\$][\d,.]+|[\$][\d,.]+.*?[\d,]+\s*\w*/i.test(n) ||
             /[\d,]+\s*\w*\s*[-]\s*[\$R]?\$?[\d,.]+/i.test(n);
    };

    // Extract qty, label, price from a pricing line
    const parsePriceLine = (line) => {
      const n = norm(line).replace(/[*•·🌟⭐✨]/g, "").trim();
      // Pattern: 1,000 stickers - $350 or $350 for 1,000 stickers
      let match = n.match(/([\d,]+)\s*([\w\s]*?)\s*[-:]\s*[\$R]?\$?([\d,.]+)/i);
      if (!match) match = n.match(/[\$R]?\$?([\d,.]+)\s*[-:for]*\s*([\d,]+)\s*([\w]*)/i);

      if (match) {
        const qty = match[1].trim();
        const label = match[2]?.trim().replace(/[-:]/g, "").trim() || "units";
        const price = match[3].replace(/,/g, "").trim();
        const bestValue = /best\s*value|recommended|popular|melhor|🌟|⭐/i.test(line);
        return { qty, label, price, best_value: bestValue };
      }

      // Fallback: just find a price
      const priceMatch = n.match(/[\$R]?\$?([\d,.]+)/);
      if (priceMatch) {
        return { qty: "1", label: "", price: priceMatch[1].replace(/,/g, ""), best_value: false };
      }
      return null;
    };

    // Detect spec line: "key: value" or "• key: value"
    const isSpecLine = (line) => /^[•·\-\*]?\s*.+?[:：]\s*.+/.test(line) && !isPricingLine(line);
    const parseSpecLine = (line) => {
      const m = line.match(/^[•·\-\*]?\s*(.+?)[:：]\s*(.+)/);
      return m ? { label: m[1].trim(), value: m[2].trim() } : null;
    };

    // First pass: find the item name (first line that's not a spec or price)
    let itemNameFound = false;

    for (const line of lines) {
      const cleaned = line.replace(/^[*•·\-]\s*/, "").trim();

      // Skip empty or emoji-only
      if (!cleaned || /^[🌟⭐✨💰🏷️]+$/.test(cleaned)) continue;

      // Pricing line
      if (isPricingLine(line)) {
        if (!currentItem) {
          currentItem = { name: "Item", description: "", image_url: "", specs: [], pricing: [] };
          items.push(currentItem);
        }
        const parsed = parsePriceLine(line);
        if (parsed) currentItem.pricing.push(parsed);
        continue;
      }

      // Spec line
      if (isSpecLine(line)) {
        if (!currentItem) {
          currentItem = { name: "Item", description: "", image_url: "", specs: [], pricing: [] };
          items.push(currentItem);
        }
        const spec = parseSpecLine(line);
        if (spec) currentItem.specs.push(spec);
        continue;
      }

      // First non-spec, non-price line = item name (or company if very short)
      if (!itemNameFound) {
        // If it contains product-like words or specs inline (dashes with dimensions)
        const hasProductInfo = /\d+["'"]|x\s*\d|sticker|label|card|banner|flyer|menu|logo|design|print|package/i.test(cleaned);

        if (hasProductInfo || cleaned.length > 20) {
          // This is the item name — might include inline specs
          const dashParts = cleaned.split(/\s*[-—–]\s*/);
          currentItem = { name: dashParts[0].trim(), description: dashParts.length > 1 ? dashParts.slice(1).join(" ") : "", image_url: "", specs: [], pricing: [] };
          items.push(currentItem);
          itemNameFound = true;
        } else {
          // Short text first = company name
          clientCompany = cleaned;
        }
        continue;
      }

      // Subsequent non-spec, non-price lines
      if (currentItem) {
        // If current item has pricing already, this might be a new item
        if (currentItem.pricing.length > 0 && cleaned.length < 60 && !isPricingLine(line)) {
          currentItem = { name: cleaned, description: "", image_url: "", specs: [], pricing: [] };
          items.push(currentItem);
        } else if (currentItem.name === "Item") {
          currentItem.name = cleaned;
        } else {
          currentItem.description += (currentItem.description ? "\n" : "") + cleaned;
        }
      }
    }

    // Ensure at least one item with pricing
    if (items.length === 0) {
      items.push({ name: lines[0] || "Item", description: "", image_url: "", specs: [], pricing: [{ qty: "", price: "", label: "", best_value: false }] });
    }
    items.forEach(item => {
      if (item.pricing.length === 0) item.pricing.push({ qty: "", price: "", label: "", best_value: false });
    });

    setForm(f => ({
      ...f,
      client_company: clientCompany || f.client_company,
      items,
    }));
    setShowPaste(false);
    setPasteText("");
    setShowCreate(true);
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { name: "", description: "", image_url: "", specs: [], pricing: [{ qty: "", price: "", label: "", best_value: false }] }] }));
  };

  const removeItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx, field, value) => {
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));
  };

  const addPricing = (itemIdx) => {
    setForm(f => ({
      ...f, items: f.items.map((item, i) => i === itemIdx
        ? { ...item, pricing: [...item.pricing, { qty: "", price: "", label: "", best_value: false }] }
        : item)
    }));
  };

  const updatePricing = (itemIdx, priceIdx, field, value) => {
    setForm(f => ({
      ...f, items: f.items.map((item, i) => i === itemIdx
        ? { ...item, pricing: item.pricing.map((p, j) => j === priceIdx ? { ...p, [field]: value } : field === "best_value" && value ? { ...p, best_value: false } : p) }
        : item)
    }));
  };

  const removePricing = (itemIdx, priceIdx) => {
    setForm(f => ({
      ...f, items: f.items.map((item, i) => i === itemIdx
        ? { ...item, pricing: item.pricing.filter((_, j) => j !== priceIdx) }
        : item)
    }));
  };

  const addSpec = (itemIdx) => {
    updateItem(itemIdx, "specs", [...form.items[itemIdx].specs, { label: "", value: "" }]);
  };

  const handleGenerate = async () => {
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const quote = {
      ...form,
      id: token,
      created_at: new Date().toISOString(),
      created_by: user?.full_name || user?.email || "Admin",
      status: "pending",
      items: form.items.filter(i => i.name),
    };

    // Upload quote as JSON file
    try {
      const blob = new Blob([JSON.stringify(quote)], { type: "application/json" });
      const file = new File([blob], `quote_${token}.json`, { type: "application/json" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      quote.data_url = file_url;
    } catch { /* ignore */ }

    const all = getQuotes();
    all.unshift(quote);
    saveQuotes(all);
    setQuotes(all);
    setShowCreate(false);
    setForm({
      client_name: "", client_company: "", client_email: "", client_logo: "",
      title: "Quote", notes: "", valid_until: "",
      items: [{ name: "", description: "", image_url: "", specs: [], pricing: [{ qty: "", price: "", label: "", best_value: false }] }],
    });
  };

  const getQuoteUrl = (q) => q.is_html && q.html_url ? q.html_url : `${window.location.origin}/quote/${q.id}`;

  const copyLink = (q) => {
    navigator.clipboard.writeText(getQuoteUrl(q));
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteQuote = (id) => {
    const updated = quotes.filter(q => q.id !== id);
    saveQuotes(updated);
    setQuotes(updated);
  };

  // Import HTML as a quote
  const handleHtmlFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setHtmlContent(ev.target?.result || "");
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportHtml = async () => {
    if (!htmlContent) return;
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const client = clients.find(c => c.id === importClient);

    // Upload HTML as file
    let dataUrl = "";
    try {
      const blob = new Blob([htmlContent], { type: "text/html" });
      const file = new File([blob], `quote_html_${token}.html`, { type: "text/html" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      dataUrl = file_url;
    } catch { /* ignore */ }

    const quote = {
      id: token,
      title: "Imported Quote",
      client_name: client?.contact_name || client?.name || "",
      client_company: client?.name || "",
      client_email: client?.email || "",
      client_logo: client?.logo_url || "",
      items: [],
      notes: "",
      html_url: dataUrl,
      is_html: true,
      created_at: new Date().toISOString(),
      created_by: user?.full_name || user?.email || "Admin",
      status: "pending",
    };

    const all = getQuotes();
    all.unshift(quote);
    saveQuotes(all);
    setQuotes(all);
    setShowImportHtml(false);
    setHtmlContent("");
    setImportClient("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
          <p className="text-sm text-muted-foreground mt-1">{quotes.length} quote{quotes.length !== 1 ? "s" : ""} created</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportHtml(true)} className="gap-2"><Upload className="w-4 h-4" /> Import HTML</Button>
          <Button variant="outline" onClick={() => setShowPaste(true)} className="gap-2"><Sparkles className="w-4 h-4" /> Paste & Generate</Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Quote</Button>
        </div>
      </div>

      {/* Quote list */}
      {quotes.length > 0 ? (
        <div className="space-y-3">
          {quotes.map(q => (
            <div key={q.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{q.title || "Quote"}</h3>
                    <p className="text-xs text-muted-foreground">{q.client_company || q.client_name} · {q.items?.length || 0} item{(q.items?.length || 0) !== 1 ? "s" : ""} · {new Date(q.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${q.status === "approved" ? "bg-emerald-100 text-emerald-700" : q.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {q.status === "approved" ? "Approved" : q.status === "rejected" ? "Rejected" : "Pending"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => copyLink(q)}>
                  {copiedId === q.id ? <><CheckCircle2 className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Link</>}
                </Button>
                <a href={getQuoteUrl(q)} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1"><ExternalLink className="w-3 h-3" /> Preview</Button>
                </a>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500 hover:text-red-700 gap-1" onClick={() => deleteQuote(q.id)}>
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
                <div className="flex-1" />
                <p className="text-xs text-muted-foreground">
                  Total: R${q.items?.reduce((s, i) => s + Math.max(...(i.pricing?.map(p => parseFloat(p.price) || 0) || [0])), 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">No quotes yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first quote for a client</p>
        </div>
      )}

      {/* Create quote dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Quote</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-2">

            {/* Client info */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</p>
              {clients.length > 0 && (
                <Select onValueChange={v => {
                  const c = clients.find(cl => cl.id === v);
                  if (c) setForm(f => ({ ...f, client_name: c.contact_name || c.name || "", client_company: c.name || "", client_email: c.email || "", client_logo: c.logo_url || "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.contact_name ? ` — ${c.contact_name}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Client Name" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
                <Input placeholder="Company Name" value={form.client_company} onChange={e => setForm({ ...form, client_company: e.target.value })} />
              </div>
              <Input placeholder="Client Email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} />
              <Input placeholder="Logo URL (optional)" value={form.client_logo} onChange={e => setForm({ ...form, client_logo: e.target.value })} />
            </div>

            {/* Quote info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Quote Title</label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Valid Until</label>
                <Input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</p>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addItem}><Plus className="w-3 h-3" /> Add Item</Button>
              </div>

              {form.items.map((item, iIdx) => (
                <div key={iIdx} className="border border-border rounded-xl p-4 mb-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Item {iIdx + 1}</span>
                    {form.items.length > 1 && (
                      <button onClick={() => removeItem(iIdx)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                  <Input placeholder="Item Name (e.g. Custom Roll Labels)" value={item.name} onChange={e => updateItem(iIdx, "name", e.target.value)} />
                  <Textarea placeholder="Description" value={item.description} onChange={e => updateItem(iIdx, "description", e.target.value)} rows={2} />

                  {/* Image upload + preview */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-2">Item Image</label>
                    <div className="flex items-start gap-3">
                      {item.image_url ? (
                        <div className="relative group">
                          <img src={item.image_url} alt="" className="w-20 h-20 rounded-xl object-cover border border-border" />
                          <button onClick={() => updateItem(iIdx, "image_url", "")}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-[10px]">
                          No image
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors w-fit">
                          <Plus className="w-3.5 h-3.5" /> Upload Image
                          <input type="file" accept="image/*" className="hidden" disabled={uploadingImage === iIdx} onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingImage(iIdx);
                            try {
                              const { file_url } = await base44.integrations.Core.UploadFile({ file });
                              updateItem(iIdx, "image_url", file_url);
                            } catch { /* ignore */ }
                            setUploadingImage(null);
                            e.target.value = "";
                          }} />
                        </label>
                        {uploadingImage === iIdx && <p className="text-[10px] text-muted-foreground">Uploading...</p>}
                        <Input placeholder="Or paste image URL" value={item.image_url} onChange={e => updateItem(iIdx, "image_url", e.target.value)} className="text-xs h-8" />
                      </div>
                    </div>
                  </div>

                  {/* Specs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Specs</span>
                      <button onClick={() => addSpec(iIdx)} className="text-[10px] text-primary font-medium hover:underline">+ Add Spec</button>
                    </div>
                    {item.specs.map((spec, sIdx) => (
                      <div key={sIdx} className="flex gap-2 mb-1">
                        <Input placeholder="Label" value={spec.label} className="text-xs h-8" onChange={e => {
                          const specs = [...item.specs]; specs[sIdx] = { ...specs[sIdx], label: e.target.value };
                          updateItem(iIdx, "specs", specs);
                        }} />
                        <Input placeholder="Value" value={spec.value} className="text-xs h-8" onChange={e => {
                          const specs = [...item.specs]; specs[sIdx] = { ...specs[sIdx], value: e.target.value };
                          updateItem(iIdx, "specs", specs);
                        }} />
                      </div>
                    ))}
                  </div>

                  {/* Pricing tiers */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Pricing Options</span>
                      <button onClick={() => addPricing(iIdx)} className="text-[10px] text-primary font-medium hover:underline">+ Add Tier</button>
                    </div>
                    {item.pricing.map((p, pIdx) => (
                      <div key={pIdx} className="flex gap-2 mb-2 items-center">
                        <Input placeholder="Qty (e.g. 1,000)" value={p.qty} className="text-xs h-8" onChange={e => updatePricing(iIdx, pIdx, "qty", e.target.value)} />
                        <Input placeholder="Label (e.g. stickers)" value={p.label} className="text-xs h-8" onChange={e => updatePricing(iIdx, pIdx, "label", e.target.value)} />
                        <Input placeholder="Price" type="number" value={p.price} className="text-xs h-8" onChange={e => updatePricing(iIdx, pIdx, "price", e.target.value)} />
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                          <input type="checkbox" checked={p.best_value} onChange={e => updatePricing(iIdx, pIdx, "best_value", e.target.checked)} className="rounded" />
                          Best
                        </label>
                        {item.pricing.length > 1 && (
                          <button onClick={() => removePricing(iIdx, pIdx)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Textarea placeholder="Additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={!form.items.some(i => i.name)}>Generate Quote</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paste & Generate dialog */}
      <Dialog open={showPaste} onOpenChange={setShowPaste}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Paste & Generate</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Paste your quote info in any format — item names, specs, pricing, client details. The parser will extract and structure it automatically.
            </p>
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Example:</p>
              <p>Garlic & Lemon</p>
              <p>Custom Roll Labels</p>
              <p>Size: 1" x 1"</p>
              <p>Format: Roll labels</p>
              <p>1,000 stickers - $350.00</p>
              <p>1,500 stickers - $375.00</p>
              <p>2,000 stickers - $440.00 BEST VALUE</p>
            </div>
            <Textarea
              placeholder="Paste your quote info here..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowPaste(false); setPasteText(""); }}>Cancel</Button>
              <Button onClick={parseQuoteText} disabled={!pasteText.trim()} className="gap-2">
                <Sparkles className="w-4 h-4" /> Generate Quote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import HTML dialog */}
      <Dialog open={showImportHtml} onOpenChange={setShowImportHtml}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Import HTML Quote</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">Upload an HTML file or paste HTML code. Select a client to connect it to.</p>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Client</label>
              {clients.length > 0 ? (
                <Select value={importClient} onValueChange={setImportClient}>
                  <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.contact_name ? ` — ${c.contact_name}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">No clients in database. Add clients first.</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">HTML File</label>
              <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                {htmlContent ? "File loaded — click to replace" : "Click to upload .html file"}
                <input type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlFileUpload} />
              </label>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Or paste HTML code</label>
              <Textarea placeholder="<html>..." value={htmlContent} onChange={e => setHtmlContent(e.target.value)} rows={6} className="font-mono text-xs" />
            </div>

            {htmlContent && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700">
                HTML loaded ({Math.round(htmlContent.length / 1024)}KB)
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowImportHtml(false); setHtmlContent(""); setImportClient(""); }}>Cancel</Button>
              <Button onClick={handleImportHtml} disabled={!htmlContent || !importClient}>Import Quote</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
