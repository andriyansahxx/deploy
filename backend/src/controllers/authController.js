// backend/src/controllers/authController.js
const authService = require('../services/authService');
const { validationResult } = require('express-validator');

exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    const userData = {
      email,
      password,
      firstName,
      lastName
    };

    const user = await authService.register(userData);
    
    // Don't send password hash in response
    const { password_hash, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT' || error.message.includes('duplicate')) {
      return res.status(400).json({ 
        message: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const result = await authService.login(email, password);
    
    if (!result.success) {
      return res.status(401).json({ 
        message: result.message 
      });
    }

    res.status(200).json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.logout = async (req, res) => {
  try {
    // In a real app, you might invalidate the refresh token here
    res.status(200).json({ 
      message: 'Logout successful' 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    
    const user = await authService.getUserById(userId);
    
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
    const userId = req.userId; // From auth middleware
    const updates = req.body;

    const updatedUser = await authService.updateUser(userId, updates);
    
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