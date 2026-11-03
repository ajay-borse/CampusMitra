const express = require('express');
const router = express.Router();

// Import controller methods
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');

/**
 * Route mapping:
 *
 * GET    /api/students     -> Fetch all students
 * POST   /api/students     -> Create a new student
 * GET    /api/students/:id -> Fetch single student by id
 * PUT    /api/students/:id -> Update student details by id
 * DELETE /api/students/:id -> Remove student by id
 */

router
  .route('/')
  .get(getAllStudents)
  .post(createStudent);

router
  .route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;
