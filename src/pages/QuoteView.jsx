import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/api/client";
import { CheckCircle2, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUOTES_KEY = "angel_fly_quotes";

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function normalizeApiQuote(row) {
  const metadata = parseJson(row?.metadata, {}) || {};
  const embedded = (metadata?.quote && typeof metadata.quote === "object") ? metadata.quote : metadata;
  return {
    id: `api-${row.id}`,
    api_id: row.id,
    _source: "api",
    title: row.title || embedded.title || "Quote",
    description: row.description || embedded.description || "",
    client_name: row.client_name || embedded.client_name || "",
    client_company: embedded.client_company || row.client_name || "",
    client_email: embedded.client_email || "",
    client_logo: embedded.client_logo || "",
    notes: embedded.notes || "",
    valid_until: row.valid_until || embedded.valid_until || "",
    status: row.status || embedded.status || "pending",
    amount: parseFloat(row.amount) || parseFloat(embedded.amount) || 0,
    items: Array.isArray(embedded.items) ? embedded.items : [],
    created_at: row.created_date || row.created_at || embedded.created_at || new Date().toISOString(),
    metadata,
  };
}

export default function QuoteView() {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selections, setSelections] = useState({});

  useEffect(() => {
    const tryLoadQuote = async () => {
      const all = JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]");
      const isApiToken = /^api-\d+$/i.test(token || "");
      const apiId = isApiToken ? parseInt(String(token).replace(/^api-/i, ""), 10) : null;

      if (!isApiToken) {
        const found = all.find(q => q.id === token);
        if (found) { setQuote({ ...found, _source: "local" }); setLoading(false); return; }

        for (const q of all) {
          if (q.data_url && q.id === token) {
            try {
              const res = await fetch(q.data_url);
              const data = await res.json();
              setQuote({ ...data, _source: "local" });
              setLoading(false);
              return;
            } catch {
              // no-op
            }
          }
        }
      }

      if (apiId) {
        try {
          const row = await api.entities.Quote.get(apiId);
          setQuote(normalizeApiQuote(row));
          setLoading(false);
          return;
        } catch {
          // no-op
        }
      }

      setLoading(false);
    };

    tryLoadQuote();
  }, [token]);

  // Auto-select best value or last tier
  useEffect(() => {
    if (!quote?.items) return;
    const defaults = {};
    quote.items.forEach((item, iIdx) => {
      if (!item.pricing?.length) return;
      const bestIdx = item.pricing.findIndex(p => p.best_value);
      defaults[iIdx] = bestIdx >= 0 ? bestIdx : item.pricing.length - 1;
    });
    setSelections(defaults);
  }, [quote]);

  const handleApprove = async () => {
    setApproved("approved"); setSubmitted(true);
    if (quote?._source === "api" && quote?.api_id != null) {
      try {
        const selected_options = Object.entries(selections).map(([iIdx, pIdx]) => ({
          item: quote.items?.[iIdx]?.name,
          qty: quote.items?.[iIdx]?.pricing?.[pIdx]?.qty,
          label: quote.items?.[iIdx]?.pricing?.[pIdx]?.label,
          price: quote.items?.[iIdx]?.pricing?.[pIdx]?.price,
        }));
        const metadata = { ...(quote.metadata || {}), selected_options, approved_at: new Date().toISOString() };
        await api.entities.Quote.update(quote.api_id, { status: "approved", metadata });
      } catch {
        // no-op
      }
      return;
    }

    const all = JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]");
    const idx = all.findIndex(q => q.id === token);
    if (idx >= 0) {
      all[idx].status = "approved"; all[idx].approved_at = new Date().toISOString();
      all[idx].selected_options = Object.entries(selections).map(([iIdx, pIdx]) => ({
        item: quote.items?.[iIdx]?.name, qty: quote.items?.[iIdx]?.pricing?.[pIdx]?.qty,
        label: quote.items?.[iIdx]?.pricing?.[pIdx]?.label, price: quote.items?.[iIdx]?.pricing?.[pIdx]?.price,
      }));
      localStorage.setItem(QUOTES_KEY, JSON.stringify(all));
    }
  };

  const handleReject = async () => {
    setApproved("rejected"); setSubmitted(true);
    if (quote?._source === "api" && quote?.api_id != null) {
      try {
        const metadata = { ...(quote.metadata || {}), rejection_reason: feedback, rejected_at: new Date().toISOString() };
        await api.entities.Quote.update(quote.api_id, { status: "rejected", metadata });
      } catch {
        // no-op
      }
      return;
    }

    const all = JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]");
    const idx = all.findIndex(q => q.id === token);
    if (idx >= 0) { all[idx].status = "rejected"; all[idx].rejected_at = new Date().toISOString(); all[idx].rejection_reason = feedback; localStorage.setItem(QUOTES_KEY, JSON.stringify(all)); }
  };

  const totalPrice = Object.entries(selections).reduce((total, [iIdx, pIdx]) => {
    return total + (parseFloat(quote?.items?.[iIdx]?.pricing?.[pIdx]?.price || 0));
  }, 0);

  if (loading) return <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" /></div>;

  if (!quote) return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <div className="text-center"><p className="text-lg font-bold text-slate-700">Quote not found</p><p className="text-sm text-slate-500 mt-1">This link may have expired.</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f0]" style={{ fontFamily: "'Work Sans', system-ui, sans-serif" }}>
      <div className="max-w-xl mx-auto py-10 px-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            {quote.client_logo ? (
              <img src={quote.client_logo} alt="" className="w-14 h-14 rounded-full object-contain bg-white border-2 border-emerald-100 shadow-sm" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl shadow-sm">
                {(quote.client_company || quote.client_name || "Q").charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-800">{quote.client_company || quote.client_name}</h1>
              {quote.client_company && quote.client_name && quote.client_company !== quote.client_name && (
                <p className="text-xs text-slate-500">{quote.client_name}</p>
              )}
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 border border-slate-300 rounded-lg px-3 py-1.5 uppercase tracking-widest">{quote.title || "Quote"}</span>
        </div>

        {/* Items */}
        <div className="space-y-6">
          {quote.items?.map((item, iIdx) => {
            const isSelected = selections[iIdx] !== undefined;
            return (
              <div key={iIdx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Item header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start gap-4">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-lg border-2 border-emerald-100">
                        {(item.name || "?").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-slate-800">{item.name}</h2>
                      {item.specs?.length > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.specs.map(s => `${s.value}`).join(" · ")}
                        </p>
                      )}
                      {item.description && !item.specs?.length && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />}
                  </div>
                </div>

                {/* Pricing */}
                {item.pricing?.length > 0 && (
                  <div className="px-5 pb-5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Choose Quantity</p>
                    <div className={`grid gap-2 ${item.pricing.length <= 3 ? `grid-cols-${item.pricing.length}` : "grid-cols-2"}`} style={{ gridTemplateColumns: `repeat(${Math.min(item.pricing.length, 3)}, 1fr)` }}>
                      {item.pricing.map((p, pIdx) => {
                        const isActive = selections[iIdx] === pIdx;
                        const perUnit = p.qty && p.price ? (parseFloat(p.price) / parseFloat(String(p.qty).replace(/,/g, ""))).toFixed(2) : null;
                        return (
                          <button key={pIdx} onClick={() => setSelections(s => ({ ...s, [iIdx]: pIdx }))}
                            className={`relative text-left rounded-xl border-2 p-3 transition-all ${
                              isActive ? "border-emerald-400 bg-emerald-50/50" : "border-slate-200 hover:border-emerald-200"
                            }`}>
                            {p.best_value && (
                              <span className="absolute -top-2.5 right-2 text-[8px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">Best Value</span>
                            )}
                            <p className="text-sm font-semibold text-slate-800">
                              {p.qty} {p.label}
                            </p>
                            <p className={`text-base font-bold mt-0.5 ${isActive ? "text-emerald-700" : "text-slate-800"}`}>
                              ${parseFloat(p.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </p>
                            {perUnit && <p className="text-[10px] text-slate-400">${perUnit} each</p>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Notes */}
        {quote.notes && (
          <p className="text-xs text-slate-500 text-center mt-8">{quote.notes}</p>
        )}

        {/* Summary + Approve */}
        {!submitted && quote.status === "pending" && (
          <div className="mt-10">
            {/* Selection summary */}
            {Object.keys(selections).length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-slate-500 mb-2">
                  {quote.items?.map((item, iIdx) => {
                    if (selections[iIdx] === undefined) return null;
                    const sel = item.pricing[selections[iIdx]];
                    return `${sel.qty} ${sel.label} ${item.name}`;
                  }).filter(Boolean).join(" · ")}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Estimated total</span>
                  <span className="text-3xl font-bold text-slate-800">
                    ${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            <button onClick={handleApprove}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
              Approve Quote
            </button>

            <button onClick={() => setApproved("rejecting")}
              className="w-full py-3 mt-3 rounded-2xl text-slate-500 font-medium text-sm border border-slate-200 hover:bg-slate-50 transition-all">
              Request Changes
            </button>

            {approved === "rejecting" && (
              <div className="mt-4 space-y-3">
                <Textarea placeholder="What changes would you like?" value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} />
                <Button variant="outline" className="w-full" onClick={handleReject}>Submit Feedback</Button>
              </div>
            )}
          </div>
        )}

        {/* Submitted */}
        {submitted && (
          <div className="mt-10 text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${approved === "approved" ? "bg-emerald-100" : "bg-amber-100"}`}>
              {approved === "approved" ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <Star className="w-8 h-8 text-amber-600" />}
            </div>
            <p className="text-lg font-bold text-slate-800">{approved === "approved" ? "Quote Approved!" : "Feedback Submitted"}</p>
            <p className="text-sm text-slate-500 mt-1">{approved === "approved" ? "Thank you! We'll start working on it." : "We'll review your feedback and send an updated quote."}</p>
          </div>
        )}

        {quote.status !== "pending" && !submitted && (
          <div className="mt-10 text-center">
            <p className={`text-sm font-semibold ${quote.status === "approved" ? "text-emerald-600" : "text-amber-600"}`}>
              This quote has been {quote.status}.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[9px] text-slate-300 uppercase tracking-[0.3em]">Powered by Angel Fly Marketing</p>
        </div>
      </div>
    </div>
  );
}
