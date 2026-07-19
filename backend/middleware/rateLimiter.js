/**
 * Rate limiting middleware for RuralMed API
 * Prevents brute force attacks on login/register endpoints
 */

import rateLimit from 'express-rate-limit';

/**
 * Authentication rate limiter
 * 5 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true, // return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // count successful requests
  skipFailedRequests: false, // count failed requests
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per 15 minutes
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
