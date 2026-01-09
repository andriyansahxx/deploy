// backend/src/services/userService.js
const bcrypt = require('bcryptjs');
const db = require('../config/database');

class UserService {
  async findById(id) {
    const query = 'SELECT id, email, first_name, last_name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    
    return result.rows[0] || null;
  }

  async updateById(id, updates) {
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
    values.push(id); // For WHERE clause
    
    const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING id, email, first_name, last_name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at`;
    
    const result = await db.query(query, values);
    
    return result.rows[0] || null;
  }

  async findAll(filters = {}) {
    const { search = '', role = '', page = 1, limit = 10 } = filters;
    
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const values = [];
    
    if (search) {
      whereClause += ` AND (first_name ILIKE $${values.length + 1} OR last_name ILIKE $${values.length + 1} OR email ILIKE $${values.length + 1})`;
      values.push(`%${search}%`);
    }
    
    if (role) {
      whereClause += ` AND role = $${values.length + 1}`;
      values.push(role);
    }
    
    // Count query
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);
    
    // Data query
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT id, email, first_name, last_name, bio, avatar_url, role, is_active, email_verified, created_at, updated_at 
      FROM users 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    values.push(limit, offset);
    
    const dataResult = await db.query(dataQuery, values);
    
    return {
      users: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async deleteById(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id, email, first_name, last_name';
    const result = await db.query(query, [id]);
    
    return result.rows[0] || null;
  }

  async changePassword(userId, currentPassword, newPassword) {
    // Get current user
    const userQuery = 'SELECT id, password_hash FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isMatch) {
      return {
        success: false,
        message: 'Current password is incorrect'
      };
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    const updateQuery = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await db.query(updateQuery, [hashedPassword, userId]);
    
    return {
      success: true,
      message: 'Password updated successfully'
    };
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    
    return result.rows[0] || null;
  }
}

module.exports = new UserService();