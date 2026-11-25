import { ALERT_TYPE_META, STOCK_STATUS_META } from "../../utils/formatters";

export function StockStatusBadge({ status }) {
  const meta = STOCK_STATUS_META[status] || {
    label: status,
    dotClass: "bg-zinc-500",
    badgeClass: "bg-zinc-100 text-zinc-700 border border-zinc-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium tracking-tight ${meta.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-xs ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}

export function AlertTypeBadge({ alertType }) {
  const meta = ALERT_TYPE_META[alertType] || {
    label: alertType,
    dotClass: "bg-zinc-500",
    badgeClass: "bg-zinc-100 text-zinc-700 border border-zinc-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium tracking-tight ${meta.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-xs ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}
