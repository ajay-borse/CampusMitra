/**
 * DeleteConfirmModal Component
 * Provides an in-app confirmation modal for deleting student records.
 * Completely avoids native browser window.confirm dialogs which may be blocked or ignored.
 */
export default function DeleteConfirmModal({
  student,
  isOpen,
  onConfirm,
  onCancel,
  isDeleting,
}) {
  if (!isOpen || !student) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true">
      <div
        className="modal-content modal-danger"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal body click
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon danger-icon">🗑️</span>
            <div>
              <h2 className="modal-title">Delete Student Record</h2>
              <p className="modal-subtitle">Confirm student deletion</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            disabled={isDeleting}
            title="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="delete-warning-text">
            Are you sure you want to delete the student record for:
          </p>
          <div className="student-delete-preview">
            <div className="preview-avatar">
              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h3 className="preview-name">{student.name}</h3>
              <p className="preview-details">{student.email} &bull; {student.course}</p>
            </div>
          </div>
          <p className="delete-subtext">
            ⚠️ This will remove the student from the database.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onConfirm(student._id || student.id, student.name)}
            disabled={isDeleting}
            id="modal-confirm-delete-btn"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete Record'}
          </button>
        </div>
      </div>
    </div>
  );
}
