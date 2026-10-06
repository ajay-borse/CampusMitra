/**
 * API Service for Student Management System
 * Uses native fetch API to communicate with the Node.js / Express backend.
 * 
 * Default backend URL: http://localhost:5000/api/students
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/students';

/**
 * Fetch all students from backend
 * GET /api/students
 */
export async function fetchStudents() {
  const response = await fetch(API_BASE_URL);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch students');
  }
  return data;
}

/**
 * Fetch a single student by ID
 * GET /api/students/:id
 */
export async function fetchStudentById(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch student with ID ${id}`);
  }
  return data;
}

/**
 * Add a new student
 * POST /api/students
 */
export async function createStudent(studentData) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(studentData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create student');
  }
  return data;
}

/**
 * Update an existing student
 * PUT /api/students/:id
 */
export async function updateStudent(id, studentData) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(studentData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update student');
  }
  return data;
}

/**
 * Delete a student by ID
 * DELETE /api/students/:id
 */
export async function deleteStudent(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete student');
  }
  return data;
}
