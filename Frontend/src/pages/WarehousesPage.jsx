import { useCallback, useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Search, Trash2, Warehouse } from "lucide-react";
import { extractErrorMessage, warehousesApi } from "../services/api";
import { useToast } from "../components/common/ToastContext";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { formatDateTime } from "../utils/formatters";

const EMPTY_FORM = { name: "", location: "" };

export default function WarehousesPage({ onDataChanged }) {
  const { showToast } = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await warehousesApi.list(search ? { search } : undefined);
      setWarehouses(data);
    } catch (err) {
      showToast(extractErrorMessage(err, "Failed to fetch warehouses"), "error");
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(loadWarehouses, 200);
    return () => window.clearTimeout(timer);
  }, [loadWarehouses]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (warehouse) => {
    setEditing(warehouse);
    setForm({ name: warehouse.name, location: warehouse.location });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await warehousesApi.update(editing.id, form);
        showToast("Warehouse updated", "success");
      } else {
        await warehousesApi.create(form);
        showToast("Warehouse created", "success");
      }
      setModalOpen(false);
      loadWarehouses();
      onDataChanged?.();
    } catch (err) {
      showToast(extractErrorMessage(err, "Failed to save warehouse"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await warehousesApi.remove(deleteTarget.id);
      showToast("Warehouse deleted", "success");
      setDeleteTarget(null);
      loadWarehouses();
      onDataChanged?.();
    } catch (err) {
      showToast(extractErrorMessage(err, "Failed to delete warehouse"), "error");
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
            placeholder="Search by warehouse name or location..."
            className="w-full rounded-md border border-zinc-300 bg-white pl-9 pr-4 py-2 text-sm text-[#212529] placeholder:text-zinc-400 focus:border-[#8338EC] focus:outline-none transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#8338EC] px-4 py-2 text-sm font-medium text-white hover:bg-[#6E28D9] transition-colors duration-150"
        >
          <Plus className="h-4 w-4" />
          Add Warehouse
        </button>
      </div>

      {loading ? (
        <LoadingState message="Loading warehouses..." />
      ) : warehouses.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="No warehouses found"
          description="Create a warehouse location to begin allocating stock."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-md bg-[#8338EC] px-4 py-2 text-sm font-medium text-white hover:bg-[#6E28D9] transition-colors"
            >
              Add Warehouse
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="rounded-lg border border-zinc-300/80 bg-white p-5 shadow-2xs flex flex-col justify-between gap-4 transition-all duration-150 hover:border-[#8338EC]/45"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-md border border-[#8338EC]/25 bg-[#8338EC]/10 p-2 text-[#8338EC]">
                    <Warehouse className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#212529]">{wh.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#212529]/65">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{wh.location}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(wh)}
                    className="rounded-md p-1.5 text-[#212529]/50 hover:bg-[#8338EC]/10 hover:text-[#8338EC] transition-colors"
                    aria-label={`Edit ${wh.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(wh)}
                    className="rounded-md p-1.5 text-[#212529]/50 hover:bg-[#FB5607]/10 hover:text-[#FB5607] transition-colors"
                    aria-label={`Delete ${wh.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-[#212529]/50 border-t border-[#E9ECEF] pt-3">
                Created {formatDateTime(wh.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Warehouse" : "Add Warehouse"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#212529] mb-1">
              Warehouse Name
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. West Coast Hub"
              className="w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm focus:border-[#8338EC] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#212529] mb-1">
              Location
            </label>
            <input
              required
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. San Jose, CA"
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
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Warehouse"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Warehouse"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All inventory records and movement history for this warehouse will be removed.`}
      />
    </div>
  );
}
