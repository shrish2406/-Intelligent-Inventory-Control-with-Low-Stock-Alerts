export function formatDateTime(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const STOCK_STATUS_META = {
  IN_STOCK: {
    label: "In Stock",
    dotClass: "bg-[#8338EC]",
    badgeClass: "bg-[#8338EC]/10 text-[#6E28D9] border border-[#8338EC]/30",
  },
  LOW_STOCK: {
    label: "Low Stock",
    dotClass: "bg-[#FB5607]",
    badgeClass: "bg-[#FB5607]/10 text-[#C2410C] border border-[#FB5607]/35",
  },
  OUT_OF_STOCK: {
    label: "Out of Stock",
    dotClass: "bg-[#FB5607]",
    badgeClass: "bg-[#FB5607]/15 text-[#9A3412] border border-[#FB5607]/45",
  },
};

export const ALERT_TYPE_META = {
  OUT_OF_STOCK: {
    label: "Out of Stock",
    dotClass: "bg-[#FB5607]",
    badgeClass: "bg-[#FB5607]/15 text-[#9A3412] border border-[#FB5607]/45",
  },
  LOW_STOCK: {
    label: "Low Stock",
    dotClass: "bg-[#FB5607]",
    badgeClass: "bg-[#FB5607]/10 text-[#C2410C] border border-[#FB5607]/35",
  },
  FAST_DEPLETION: {
    label: "Fast Depletion",
    dotClass: "bg-[#8338EC]",
    badgeClass: "bg-[#8338EC]/10 text-[#6E28D9] border border-[#8338EC]/30",
  },
};
