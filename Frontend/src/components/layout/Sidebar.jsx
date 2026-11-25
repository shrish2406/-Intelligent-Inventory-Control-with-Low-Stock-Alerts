import {
  ArrowLeftRight,
  Bell,
  Boxes,
  LayoutDashboard,
  Package,
  Warehouse,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "warehouses", label: "Warehouses", icon: Warehouse },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "movements", label: "Stock Movements", icon: ArrowLeftRight },
  { id: "alerts", label: "Alerts", icon: Bell },
];

export default function Sidebar({
  activePage,
  onNavigate,
  activeAlertCount = 0,
  mobileOpen,
  onCloseMobile,
}) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#212529]/65 backdrop-blur-[1px] lg:hidden animate-fade-enter"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-black text-[#E9ECEF] border-r border-white/10 rounded-r-2xl lg:sticky lg:top-3 lg:h-[calc(100vh-1.5rem)] lg:my-3 lg:ml-3 lg:shrink-0 lg:rounded-2xl lg:border shadow-xl flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FB5607] text-white text-xs font-bold tracking-wider shadow-xs">
              SS
            </div>
            <div>
              <p className="font-display text-base font-bold tracking-tight text-white">
                SmartStock
              </p>
              <p className="text-[11px] text-[#E9ECEF]/65">Enterprise Inventory</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-[#E9ECEF]/70 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[#E9ECEF]/45">
            Operations
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`group relative w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${isActive
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-[#E9ECEF]/75 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#FB5607]" />
                )}
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-[#8338EC]" : "text-[#E9ECEF]/55 group-hover:text-white"
                      }`}
                  />
                  <span>{item.label}</span>
                </span>
                {item.id === "alerts" && activeAlertCount > 0 && (
                  <span className="rounded-full bg-[#FB5607] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                    {activeAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-3.5 text-[11px] text-[#E9ECEF]/55 flex items-center justify-between">
         
          <span className="text-[#E9ECEF]/40 font-mono">Built by Shrish Mhaske for Dot Konneckt Technical Assignment</span>
        </div>
      </aside>
    </>
  );
}
