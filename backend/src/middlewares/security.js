// backend/src/middlewares/security.js
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const xss = require('xss');

// Rate limiting middleware
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs, // milliseconds
    max, // limit each IP to requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

// Specific rate limiters
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // Limit each IP to 5 requests per windowMs for auth
  'Too many authentication attempts, please try again after 15 minutes'
);

const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // Limit each IP to 100 requests per windowMs
  'Too many requests, please try again later'
);

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Sanitize potential XSS
        req.body[key] = xss(req.body[key]);
        
        // Validate and sanitize based on field type
        if (key.includes('email')) {
          req.body[key] = validator.normalizeEmail(req.body[key], { 
            gmail_remove_dots: false 
          });
        }
      }
    }
  }
  
  next();
};

// Validate and sanitize query parameters
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    for (let key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key]);
      }
    }
  }
  
  next();
};

// Validate and sanitize URL parameters
const sanitizeParams = (req, res, next) => {
  if (req.params) {
    for (let key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = xss(req.params[key]);
      }
    }
  }
  
  next();
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // In production, replace with your frontend domain
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent loading content from other domains
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Set Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
  
  next();
};

module.exports = {
  authLimiter,
  generalLimiter,
  sanitizeInput,
  sanitizeQuery,
  sanitizeParams,
  corsOptions,
  securityHeaders
};