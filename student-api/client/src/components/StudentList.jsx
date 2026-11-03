import { useState } from 'react';

/**
 * StudentList Component
 * Displays the list of registered students in a clean table.
 * Includes search, refresh button, edit and delete actions,
 * and handles loading, error, and empty states.
 */
export default function StudentList({
  students,
  isLoading,
  error,
  storageMode,
  onRefresh,
  onEdit,
  onDelete,
  editingStudentId,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter students based on search input (name, email, course)
  const filteredStudents = (students || []).filter((student) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = student.name?.toLowerCase().includes(term);
    const emailMatch = student.email?.toLowerCase().includes(term);
    const courseMatch = student.course?.toLowerCase().includes(term);
    return nameMatch || emailMatch || courseMatch;
  });

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="card list-card">
      {/* List Header */}
      <div className="list-toolbar">
        <div className="list-title-group">
          <h2 className="card-title">📋 Enrolled Students</h2>
          <div className="badge-group">
            <span className="badge badge-info" id="student-count-badge">
              Total: {students?.length || 0}
            </span>
            {storageMode && (
              <span
                className={`badge ${
                  storageMode === 'MongoDB' ? 'badge-success' : 'badge-neutral'
                }`}
                title="Current active backend database storage"
              >
                💾 {storageMode}
              </span>
            )}
          </div>
        </div>

        {/* Toolbar controls: Search and Refresh */}
        <div className="toolbar-controls">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, email, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              id="search-students-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={onRefresh}
            disabled={isLoading}
            id="refresh-students-btn"
            title="Reload students from server"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="state-container loading-state" id="loading-state">
          <div className="spinner"></div>
          <p>Loading students from server...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="state-container error-state" id="error-state" role="alert">
          <div className="error-icon">⚠️</div>
          <h3>Failed to load students</h3>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRefresh}
            style={{ marginTop: '0.75rem' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State (No students exist at all) */}
      {!isLoading && !error && students.length === 0 && (
        <div className="state-container empty-state" id="empty-state">
          <div className="empty-icon">🎓</div>
          <h3>No students found</h3>
          <p>There are no students registered in the database yet.</p>
          <p className="empty-hint">Use the form above to add your first student record!</p>
        </div>
      )}

      {/* Filtered Empty State (Search query returned 0 matches) */}
      {!isLoading && !error && students.length > 0 && filteredStudents.length === 0 && (
        <div className="state-container empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No matching records</h3>
          <p>No student matches the search query "{searchTerm}".</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSearchTerm('')}
            style={{ marginTop: '0.5rem' }}
          >
            Clear Search Filter
          </button>
        </div>
      )}

      {/* Student Table */}
      {!isLoading && !error && filteredStudents.length > 0 && (
        <div className="table-responsive">
          <table className="student-table" id="students-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Name</th>
                <th>Email Address</th>
                <th>Course</th>
                <th>Registered</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const studentId = student._id || student.id;
                const isSelected = String(editingStudentId) === String(studentId);
                return (
                  <tr
                    key={studentId}
                    className={`table-row ${isSelected ? 'row-editing' : ''}`}
                  >
                    <td className="cell-index">{index + 1}</td>
                    <td className="cell-name">
                      <span className="student-avatar">
                        {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                      </span>
                      <strong>{student.name}</strong>
                    </td>
                    <td className="cell-email">
                      <a href={`mailto:${student.email}`} className="email-link">
                        {student.email}
                      </a>
                    </td>
                    <td className="cell-course">
                      <span className="course-pill">{student.course}</span>
                    </td>
                    <td className="cell-date">
                      {formatDate(student.createdAt)}
                    </td>
                    <td className="cell-actions">
                      <button
                        type="button"
                        className="btn-action btn-edit"
                        onClick={() => onEdit(student)}
                        title="Edit student"
                        id={`edit-btn-${studentId}`}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => onDelete(student)}
                        title="Delete student"
                        id={`delete-btn-${studentId}`}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
