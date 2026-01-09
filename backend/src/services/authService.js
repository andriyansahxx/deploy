// backend/src/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database'); // Assuming database connection setup

// JWT Secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_fallback_secret';

class AuthService {
  async register(userData) {
    const { email, password, firstName, lastName } = userData;
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, 'user')
      RETURNING *
    `;
    
    const values = [email, hashedPassword, firstName, lastName];
    
    const result = await db.query(query, values);
    
    return result.rows[0];
  }

  async login(email, password) {
    // Find user by email
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email];
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    const user = result.rows[0];
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Generate tokens
    const token = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    // Update last login time
    await db.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Don't return password hash
    const { password_hash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token,
      refreshToken
    };
  }

  generateAccessToken(userId, email, role) {
    return jwt.sign(
      { userId, email, role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
  }

  async getUserById(userId) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [userId]);
    
    return result.rows[0] || null;
  }

  async updateUser(userId, updates) {
    // Prepare fields for update
    const allowedUpdates = ['first_name', 'last_name', 'bio', 'avatar_url'];
    const filteredUpdates = {};
    
    for (const key in updates) {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }
    
    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Build dynamic query
    const setClause = Object.keys(filteredUpdates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const values = Object.values(filteredUpdates);
    values.push(userId); // For WHERE clause
    
    const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
    
    const result = await db.query(query, values);
    
    return result.rows[0] || null;
  }

  // Method to verify token (used by middleware)
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AuthService();