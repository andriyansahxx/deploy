// backend/src/controllers/blogController.js
const blogService = require('../services/blogService');
const { validationResult } = require('express-validator');

exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, tag = '', status = 'published' } = req.query;
    
    // Only allow published posts for public route
    const filters = {
      tag: tag.trim(),
      status: 'published', // Force to published for public route
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await blogService.findAll(filters);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get posts',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await blogService.findBySlug(slug);
    
    if (!post) {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    // Only return published posts for public route
    if (post.status !== 'published') {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    res.status(200).json({
      post
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get post',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.createPost = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const postData = req.body;
    const authorId = req.userId; // From auth middleware

    const post = await blogService.create({ ...postData, author_id: authorId });
    
    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create post',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const postData = req.body;

    const updatedPost = await blogService.updateById(parseInt(id), postData);
    
    if (!updatedPost) {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update post',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPost = await blogService.deleteById(parseInt(id));
    
    if (!deletedPost) {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    res.status(200).json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete post',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.togglePublish = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedPost = await blogService.togglePublish(parseInt(id));
    
    if (!updatedPost) {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    const action = updatedPost.status === 'published' ? 'published' : 'unpublished';
    res.status(200).json({
      message: `Post ${action} successfully`,
      post: updatedPost
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to publish/unpublish post',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};