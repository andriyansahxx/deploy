// backend/src/routes/blog.js
const express = require('express');
const { body } = require('express-validator');
const blogController = require('../controllers/blogController');
const auth = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const postValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be between 1 and 255 characters'),
  body('slug')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Slug is required and must be between 1 and 255 characters'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must not exceed 500 characters'),
  body('featured_image')
    .optional()
    .isURL()
    .withMessage('Featured image must be a valid URL'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived')
];

// Routes
// Get all posts (public - only published)
router.get('/', blogController.getAllPosts);

// Get post by slug (public - only published)
router.get('/:slug', blogController.getPostBySlug);

// Admin routes
// Create post (admin only)
router.post('/', adminAuth, postValidation, blogController.createPost);

// Update post (admin only)
router.put('/:id', adminAuth, postValidation, blogController.updatePost);

// Delete post (admin only)
router.delete('/:id', adminAuth, blogController.deletePost);

// Publish/Unpublish post (admin only)
router.patch('/:id/publish', adminAuth, blogController.togglePublish);

module.exports = router;