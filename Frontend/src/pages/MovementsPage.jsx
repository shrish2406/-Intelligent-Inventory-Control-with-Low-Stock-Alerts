import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import {
  extractErrorMessage,
  movementsApi,
  productsApi,
  warehousesApi,
} from "../services/api";
import { useToast } from "../components/common/ToastContext";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { formatDateTime } from "../utils/formatters";

export default function MovementsPage({ refreshSignal, onMovementCreated }) {
  const { showToast } = useToast();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    product_id: "",
    warehouse_id: "",
    movement_type: "IN",
    quantity: 1,
  });

  const [filterType, setFilterType] = useState("");

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = filterType ? { movement_type: filterType } : undefined;
        const [movData, prodData, whData] = await Promise.all([
          movementsApi.list(params),
          productsApi.list(),
          warehousesApi.list(),
        ]);
        setMovements(movData);
        setProducts(prodData);
        setWarehouses(whData);
        setForm((prev) => ({
          ...prev,
          product_id: prev.product_id || (prodData[0]?.id ? String(prodData[0].id) : ""),
          warehouse_id: prev.warehouse_id || (whData[0]?.id ? String(whData[0].id) : ""),
        }));
      } catch (err) {
        showToast(extractErrorMessage(err, "Failed to load stock movements"), "error");
      } finally {
        setLoading(false);
      }
    },
    [filterType, showToast]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData, refreshSignal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id || !form.warehouse_id) {
      showToast("Please select both a product and a warehouse", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const created = await movementsApi.create({
        product_id: Number(form.product_id),
        warehouse_id: Number(form.warehouse_id),
        movement_type: form.movement_type,
        quantity: Number(form.quantity),
      });
      showToast(
        `Stock ${created.movement_type} recorded (${created.quantity} units). New stock: ${created.new_quantity}`,
        "success"
      );
      setForm((prev) => ({ ...prev, quantity: 1 }));
      onMovementCreated?.();
      loadData(true);
    } catch (err) {
      showToast(extractErrorMessage(err, "Stock movement failed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-enter">
      <div className="rounded-lg border border-zinc-300/80 bg-white p-5 shadow-2xs h-fit">
        <h2 className="font-display text-base font-bold text-[#212529]">
          Record Stock Movement
        </h2>
        <p className="mt-1 text-xs text-[#212529]/60">
          Inbound increases stock; outbound validates availability with row-level locking.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-1.5 rounded-md border border-zinc-300/80 bg-[#E9ECEF] p-1">
            <button
              type="button"
              onClick={() => setForm({ ...form, movement_type: "IN" })}
              className={`flex items-center justify-center gap-1.5 rounded-sm py-2 text-xs font-semibold transition-all duration-150 ${form.movement_type === "IN"
                ? "bg-[#8338EC] text-white shadow-xs"
                : "text-[#212529]/70 hover:text-[#212529]"
                }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Stock In
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, movement_type: "OUT" })}
              className={`flex items-center justify-center gap-1.5 rounded-sm py-2 text-xs font-semibold transition-all duration-150 ${form.movement_type === "OUT"
                ? "bg-[#FB5607] text-white shadow-xs"
                : "text-[#212529]/70 hover:text-[#212529]"
                }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Stock Out
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#212529] mb-1">
              Product
            </label>
            <select
              required
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm focus:border-[#8338EC] focus:outline-none transition-colors"
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#212529] mb-1">
              Warehouse
            </label>
            <select
              required
              value={form.warehouse_id}
              onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
              className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm focus:border-[#8338EC] focus:outline-none transition-colors"
            >
              <option value="">Select warehouse...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#212529] mb-1">
              Quantity
            </label>
            <input
              required
              min={1}
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm focus:border-[#8338EC] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || products.length === 0 || warehouses.length === 0}
            className="w-full rounded-md bg-[#212529] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#343A40] disabled:opacity-50 transition-colors duration-150"
          >
            {submitting ? "Processing..." : `Submit Stock ${form.movement_type}`}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-[#212529]">Movement History</h2>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-[#212529] focus:border-[#8338EC] focus:outline-none transition-colors"
          >
            <option value="">All Types</option>
            <option value="IN">Inbound (IN)</option>
            <option value="OUT">Outbound (OUT)</option>
          </select>
        </div>

        {loading ? (
          <LoadingState message="Loading movement history..." />
        ) : movements.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No stock movements recorded"
            description="Submit a Stock In or Stock Out transaction using the form."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-300/80 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#E9ECEF]/75 border-b border-zinc-300/80 text-[11px] font-semibold uppercase tracking-wider text-[#212529]/70">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Warehouse</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-right">Quantity</th>
                    <th className="px-5 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[#E9ECEF]/45 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#212529]">{mov.product_name}</p>
                        <p className="text-[11px] font-mono text-[#212529]/55">{mov.product_sku}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[#212529]/80">{mov.warehouse_name}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${mov.movement_type === "IN"
                            ? "bg-[#8338EC]/10 text-[#6E28D9] border-[#8338EC]/30"
                            : "bg-[#FB5607]/10 text-[#C2410C] border-[#FB5607]/35"
                            }`}
                        >
                          {mov.movement_type === "IN" ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                          {mov.movement_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-[#212529]">
                        {mov.quantity}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#212529]/60">
                        {formatDateTime(mov.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
