// backend/src/services/blogService.js
const db = require('../config/database');

class BlogService {
  async findAll(filters = {}) {
    const { tag = '', status = 'published', page = 1, limit = 10 } = filters;
    
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const values = [];
    
    if (tag) {
      whereClause += ` AND $${values.length + 1} = ANY(tags)`;
      values.push(tag);
    }
    
    if (status) {
      whereClause += ` AND status = $${values.length + 1}`;
      values.push(status);
    }
    
    // Count query
    const countQuery = `SELECT COUNT(*) FROM posts ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);
    
    // Data query
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        p.id, p.title, p.slug, p.excerpt, p.featured_image, p.status, 
        p.published_at, p.created_at, p.updated_at, p.tags,
        u.first_name, u.last_name, u.avatar_url
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ${whereClause}
      ORDER BY p.published_at DESC, p.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    values.push(limit, offset);
    
    const dataResult = await db.query(dataQuery, values);
    
    return {
      posts: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findBySlug(slug) {
    const query = `
      SELECT 
        p.*, 
        u.first_name, u.last_name, u.avatar_url
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.slug = $1
    `;
    const result = await db.query(query, [slug]);
    
    return result.rows[0] || null;
  }

  async create(postData) {
    const {
      title,
      slug,
      content,
      excerpt = '',
      featured_image = null,
      author_id,
      status = 'draft',
      tags = [],
      published_at = null
    } = postData;

    const query = `
      INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, tags, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      title,
      slug,
      content,
      excerpt,
      featured_image,
      author_id,
      status,
      tags,
      published_at
    ];
    
    const result = await db.query(query, values);
    
    return result.rows[0];
  }

  async updateById(id, postData) {
    // Build dynamic query
    const allowedFields = [
      'title', 'slug', 'content', 'excerpt', 'featured_image', 
      'status', 'tags', 'published_at'
    ];
    
    const filteredData = {};
    for (const key in postData) {
      if (allowedFields.includes(key)) {
        filteredData[key] = postData[key];
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
    
    const query = `UPDATE posts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
    
    const result = await db.query(query, values);
    
    return result.rows[0] || null;
  }

  async deleteById(id) {
    const query = 'DELETE FROM posts WHERE id = $1 RETURNING id, title';
    const result = await db.query(query, [id]);
    
    return result.rows[0] || null;
  }

  async togglePublish(id) {
    const query = `
      UPDATE posts 
      SET 
        status = CASE WHEN status = 'published' THEN 'draft' ELSE 'published' END,
        published_at = CASE WHEN status = 'published' THEN NULL ELSE CURRENT_TIMESTAMP END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    
    return result.rows[0] || null;
  }
}

module.exports = new BlogService();