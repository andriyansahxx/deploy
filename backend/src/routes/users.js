// backend/src/routes/users.js
const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

// Routes
// Get current user profile (protected)
router.get('/profile', auth, userController.getProfile);

// Update current user profile (protected)
router.put('/profile', auth, updateUserValidation, userController.updateProfile);

// Get all users (admin only)
router.get('/', adminAuth, userController.getAllUsers);

// Get user by ID (admin only or self)
router.get('/:id', auth, userController.getUserById);

// Update user by ID (admin only)
router.put('/:id', adminAuth, updateUserValidation, userController.updateUserById);

// Delete user by ID (admin only)
router.delete('/:id', adminAuth, userController.deleteUser);

// Change password (protected - current user only)
router.put('/change-password', auth, userController.changePassword);

module.exports = router;