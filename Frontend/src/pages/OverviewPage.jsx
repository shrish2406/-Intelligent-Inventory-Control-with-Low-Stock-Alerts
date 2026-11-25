import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Boxes,
  CheckCircle2,
  Package,
  Warehouse,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { alertsApi, dashboardApi, extractErrorMessage } from "../services/api";
import { useToast } from "../components/common/ToastContext";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { AlertTypeBadge } from "../components/common/StatusBadge";
import KpiCard from "../components/dashboard/KpiCard";
import { formatDateTime, formatShortDate } from "../utils/formatters";

const PIE_COLORS = ["#8338EC", "#FB5607", "#212529", "#A855F7", "#FD7E14", "#495057"];

export default function OverviewPage({ refreshSignal, onNavigate, onAlertsChanged }) {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState(null);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [statsData, trendsData, distData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getMovementTrends(14),
        dashboardApi.getInventoryDistribution(),
      ]);
      setStats(statsData);
      setTrends(
        trendsData.map((item) => ({
          ...item,
          label: formatShortDate(item.date),
        }))
      );
      setDistribution(distData);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load dashboard data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(Boolean(stats));
  }, [loadDashboard, refreshSignal]);

  const handleResolveAlert = async (alertId) => {
    setResolvingId(alertId);
    try {
      await alertsApi.resolve(alertId);
      showToast("Alert marked as resolved", "success");
      onAlertsChanged?.();
      loadDashboard(true);
    } catch (err) {
      showToast(extractErrorMessage(err, "Failed to resolve alert"), "error");
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) return <LoadingState message="Loading live dashboard..." />;

  if (error) {
    return (
      <div className="rounded-lg border border-[#FB5607]/40 bg-[#FB5607]/10 p-5 text-sm text-[#9A3412]">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-enter">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Products"
          value={stats.total_products}
          subtitle="Active catalog SKUs"
          icon={Package}
          tone="violet"
        />
        <KpiCard
          title="Total Warehouses"
          value={stats.total_warehouses}
          subtitle="Distribution locations"
          icon={Warehouse}
          tone="ash"
        />
        <KpiCard
          title="Total Inventory Units"
          value={stats.total_inventory_units.toLocaleString()}
          subtitle="Units across all warehouses"
          icon={Boxes}
          tone="violet"
        />
        <KpiCard
          title="Low / Out-of-Stock"
          value={stats.low_stock_count + stats.out_of_stock_count}
          subtitle={`${stats.low_stock_count} low · ${stats.out_of_stock_count} out of stock`}
          icon={AlertTriangle}
          tone={stats.low_stock_count + stats.out_of_stock_count > 0 ? "orange" : "violet"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-zinc-300/80 bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between border-b border-[#E9ECEF] pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#212529]">
                Stock Movement Trends
              </h2>
              <p className="text-xs text-[#212529]/60">
                Daily inbound vs. outbound units (last 14 days)
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="2 2" stroke="#E9ECEF" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#495057" }} axisLine={{ stroke: "#DEE2E6" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#495057" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "6px",
                    borderColor: "#DEE2E6",
                    boxShadow: "0 4px 12px rgba(33,37,41,0.1)",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="inbound" name="Stock In" fill="#8338EC" radius={[2, 2, 0, 0]} />
                <Bar dataKey="outbound" name="Stock Out" fill="#FB5607" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-300/80 bg-white p-5 shadow-2xs">
          <div className="mb-4 border-b border-[#E9ECEF] pb-3">
            <h2 className="font-display text-base font-bold text-[#212529]">
              Inventory Distribution
            </h2>
            <p className="text-xs text-[#212529]/60">Units stored per warehouse</p>
          </div>
          {distribution.length === 0 || distribution.every((d) => d.total_units === 0) ? (
            <EmptyState
              icon={Warehouse}
              title="No inventory distributed yet"
              description="Record an inbound stock movement to see warehouse distribution."
            />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution.filter((d) => d.total_units > 0)}
                    dataKey="total_units"
                    nameKey="warehouse_name"
                    cx="50%"
                    cy="45%"
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={2}
                    cornerRadius={0}
                  >
                    {distribution
                      .filter((d) => d.total_units > 0)
                      .map((entry, idx) => (
                        <Cell
                          key={entry.warehouse_id}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} units`, "Stock"]}
                    contentStyle={{
                      borderRadius: "6px",
                      borderColor: "#DEE2E6",
                      boxShadow: "0 4px 12px rgba(33,37,41,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-zinc-300/80 bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between border-b border-[#E9ECEF] pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#212529]">Active Alerts</h2>
              <p className="text-xs text-[#212529]/60">
                {stats.active_alerts_count} active alert(s) requiring attention
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("alerts")}
              className="text-xs font-medium text-[#8338EC] hover:text-[#6E28D9] transition-colors"
            >
              View all →
            </button>
          </div>

          {stats.active_alerts.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All clear"
              description="No active stock alerts at the moment."
            />
          ) : (
            <div className="space-y-2.5">
              {stats.active_alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-zinc-200 bg-[#E9ECEF]/45 p-3.5 transition-colors hover:bg-[#E9ECEF]/75"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <AlertTypeBadge alertType={alert.alert_type} />
                      <span className="text-[11px] text-[#212529]/50">
                        {formatDateTime(alert.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-[#212529] leading-snug">{alert.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="shrink-0 rounded-md border border-[#8338EC]/35 bg-white px-2.5 py-1 text-xs font-medium text-[#8338EC] hover:bg-[#8338EC] hover:text-white transition-colors duration-150 disabled:opacity-50"
                  >
                    {resolvingId === alert.id ? "..." : "Resolve"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-300/80 bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between border-b border-[#E9ECEF] pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#212529]">
                Recent Stock Movements
              </h2>
              <p className="text-xs text-[#212529]/60">Latest inbound and outbound transactions</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("movements")}
              className="text-xs font-medium text-[#8338EC] hover:text-[#6E28D9] transition-colors"
            >
              View all →
            </button>
          </div>

          {stats.recent_movements.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No stock movements yet"
              description="Record a Stock In or Stock Out transaction to populate history."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-[11px] font-semibold uppercase tracking-wider text-[#212529]/60">
                    <th className="pb-2.5">Product</th>
                    <th className="pb-2.5">Warehouse</th>
                    <th className="pb-2.5">Type</th>
                    <th className="pb-2.5 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  {stats.recent_movements.slice(0, 6).map((mov) => (
                    <tr key={mov.id} className="hover:bg-[#E9ECEF]/45 transition-colors">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-[#212529] truncate max-w-[160px]">
                          {mov.product_name}
                        </p>
                        <p className="text-[11px] font-mono text-[#212529]/50">{mov.product_sku}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-[#212529]/75">{mov.warehouse_name}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${mov.movement_type === "IN"
                            ? "bg-[#8338EC]/10 text-[#6E28D9] border-[#8338EC]/30"
                            : "bg-[#FB5607]/10 text-[#C2410C] border-[#FB5607]/35"
                            }`}
                        >
                          {mov.movement_type === "IN" ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {mov.movement_type}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold tabular-nums text-[#212529]">
                        {mov.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
