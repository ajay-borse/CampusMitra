import StudentForm from './StudentForm';
import StudentList from './StudentList';

/**
 * StudentDirectoryView Component
 * Integrates the live MERN CRUD backend into CampusMitra as the official Campus Registry.
 * Preserves all 5 REST API operations:
 * - GET /api/students
 * - GET /api/students/:id
 * - POST /api/students
 * - PUT /api/students/:id
 * - DELETE /api/students/:id
 */
export default function StudentDirectoryView({
  students,
  isLoading,
  error,
  storageMode,
  onRefresh,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  isSubmitting,
  editingStudentId,
}) {
  return (
    <div className="page-view directory-view animate-fade-in">
      {/* Banner Explaining MERN Stack Integration */}
      <div className="directory-api-card">
        <div className="api-badge-row">
          <span className="api-status-pill">
            <span className="live-dot" /> Live Express REST API: http://localhost:5000
          </span>
          <span className="badge badge-success">
            💾 Active Storage: {storageMode || 'In-Memory / MongoDB'}
          </span>
        </div>

        <h1 className="directory-title">🎓 Campus Student Directory (MERN CRUD)</h1>
        <p className="directory-desc">
          Official database registry of enrolled students. Powered by Node.js, Express.js, MongoDB (with offline In-Memory fallback), and React 19. All actions below communicate directly with the backend REST endpoints.
        </p>

        <div className="api-endpoints-preview">
          <span className="endpoint-chip"><code>GET /api/students</code></span>
          <span className="endpoint-chip"><code>POST /api/students</code></span>
          <span className="endpoint-chip"><code>PUT /api/students/:id</code></span>
          <span className="endpoint-chip"><code>DELETE /api/students/:id</code></span>
          <span className="endpoint-chip"><code>GET /api/students/:id</code></span>
        </div>
      </div>

      {/* Add Student Form */}
      <section className="section-form" aria-label="Add Student Form">
        <StudentForm
          onSave={onAddStudent}
          isSubmitting={isSubmitting}
        />
      </section>

      {/* Student List Table */}
      <section className="section-list" aria-label="Student Directory Table">
        <StudentList
          students={students}
          isLoading={isLoading}
          error={error}
          storageMode={storageMode}
          onRefresh={onRefresh}
          onEdit={onEditStudent}
          onDelete={onDeleteStudent}
          editingStudentId={editingStudentId}
        />
      </section>
    </div>
  );
}
