import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  onConfirm,
  onClose,
  isDeleting = false,
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-danger" />
            <h3 className="modal-title">{title}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body py-2">
          <p className="text-secondary text-sm">{message}</p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
