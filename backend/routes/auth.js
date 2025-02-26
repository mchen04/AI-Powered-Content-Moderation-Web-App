const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route GET /api/auth/user
 * @desc Get current user information
 * @access Private (requires authentication)
 */
router.get('/user', authMiddleware.verifyToken, authController.getCurrentUser);

/**
 * @route POST /api/auth/logout
 * @desc Logout a user
 * @access Private (requires authentication)
 */
router.post('/logout', authMiddleware.verifyToken, authController.logout);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh authentication token
 * @access Public (with refresh token)
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /api/auth/reset-password
 * @desc Request password reset
 * @access Public
 */
router.post('/reset-password', authController.requestPasswordReset);

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Reset password with token
 * @access Public (with reset token)
 */
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;