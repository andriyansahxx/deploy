// backend/src/routes/projects.js
const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const auth = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const projectValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('content')
    .optional()
    .trim(),
  body('projectUrl')
    .optional()
    .isURL()
    .withMessage('Project URL must be a valid URL'),
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('GitHub URL must be a valid URL'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'featured'])
    .withMessage('Status must be active, inactive, or featured')
];

// Routes
// Get all projects (public)
router.get('/', projectController.getAllProjects);

// Get project by slug (public)
router.get('/:slug', projectController.getProjectBySlug);

// Admin routes
// Create project (admin only)
router.post('/', adminAuth, projectValidation, projectController.createProject);

// Update project (admin only)
router.put('/:id', adminAuth, projectValidation, projectController.updateProject);

// Delete project (admin only)
router.delete('/:id', adminAuth, projectController.deleteProject);

module.exports = router;