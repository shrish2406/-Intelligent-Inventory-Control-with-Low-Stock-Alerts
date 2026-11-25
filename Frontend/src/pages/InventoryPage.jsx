import { useCallback, useEffect, useState } from "react";
import { Boxes, Search } from "lucide-react";
import {
  extractErrorMessage,
  inventoryApi,
  productsApi,
  warehousesApi,
} from "../services/api";
import { useToast } from "../components/common/ToastContext";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { StockStatusBadge } from "../components/common/StatusBadge";
import { formatDateTime } from "../utils/formatters";

export default function InventoryPage({ refreshSignal, onNavigate }) {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadFilters = useCallback(async () => {
    try {
      const [prods, whs] = await Promise.all([productsApi.list(), warehousesApi.list()]);
      setProducts(prods);
      setWarehouses(whs);
    } catch {
      // Handled by main fetch
    }
  }, []);

  const loadInventory = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (productId) params.product_id = Number(productId);
        if (warehouseId) params.warehouse_id = Number(warehouseId);
        if (statusFilter) params.status = statusFilter;

        const data = await inventoryApi.list(params);
        setItems(data);
      } catch (err) {
        showToast(extractErrorMessage(err, "Failed to load inventory"), "error");
      } finally {
        setLoading(false);
      }
    },
    [search, productId, warehouseId, statusFilter, showToast]
  );

  useEffect(() => {
    loadFilters();
  }, [loadFilters, refreshSignal]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadInventory(false), 180);
    return () => window.clearTimeout(timer);
  }, [loadInventory, refreshSignal]);

  return (
    <div className="space-y-5 animate-fade-enter">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, SKU, warehouse..."
            className="w-full rounded-md border border-zinc-300 bg-white pl-9 pr-4 py-2 text-sm text-[#212529] placeholder:text-zinc-400 focus:border-[#8338EC] focus:outline-none transition-colors"
          />
        </div>

        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-[#212529] focus:border-[#8338EC] focus:outline-none transition-colors"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>

        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-[#212529] focus:border-[#8338EC] focus:outline-none transition-colors"
        >
          <option value="">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-[#212529] focus:border-[#8338EC] focus:outline-none transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading inventory..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No inventory records match"
          description="Record a Stock In movement to initialize inventory for a product and warehouse."
          action={
            <button
              type="button"
              onClick={() => onNavigate("movements")}
              className="rounded-md bg-[#8338EC] px-4 py-2 text-sm font-medium text-white hover:bg-[#6E28D9] transition-colors"
            >
              Record Stock Movement
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-300/80 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#E9ECEF]/75 border-b border-zinc-300/80 text-[11px] font-semibold uppercase tracking-wider text-[#212529]/70">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Warehouse</th>
                  <th className="px-5 py-3 text-right">Quantity</th>
                  <th className="px-5 py-3 text-right">Min. Threshold</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                {items.map((item) => {
                  const rowHighlight =
                    item.status === "OUT_OF_STOCK"
                      ? "bg-[#FB5607]/[0.06]"
                      : item.status === "LOW_STOCK"
                        ? "bg-[#FB5607]/[0.03]"
                        : "";
                  return (
                    <tr key={item.id} className={`${rowHighlight} hover:bg-[#E9ECEF]/50 transition-colors`}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#212529]">{item.product_name}</p>
                        <p className="text-[11px] font-mono text-[#212529]/55">{item.product_sku}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#212529]">{item.warehouse_name}</p>
                        <p className="text-xs text-[#212529]/60">{item.warehouse_location}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-[#212529]">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-[#212529]/65">
                        {item.minimum_stock}
                      </td>
                      <td className="px-5 py-3.5">
                        <StockStatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#212529]/60">
                        {formatDateTime(item.updated_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
