import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmLabel = "Delete",
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-3.5">
        <div className="rounded-md bg-[#FB5607]/10 border border-[#FB5607]/30 p-2 text-[#FB5607] shrink-0">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <p className="text-sm text-[#212529]/80 leading-relaxed">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-zinc-200">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-[#212529] hover:bg-[#E9ECEF] transition-colors duration-150 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="rounded-md bg-[#FB5607] px-4 py-2 text-sm font-medium text-white hover:bg-[#E04D06] transition-colors duration-150 disabled:opacity-50"
        >
          {loading ? "Processing..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
