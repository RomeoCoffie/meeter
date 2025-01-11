const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const {
  createMeeting,
  getUserMeetings,
  updateMeetingStatus,
  getMeetingDetails
} = require('../controllers/meeting.controller');

router.use(protect);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('datetime').isISO8601().withMessage('Valid date and time is required'),
    body('duration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
    body('participants').isArray().withMessage('Participants must be an array'),
    validate
  ],
  createMeeting
);

router.get(
  '/',
  [
    query('search').optional().isString(),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('status').optional().isIn(['pending', 'accepted', 'declined']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate
  ],
  getUserMeetings
);

router.get('/:id', getMeetingDetails);

router.put(
  '/:id/status',
  [
    body('status')
      .isIn(['accepted', 'declined'])
      .withMessage('Status must be either accepted or declined'),
    validate
  ],
  updateMeetingStatus
);

module.exports = router; 