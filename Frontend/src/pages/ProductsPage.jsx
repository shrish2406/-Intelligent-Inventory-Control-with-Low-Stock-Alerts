import { useCallback, useEffect, useState } from "react";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { extractErrorMessage, productsApi } from "../services/api";
import { useToast } from "../components/common/ToastContext";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { formatDateTime } from "../utils/formatters";

const EMPTY_FORM = { name: "", sku: "", category: "", minimum_stock: 10 };

export default function ProductsPage({ onDataChanged }) {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.list(search ? { search } : undefined);
      setProducts(data);
    } catch (err) {
      showToast(extractErrorMessage(err, "Failed to fetch products"), "error");
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(loadProducts, 200);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      minimum_stock: product.minimum_stock,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        minimum_stock: Number(form.minimum_stock),
      };
      if (editing) {
        await productsApi.update(editing.id, payload);
        showToast("Product updated", "success");
      } else {
        await productsApi.create(payload);
        showToast("Product created", "success");
      }
      setModalOpen(false);
      loadProducts();
      onDataChanged?.();
    } catch (err) {
      showToast(extractErrorMessage(err, "Failed to save product"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsApi.remove(deleteTarget.id);
      showToast("Product deleted", "success");
      setDeleteTarget(null);
      loadProducts();
      onDataChanged?.();
    } catch (err) {
      showToast(extractErrorMessage(err, "Failed to delete product"), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or category..."
            className="w-full rounded-md border border-zinc-300 bg-white pl-9 pr-4 py-2 text-sm text-[#212529] placeholder:text-zinc-400 focus:border-[#8338EC] focus:outline-none transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#8338EC] px-4 py-2 text-sm font-medium text-white hover:bg-[#6E28D9] transition-colors duration-150"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {loading ? (
        <LoadingState message="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Add your first product to start tracking inventory across warehouses."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-md bg-[#8338EC] px-4 py-2 text-sm font-medium text-white hover:bg-[#6E28D9] transition-colors"
            >
              Add Product
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
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Min. Stock</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#E9ECEF]/45 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#212529]">{product.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#212529]/70">{product.sku}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-md border border-zinc-300/80 bg-[#E9ECEF]/70 px-2 py-0.5 text-xs font-medium text-[#212529]">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-medium text-[#212529]">
                      {product.minimum_stock}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#212529]/60">
                      {formatDateTime(product.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="rounded-md p-1.5 text-[#212529]/55 hover:bg-[#8338EC]/10 hover:text-[#8338EC] transition-colors"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="rounded-md p-1.5 text-[#212529]/55 hover:bg-[#FB5607]/10 hover:text-[#FB5607] transition-colors"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Product" : "Add Product"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#212529] mb-1">
              Product Name
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Industrial IoT Gateway"
              className="w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm focus:border-[#8338EC] focus:outline-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#212529] mb-1">
                SKU (Unique)
              </label>
              <input
                required
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. IOT-GW-100"
                className="w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-mono focus:border-[#8338EC] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#212529] mb-1">
                Category
              </label>
              <input
                required
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Hardware"
                className="w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm focus:border-[#8338EC] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#212529] mb-1">
              Minimum Stock Threshold
            </label>
            <input
              required
              min={0}
              type="number"
              value={form.minimum_stock}
              onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm focus:border-[#8338EC] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E9ECEF]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-[#212529] hover:bg-[#E9ECEF] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#8338EC] px-4 py-2 text-sm font-medium text-white hover:bg-[#6E28D9] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.sku})? All associated inventory, movement history, and alerts will also be removed.`}
      />
    </div>
  );
}
