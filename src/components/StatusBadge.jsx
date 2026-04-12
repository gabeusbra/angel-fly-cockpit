const statusStyles = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  backlog: "bg-slate-100 text-slate-600 border-slate-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  review: "bg-purple-100 text-purple-700 border-purple-200",
  client_approval: "bg-orange-100 text-orange-700 border-orange-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  open: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  requested: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
  bug: "bg-red-100 text-red-700 border-red-200",
  change_request: "bg-purple-100 text-purple-700 border-purple-200",
  complaint: "bg-orange-100 text-orange-700 border-orange-200",
  question: "bg-blue-100 text-blue-700 border-blue-200",
};

const labels = {
  in_progress: "In Progress",
  client_approval: "Client Approval",
  change_request: "Change Request",
};

export default function StatusBadge({ status, size = "sm" }) {
  if (!status) return null;
  const style = statusStyles[status] || "bg-slate-100 text-slate-600 border-slate-200";
  const label = labels[status] || (status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "));
  const sizeClass = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${style} ${sizeClass}`}>
      {label}
    </span>
  );
}