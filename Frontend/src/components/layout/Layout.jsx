import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

const PAGE_TITLES = {
  overview: { title: "Overview", subtitle: "Real-time inventory health and movement analytics" },
  products: { title: "Products", subtitle: "Manage product catalog, SKUs, and minimum stock thresholds" },
  warehouses: { title: "Warehouses", subtitle: "Manage storage locations and distribution hubs" },
  inventory: { title: "Inventory", subtitle: "Live stock levels across all products and warehouses" },
  movements: { title: "Stock Movements", subtitle: "Record inbound/outbound stock and audit history" },
  alerts: { title: "Alerts", subtitle: "Automated low-stock, out-of-stock, and fast-depletion alerts" },
};

export default function Layout({
  activePage,
  onNavigate,
  wsStatus,
  activeAlertCount,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = PAGE_TITLES[activePage] || PAGE_TITLES.overview;

  const wsBadge = {
    connected: {
      text: "Live Connected",
      dot: "bg-[#8338EC]",
      cls: "bg-[#8338EC]/10 text-[#6E28D9] border-[#8338EC]/30",
    },
    connecting: {
      text: "Connecting...",
      dot: "bg-[#FB5607] animate-pulse",
      cls: "bg-[#FB5607]/10 text-[#FB5607] border-[#FB5607]/35",
    },
    disconnected: {
      text: "Reconnecting...",
      dot: "bg-[#FB5607]",
      cls: "bg-[#FB5607]/10 text-[#FB5607] border-[#FB5607]/35",
    },
  }[wsStatus] || {
    text: "Offline",
    dot: "bg-zinc-400",
    cls: "bg-[#E9ECEF] text-[#212529] border-zinc-300",
  };

  return (
    <div className="min-h-screen flex bg-[#E9ECEF] text-[#212529]">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        activeAlertCount={activeAlertCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-20 px-4 sm:px-8 pt-3 max-w-7xl w-full mx-auto">
          <header className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-300/80 bg-white/90 backdrop-blur-md shadow-xs px-5 py-3.5 transition-all duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl p-2 text-[#212529] hover:bg-[#E9ECEF] transition-colors lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#212529] truncate">
                  {meta.title}
                </h1>
                <p className="text-xs sm:text-sm text-[#212529]/60 truncate">{meta.subtitle}</p>
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-xs font-medium shrink-0 transition-colors duration-150 ${wsBadge.cls}`}
            >
              <span className={`h-2 w-2 rounded-full ${wsBadge.dot}`} />
              <span>{wsBadge.text}</span>
            </div>
          </header>
        </div>

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
