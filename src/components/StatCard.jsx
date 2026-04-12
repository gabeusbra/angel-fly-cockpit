const iconBg = {
  primary: "bg-orange-50 text-orange-500",
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-500",
  blue: "bg-blue-50 text-blue-600",
  yellow: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
};

export default function StatCard({ label, value, subtitle, icon: Icon, trend, color = "primary" }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg[color] || iconBg.primary} group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}