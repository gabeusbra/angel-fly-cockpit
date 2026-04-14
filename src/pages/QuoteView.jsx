import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, X, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUOTES_KEY = "angel_fly_quotes";

export default function QuoteView() {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Try localStorage first
    const all = JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]");
    const found = all.find(q => q.id === token);
    if (found) { setQuote(found); setLoading(false); return; }

    // Try fetching from data_url if stored
    const tryFetch = async () => {
      for (const q of all) {
        if (q.data_url && q.id === token) {
          try {
            const res = await fetch(q.data_url);
            const data = await res.json();
            setQuote(data); setLoading(false); return;
          } catch { /* ignore */ }
        }
      }
      setLoading(false);
    };
    tryFetch();
  }, [token]);

  const handleApprove = () => {
    setApproved("approved");
    setSubmitted(true);
    // Update in localStorage
    const all = JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]");
    const idx = all.findIndex(q => q.id === token);
    if (idx >= 0) { all[idx].status = "approved"; all[idx].approved_at = new Date().toISOString(); localStorage.setItem(QUOTES_KEY, JSON.stringify(all)); }
  };

  const handleReject = () => {
    setApproved("rejected");
    setSubmitted(true);
    const all = JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]");
    const idx = all.findIndex(q => q.id === token);
    if (idx >= 0) { all[idx].status = "rejected"; all[idx].rejected_at = new Date().toISOString(); all[idx].rejection_reason = feedback; localStorage.setItem(QUOTES_KEY, JSON.stringify(all)); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-700">Quote not found</p>
          <p className="text-sm text-slate-500 mt-1">This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const bestPricing = (item) => {
    const best = item.pricing?.find(p => p.best_value);
    const max = item.pricing?.reduce((a, b) => (parseFloat(b.price) || 0) > (parseFloat(a.price) || 0) ? b : a, item.pricing?.[0]);
    return best || max;
  };

  const lowestPrice = (item) => item.pricing?.reduce((a, b) => (parseFloat(a.price) || Infinity) < (parseFloat(b.price) || Infinity) ? a : b, item.pricing?.[0]);
  const highestPrice = (item) => item.pricing?.reduce((a, b) => (parseFloat(a.price) || 0) > (parseFloat(b.price) || 0) ? a : b, item.pricing?.[0]);

  const savings = (item) => {
    if (!item.pricing || item.pricing.length < 2) return null;
    const hi = parseFloat(highestPrice(item)?.price) || 0;
    const lo = parseFloat(lowestPrice(item)?.price) || 0;
    return hi > lo ? hi - lo : null;
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-2xl mx-auto py-12 px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            {quote.client_logo ? (
              <img src={quote.client_logo} alt="" className="w-12 h-12 rounded-full object-contain bg-white border border-slate-200" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                {(quote.client_company || quote.client_name || "Q").charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-800">{quote.client_company || quote.client_name}</h1>
              {quote.client_company && quote.client_name && <p className="text-xs text-slate-500">{quote.client_name}</p>}
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 border border-slate-300 rounded-lg px-3 py-1.5 uppercase tracking-wider">{quote.title || "Quote"}</span>
        </div>

        {/* Items */}
        {quote.items?.map((item, iIdx) => (
          <div key={iIdx} className="mb-10">
            {/* Item card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
              <div className="flex items-start gap-5">
                {item.image_url && (
                  <img src={item.image_url} alt="" className="w-24 h-24 rounded-xl object-cover border border-slate-100" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">{item.name}</h2>
                  {item.specs?.length > 0 && (
                    <div className="space-y-1">
                      {item.specs.map((s, i) => (
                        <p key={i} className="text-sm text-slate-600">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                          {s.label} <strong>{s.value}</strong>
                        </p>
                      ))}
                    </div>
                  )}
                  {item.description && <p className="text-sm text-slate-500 mt-2">{item.description}</p>}
                </div>
              </div>
            </div>

            {/* Pricing options */}
            {item.pricing?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Pricing Options</p>
                <div className="space-y-3">
                  {item.pricing.map((p, pIdx) => {
                    const perUnit = p.qty && p.price ? (parseFloat(p.price) / parseFloat(p.qty.replace(/,/g, ""))).toFixed(2) : null;
                    return (
                      <div key={pIdx} className={`rounded-xl border-2 p-4 flex items-center justify-between transition-all ${
                        p.best_value ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-white"
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-semibold text-slate-800">{p.qty}</span>
                          <span className="text-sm text-slate-500">{p.label}</span>
                          {p.best_value && (
                            <span className="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded-full uppercase">Best Value</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${p.best_value ? "text-emerald-700" : "text-slate-800"}`}>
                            R${parseFloat(p.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                          {perUnit && <p className="text-xs text-slate-400">R${perUnit} per {p.label?.replace(/s$/, "") || "unit"}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Savings */}
                {savings(item) && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <p className="text-sm text-emerald-700">
                      Save vs. {lowestPrice(item)?.qty} qty at {highestPrice(item)?.qty} qty
                    </p>
                    <p className="text-sm font-bold text-emerald-700">R${savings(item)?.toLocaleString("en-US", { minimumFractionDigits: 2 })} saved</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Notes */}
        {quote.notes && (
          <div className="border-t border-slate-200 pt-6 mb-8">
            <p className="text-sm text-slate-500 text-center">{quote.notes}</p>
          </div>
        )}

        {/* Valid until */}
        {quote.valid_until && (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-8">
            <Clock className="w-3.5 h-3.5" />
            <span>Valid until {new Date(quote.valid_until).toLocaleDateString()}</span>
          </div>
        )}

        {/* Approve / Reject */}
        {!submitted && quote.status === "pending" && (
          <div className="border-t border-slate-200 pt-8 space-y-4">
            <p className="text-center text-sm font-semibold text-slate-700">Would you like to approve this quote?</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleApprove} className="gap-2 bg-emerald-600 hover:bg-emerald-700 px-8">
                <CheckCircle2 className="w-4 h-4" /> Approve Quote
              </Button>
              <Button variant="outline" onClick={() => setApproved("rejecting")} className="gap-2 px-8 text-red-600 border-red-200 hover:bg-red-50">
                <X className="w-4 h-4" /> Request Changes
              </Button>
            </div>
            {approved === "rejecting" && (
              <div className="max-w-md mx-auto space-y-3">
                <Textarea placeholder="What changes would you like?" value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} />
                <Button variant="outline" className="w-full" onClick={handleReject}>Submit Feedback</Button>
              </div>
            )}
          </div>
        )}

        {/* Submitted state */}
        {submitted && (
          <div className="border-t border-slate-200 pt-8 text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${approved === "approved" ? "bg-emerald-100" : "bg-amber-100"}`}>
              {approved === "approved" ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <Star className="w-8 h-8 text-amber-600" />}
            </div>
            <p className="text-lg font-bold text-slate-800">{approved === "approved" ? "Quote Approved!" : "Feedback Submitted"}</p>
            <p className="text-sm text-slate-500 mt-1">{approved === "approved" ? "Thank you! We'll start working on it." : "We'll review your feedback and send an updated quote."}</p>
          </div>
        )}

        {quote.status !== "pending" && !submitted && (
          <div className="border-t border-slate-200 pt-8 text-center">
            <p className={`text-sm font-semibold ${quote.status === "approved" ? "text-emerald-600" : "text-amber-600"}`}>
              This quote has been {quote.status}.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-slate-300 uppercase tracking-widest">Powered by Angel Fly Marketing</p>
        </div>
      </div>
    </div>
  );
}
