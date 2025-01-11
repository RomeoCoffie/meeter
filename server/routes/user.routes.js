const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const {
  updateAvailability,
  getAvailability
} = require('../controllers/availability.controller');
const {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getAllUsers
} = require('../controllers/user.controller');

router.use(protect);

// Profile routes
router.get('/profile', getUserProfile);
router.put(
  '/profile',
  [
    body('fullName').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().isEmail().withMessage('Please include a valid email'),
    body('newPassword')
      .optional()
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    body('currentPassword')
      .if(body('newPassword').exists())
      .notEmpty()
      .withMessage('Current password is required to set new password'),
    validate
  ],
  updateUserProfile
);
router.get('/stats', getUserStats);

// Get all users
router.get('/list', getAllUsers);

// Availability routes
router.post(
  '/availability',
  [
    body('dates').isArray().withMessage('Dates must be an array'),
    body('dates.*').isISO8601().withMessage('Invalid date format'),
    body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean'),
    validate
  ],
  updateAvailability
);

router.get(
  '/availability',
  [
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required'),
    validate
  ],
  getAvailability
);

module.exports = router; 