import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { alertsApi, extractErrorMessage } from "../services/api";
import { useToast } from "../components/common/ToastContext";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { AlertTypeBadge } from "../components/common/StatusBadge";
import { formatDateTime } from "../utils/formatters";

export default function AlertsPage({ refreshSignal, onAlertsChanged }) {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const loadAlerts = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (typeFilter) params.alert_type = typeFilter;
        const data = await alertsApi.list(params);
        setAlerts(data);
      } catch (err) {
        showToast(extractErrorMessage(err, "Failed to load alerts"), "error");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, typeFilter, showToast]
  );

  useEffect(() => {
    loadAlerts(false);
  }, [loadAlerts, refreshSignal]);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await alertsApi.resolve(id);
      showToast("Alert resolved", "success");
      onAlertsChanged?.();
      loadAlerts(true);
    } catch (err) {
      showToast(extractErrorMessage(err, "Failed to resolve alert"), "error");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-enter">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md bg-white border border-zinc-300/80 p-1">
          {[
            { value: "ACTIVE", label: "Active" },
            { value: "RESOLVED", label: "Resolved" },
            { value: "", label: "All" },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-sm px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${statusFilter === tab.value
                ? "bg-[#212529] text-white"
                : "text-[#212529]/65 hover:text-[#212529]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-[#212529] focus:border-[#8338EC] focus:outline-none transition-colors"
        >
          <option value="">All Alert Types</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="FAST_DEPLETION">Fast Depletion</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading alerts..." />
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={statusFilter === "ACTIVE" ? CheckCircle2 : Bell}
          title={statusFilter === "ACTIVE" ? "No active alerts" : "No alerts found"}
          description="Automated alerts appear here whenever stock drops below threshold, reaches zero, or depletes rapidly."
        />
      ) : (
        <div className="space-y-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-zinc-300/80 bg-white p-5 shadow-2xs transition-all duration-150 hover:border-[#8338EC]/45"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <AlertTypeBadge alertType={alert.alert_type} />
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${alert.status === "ACTIVE"
                      ? "bg-[#FB5607]/10 text-[#C2410C] border-[#FB5607]/35"
                      : "bg-[#E9ECEF] text-[#212529]/70 border-zinc-300"
                      }`}
                  >
                    {alert.status}
                  </span>
                  <span className="text-[11px] text-[#212529]/50">
                    {formatDateTime(alert.created_at)}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#212529]">{alert.message}</p>
                <p className="text-xs text-[#212529]/60">
                  Product: <span className="font-medium text-[#212529]">{alert.product_name}</span> ({alert.product_sku}) · Warehouse:{" "}
                  <span className="font-medium text-[#212529]">{alert.warehouse_name}</span>
                </p>
              </div>

              {alert.status === "ACTIVE" && (
                <button
                  type="button"
                  onClick={() => handleResolve(alert.id)}
                  disabled={resolvingId === alert.id}
                  className="shrink-0 rounded-md border border-[#8338EC]/35 bg-white px-3.5 py-2 text-xs font-medium text-[#8338EC] hover:bg-[#8338EC] hover:text-white hover:border-[#8338EC] transition-colors duration-150 disabled:opacity-50"
                >
                  {resolvingId === alert.id ? "Resolving..." : "Resolve Alert"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
