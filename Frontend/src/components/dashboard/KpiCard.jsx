export default function KpiCard({ title, value, subtitle, icon: Icon, tone = "violet" }) {
  const tones = {
    violet: "bg-[#8338EC]/10 text-[#8338EC] border-[#8338EC]/25",
    orange: "bg-[#FB5607]/10 text-[#FB5607] border-[#FB5607]/25",
    ash: "bg-[#212529]/8 text-[#212529] border-[#212529]/20",
  };

  return (
    <div className="rounded-lg border border-zinc-300/80 bg-white p-5 shadow-2xs transition-all duration-150 hover:border-[#8338EC]/45">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#212529]/60">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#212529] tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-[#212529]/60">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`rounded-md border p-2 ${tones[tone] || tones.violet}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
