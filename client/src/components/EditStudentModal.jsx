import { useState, useEffect } from 'react';

/**
 * EditStudentModal Component
 * Displays a clean, focused modal dialog when editing an existing student.
 * Eliminates confusion with scrolling or navigating away from the table.
 */
export default function EditStudentModal({
  student,
  isOpen,
  onSave,
  onClose,
  isSubmitting,
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
  });
  const [formError, setFormError] = useState('');

  // Populate form with student details whenever student changes
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        course: student.course || '',
      });
      setFormError('');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Student name is required.';
    if (!formData.email.trim()) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address.';
    }
    if (!formData.course.trim()) return 'Course name is required.';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }

    onSave({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      course: formData.course.trim(),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">✏️</span>
            <div>
              <h2 className="modal-title">Edit Student Details</h2>
              <p className="modal-subtitle">
                Updating record for: <strong>{student.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {formError && (
          <div className="alert alert-error" role="alert" style={{ margin: '1rem 1.5rem 0' }}>
            <span>⚠️ {formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="edit-name" className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="edit-name"
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-email" className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="edit-email"
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-course" className="form-label">
                Course <span className="required">*</span>
              </label>
              <input
                id="edit-course"
                type="text"
                name="course"
                className="form-input"
                value={formData.course}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="modal-update-student-btn"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
