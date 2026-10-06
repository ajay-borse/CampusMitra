import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { moderationApi } from '../api/moderationApi';
import { useToast } from '../context/ToastContext';

export default function ReportModal({ targetUser, onClose }) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('harassment');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUser?._id && !targetUser?.id) return;

    try {
      setIsSubmitting(true);
      await moderationApi.reportUser(
        targetUser._id || targetUser.id,
        reason,
        description
      );
      showToast('Safety report submitted to campus moderators.', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-danger" />
            <h3 className="modal-title">Report Profile</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p className="text-muted text-sm mb-3">
            Help keep CampusMitra safe. Reports are reviewed by university moderators.
          </p>

          <div className="form-group mb-3">
            <label className="form-label">Category</label>
            <select
              className="form-control"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="harassment">Harassment or Bullying</option>
              <option value="fake_account">Fake or Impersonation Account</option>
              <option value="inappropriate_content">Inappropriate Photos or Bio</option>
              <option value="spam">Commercial Spam / Solicitation</option>
              <option value="other">Other Violation</option>
            </select>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Details (optional)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Describe what occurred..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
