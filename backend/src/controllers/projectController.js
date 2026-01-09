// backend/src/controllers/projectController.js
const projectService = require('../services/projectService');
const { validationResult } = require('express-validator');

exports.getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, category = '', status = 'active' } = req.query;
    
    const filters = {
      category: category.trim(),
      status: status.trim() || 'active',
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await projectService.findAll(filters);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get projects',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.getProjectBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const project = await projectService.findBySlug(slug);
    
    if (!project) {
      return res.status(404).json({ 
        message: 'Project not found' 
      });
    }

    res.status(200).json({
      project
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.createProject = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectData = req.body;

    const project = await projectService.create(projectData);
    
    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.updateProject = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const projectData = req.body;

    const updatedProject = await projectService.updateById(parseInt(id), projectData);
    
    if (!updatedProject) {
      return res.status(404).json({ 
        message: 'Project not found' 
      });
    }

    res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProject = await projectService.deleteById(parseInt(id));
    
    if (!deletedProject) {
      return res.status(404).json({ 
        message: 'Project not found' 
      });
    }

    res.status(200).json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};