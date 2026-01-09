// backend/src/services/projectService.js
const db = require('../config/database');

class ProjectService {
  async findAll(filters = {}) {
    const { category = '', status = 'active', page = 1, limit = 10 } = filters;
    
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const values = [];
    
    if (category) {
      whereClause += ` AND category = $${values.length + 1}`;
      values.push(category);
    }
    
    if (status) {
      whereClause += ` AND status = $${values.length + 1}`;
      values.push(status);
    }
    
    // Count query
    const countQuery = `SELECT COUNT(*) FROM projects ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);
    
    // Data query
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT id, title, slug, description, content, featured_image, project_url, github_url, technologies, category, status, order_index, created_at, updated_at
      FROM projects
      ${whereClause}
      ORDER BY order_index ASC, created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    values.push(limit, offset);
    
    const dataResult = await db.query(dataQuery, values);
    
    return {
      projects: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findBySlug(slug) {
    const query = 'SELECT * FROM projects WHERE slug = $1';
    const result = await db.query(query, [slug]);
    
    return result.rows[0] || null;
  }

  async create(projectData) {
    const {
      title,
      slug,
      description = '',
      content = '',
      featured_image = null,
      project_url = null,
      github_url = null,
      technologies = [],
      category = '',
      status = 'active',
      order_index = 0
    } = projectData;

    const query = `
      INSERT INTO projects (title, slug, description, content, featured_image, project_url, github_url, technologies, category, status, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      title,
      slug,
      description,
      content,
      featured_image,
      project_url,
      github_url,
      technologies,
      category,
      status,
      order_index
    ];
    
    const result = await db.query(query, values);
    
    return result.rows[0];
  }

  async updateById(id, projectData) {
    // Build dynamic query
    const allowedFields = [
      'title', 'slug', 'description', 'content', 'featured_image', 
      'project_url', 'github_url', 'technologies', 'category', 
      'status', 'order_index'
    ];
    
    const filteredData = {};
    for (const key in projectData) {
      if (allowedFields.includes(key)) {
        filteredData[key] = projectData[key];
      }
    }
    
    if (Object.keys(filteredData).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    const setClause = Object.keys(filteredData)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const values = Object.values(filteredData);
    values.push(id); // For WHERE clause
    
    const query = `UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
    
    const result = await db.query(query, values);
    
    return result.rows[0] || null;
  }

  async deleteById(id) {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING id, title';
    const result = await db.query(query, [id]);
    
    return result.rows[0] || null;
  }
}

module.exports = new ProjectService();