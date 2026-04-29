import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter middleware
 * Limits requests to 100 per 15 minutes per IP address
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health check endpoint
  skip: (req) => {
    return req.path === '/api/health';
  },
  // Custom key generator if needed (defaults to IP address)
  keyGenerator: (req, res) => {
    // Use X-Forwarded-For if behind a proxy, otherwise use IP
    return req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 * Limits requests to 5 per 15 minutes per IP (prevent brute force attacks)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});
