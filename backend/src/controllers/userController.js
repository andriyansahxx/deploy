// backend/src/controllers/userController.js
const userService = require('../services/userService');
const { validationResult } = require('express-validator');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    
    const user = await userService.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Don't send password hash in response
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId;
    const updates = req.body;

    const updatedUser = await userService.updateById(userId, updates);
    
    if (!updatedUser) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Don't send password hash in response
    const { password_hash, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    const filters = {
      search: search.trim(),
      role: role.trim(),
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await userService.findAll(filters);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.userId;
    const requestingUserRole = req.userRole;

    // Admins can view any user, regular users can only view their own profile
    if (requestingUserRole !== 'admin' && parseInt(id) !== requestingUserId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own profile.' 
      });
    }

    const user = await userService.findById(parseInt(id));
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Don't send password hash in response
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get user',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    const updatedUser = await userService.updateById(parseInt(id), updates);
    
    if (!updatedUser) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Don't send password hash in response
    const { password_hash, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await userService.deleteById(parseInt(id));
    
    if (!deletedUser) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
    }

    const result = await userService.changePassword(userId, currentPassword, newPassword);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: result.message 
      });
    }

    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};