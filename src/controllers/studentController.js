const Student = require('../models/studentModel');
const { getDBStatus } = require('../config/db');

/**
 * In-Memory fallback storage for students.
 * Pre-populated with sample data so the API is immediately usable
 * even when MongoDB is not running locally.
 */
let memoryStudents = [
  {
    _id: '1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    course: 'MCA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    name: 'Priya Verma',
    email: 'priya.verma@example.com',
    course: 'B.Tech CSE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Counter for generating unique string IDs in in-memory mode
let nextId = 3;

/**
 * Helper to validate an email address format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ============================================================================
// @desc    Get all students
// @route   GET /api/students
// @access  Public
// ============================================================================
const getAllStudents = async (req, res, next) => {
  try {
    const isMongo = getDBStatus();

    let students = [];
    if (isMongo) {
      // Fetch all records from MongoDB sorted by newest first
      students = await Student.find().sort({ createdAt: -1 });
    } else {
      // Use in-memory data
      students = memoryStudents;
    }

    return res.status(200).json({
      success: true,
      count: students.length,
      storageMode: isMongo ? 'MongoDB' : 'In-Memory Array',
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get a single student by ID
// @route   GET /api/students/:id
// @access  Public
// ============================================================================
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isMongo = getDBStatus();

    let student = null;

    if (isMongo) {
      // In MongoDB, find student by Mongoose ObjectId
      try {
        student = await Student.findById(id);
      } catch (err) {
        // Handle invalid ObjectId format
        return res.status(404).json({
          success: false,
          message: `Student not found with id: ${id}`,
        });
      }
    } else {
      // In-Memory lookup by _id or id (string-safe)
      student = memoryStudents.find((s) => String(s._id) === String(id) || String(s.id) === String(id));
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student not found with id: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Create a new student
// @route   POST /api/students
// @access  Public
// ============================================================================
const createStudent = async (req, res, next) => {
  try {
    const { name, email, course } = req.body;

    // 1. Validation: ensure required fields are present
    if (!name || !email || !course) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and course',
      });
    }

    // 2. Validation: email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const isMongo = getDBStatus();
    let newStudent;

    if (isMongo) {
      // Save to MongoDB
      newStudent = await Student.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        course: course.trim(),
      });
    } else {
      // Save to In-Memory array
      newStudent = {
        _id: String(nextId++),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        course: course.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStudents.push(newStudent);
    }

    // Return 201 Created status
    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: newStudent,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Update an existing student by ID
// @route   PUT /api/students/:id
// @access  Public
// ============================================================================
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, course } = req.body;

    // Check if at least one field is provided for update
    if (!name && !email && !course) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update: name, email, or course',
      });
    }

    // If email is provided, validate format
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const isMongo = getDBStatus();
    let updatedStudent = null;

    if (isMongo) {
      try {
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.trim().toLowerCase();
        if (course) updateData.course = course.trim();

        updatedStudent = await Student.findByIdAndUpdate(id, updateData, {
          new: true, // Return the updated document
          runValidators: true, // Enforce schema validations on update
        });
      } catch (err) {
        return res.status(404).json({
          success: false,
          message: `Student not found with id: ${id}`,
        });
      }
    } else {
      // In-Memory update (string-safe ID match)
      const studentIndex = memoryStudents.findIndex((s) => String(s._id) === String(id) || String(s.id) === String(id));

      if (studentIndex !== -1) {
        memoryStudents[studentIndex] = {
          ...memoryStudents[studentIndex],
          name: name ? name.trim() : memoryStudents[studentIndex].name,
          email: email ? email.trim().toLowerCase() : memoryStudents[studentIndex].email,
          course: course ? course.trim() : memoryStudents[studentIndex].course,
          updatedAt: new Date().toISOString(),
        };
        updatedStudent = memoryStudents[studentIndex];
      }
    }

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: `Student not found with id: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Delete a student by ID
// @route   DELETE /api/students/:id
// @access  Public
// ============================================================================
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isMongo = getDBStatus();

    let deletedStudent = null;

    if (isMongo) {
      try {
        deletedStudent = await Student.findByIdAndDelete(id);
      } catch (err) {
        return res.status(404).json({
          success: false,
          message: `Student not found with id: ${id}`,
        });
      }
    } else {
      // In-Memory deletion (string-safe ID match)
      const studentIndex = memoryStudents.findIndex((s) => String(s._id) === String(id) || String(s.id) === String(id));

      if (studentIndex !== -1) {
        deletedStudent = memoryStudents.splice(studentIndex, 1)[0];
      }
    }

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: `Student not found with id: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
      data: deletedStudent,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
