import { useState, useEffect } from 'react';

/**
 * StudentForm Component
 * Handles adding new students and editing existing students.
 * Beginner-friendly form with controlled inputs and validation.
 */
export default function StudentForm({ editingStudent, onSave, onCancelEdit, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
  });
  const [formError, setFormError] = useState('');

  // When editingStudent prop changes, update form fields accordingly
  useEffect(() => {
    if (editingStudent) {
      setFormData({
        name: editingStudent.name || '',
        email: editingStudent.email || '',
        course: editingStudent.course || '',
      });
      setFormError('');
    } else {
      // Reset form if not editing
      setFormData({ name: '', email: '', course: '' });
      setFormError('');
    }
  }, [editingStudent]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when user starts typing
    if (formError) setFormError('');
  };

  // Basic client-side validation
  const validate = () => {
    if (!formData.name.trim()) {
      return 'Student name is required.';
    }
    if (!formData.email.trim()) {
      return 'Email address is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address (e.g., student@example.com).';
    }
    if (!formData.course.trim()) {
      return 'Course name is required.';
    }
    return '';
  };

  // Handle form submission
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

    if (!editingStudent) {
      setFormData({ name: '', email: '', course: '' });
    }
  };

  const isEditing = Boolean(editingStudent);

  return (
    <div className="card form-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            {isEditing ? '✏️ Edit Student' : '➕ Add New Student'}
          </h2>
          <p className="card-subtitle">
            {isEditing
              ? `Update details for ${editingStudent.name}`
              : 'Enter student information to enroll them in the system'}
          </p>
        </div>
        {isEditing && (
          <span className="badge badge-warning">Editing Mode</span>
        )}
      </div>

      {formError && (
        <div className="alert alert-error" role="alert">
          <span>⚠️ {formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              className="form-input"
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          {/* Course Field */}
          <div className="form-group">
            <label htmlFor="course" className="form-label">
              Course <span className="required">*</span>
            </label>
            <input
              id="course"
              type="text"
              name="course"
              className="form-input"
              placeholder="e.g. MCA, B.Tech CSE, BCA"
              value={formData.course}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            id="submit-student-btn"
          >
            {isSubmitting ? (
              <span className="btn-spinner">Saving...</span>
            ) : isEditing ? (
              'Update Student'
            ) : (
              'Add Student'
            )}
          </button>

          {isEditing && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancelEdit}
              disabled={isSubmitting}
              id="cancel-edit-btn"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
