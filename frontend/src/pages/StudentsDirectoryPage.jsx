import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Database,
  RefreshCw,
  Mail,
  User,
  GraduationCap,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { studentApi } from '../api/studentApi';
import { useToast } from '../context/ToastContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EmptyState from '../components/EmptyState';
import { TableRowSkeleton } from '../components/SkeletonLoader';

export default function StudentsDirectoryPage() {
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [storageMode, setStorageMode] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', course: '' });

  const fetchStudentsList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentApi.getAll(searchTerm);
      if (res?.success) {
        setStudents(res.data || []);
        setStorageMode(res.storageMode || 'Active');
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch student directory', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchStudentsList, 250);
    return () => clearTimeout(timer);
  }, [fetchStudentsList]);

  // Handle Create Student
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.course) {
      showToast('Please fill in name, email, and course', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      const res = await studentApi.create(formData);
      if (res?.success) {
        showToast('Student enrolled successfully! 🎓', 'success');
        setFormData({ name: '', email: '', course: '' });
        setIsCreateOpen(false);
        fetchStudentsList();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create student', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Student
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setActionLoading(true);
      const id = editingStudent._id || editingStudent.id;
      const res = await studentApi.update(id, {
        name: editingStudent.name,
        email: editingStudent.email,
        course: editingStudent.course,
      });

      if (res?.success) {
        showToast('Student record updated! ✨', 'success');
        setEditingStudent(null);
        fetchStudentsList();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update student', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Student
  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;

    try {
      setActionLoading(true);
      const id = deletingStudent._id || deletingStudent.id;
      const res = await studentApi.delete(id);
      if (res?.success) {
        showToast('Student removed from directory', 'info');
        setDeletingStudent(null);
        fetchStudentsList();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete student', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="directory-page-container">
      {/* Header Row */}
      <div className="directory-header-row">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="page-title flex items-center gap-2">
              <BookOpen className="text-success" /> Student Directory Registry
            </h2>
            {storageMode && (
              <span
                className={`storage-badge ${storageMode.includes('Memory') ? 'in-memory' : 'mongodb'}`}
                title="Active backend persistence layer"
              >
                <Database size={13} /> Storage: {storageMode}
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Complete MERN CRUD student management with live search and seamless in-memory fallback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="btn btn-outline btn-sm"
            onClick={fetchStudentsList}
            title="Reload Directory"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            className="btn btn-primary btn-sm flex items-center gap-2"
            onClick={() => {
              setFormData({ name: '', email: '', course: '' });
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} /> Enroll New Student
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-filter-card mb-4">
        <div className="search-input-wrapper w-full">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search students by name, course, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="directory-table-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID / Roll</th>
                <th>Student Name</th>
                <th>Email Address</th>
                <th>Course / Department</th>
                <th>Enrolled Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="py-6">
                      <EmptyState
                        icon="🎓"
                        title={searchTerm ? 'No matching students' : 'No Students Enrolled'}
                        description={
                          searchTerm
                            ? 'No student records match your query.'
                            : 'Click Enroll New Student above to register a student into the registry.'
                        }
                        actionLabel={searchTerm ? 'Clear Search' : 'Enroll Student'}
                        onAction={
                          searchTerm
                            ? () => setSearchTerm('')
                            : () => setIsCreateOpen(true)
                        }
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const id = student._id || student.id;
                  const dateStr = student.createdAt
                    ? new Date(student.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr key={id} className="directory-row">
                      <td className="font-mono text-xs text-muted">#{id}</td>
                      <td>
                        <div className="student-name-cell">
                          <div className="student-avatar-tiny">
                            {student.name?.[0] || 'S'}
                          </div>
                          <span className="font-medium text-sm">{student.name}</span>
                        </div>
                      </td>
                      <td className="text-sm text-secondary">{student.email}</td>
                      <td>
                        <span className="badge badge-program">{student.course}</span>
                      </td>
                      <td className="text-xs text-muted">{dateStr}</td>
                      <td className="text-right">
                        <div className="table-action-btns">
                          <button
                            className="action-icon-btn edit"
                            onClick={() => setEditingStudent({ ...student })}
                            title="Edit Student"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="action-icon-btn delete"
                            onClick={() => setDeletingStudent(student)}
                            title="Delete Student"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Student Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Plus size={18} className="text-primary" /> Enroll New Student
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsCreateOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label">Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. rahul.sharma@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Course / Program</label>
                <div className="input-with-icon">
                  <GraduationCap size={18} className="input-icon" />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. B.Tech Computer Science, MCA, Robotics"
                    value={formData.course}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, course: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="modal-backdrop" onClick={() => setEditingStudent(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Edit2 size={18} className="text-primary" /> Edit Student Record
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setEditingStudent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingStudent.name || ''}
                  onChange={(e) =>
                    setEditingStudent((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={editingStudent.email || ''}
                  onChange={(e) =>
                    setEditingStudent((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Course / Program</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingStudent.course || ''}
                  onChange={(e) =>
                    setEditingStudent((p) => ({ ...p, course: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <DeleteConfirmModal
          title={`Delete ${deletingStudent.name}?`}
          message={`Are you sure you want to remove ${deletingStudent.name} (${deletingStudent.email}) from the Student Directory registry?`}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingStudent(null)}
          isDeleting={actionLoading}
        />
      )}
    </div>
  );
}
