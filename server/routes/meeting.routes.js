const express = require('express');
const router = express.Router();
const { 
  createMeeting, 
  getUserMeetings, 
  updateMeetingStatus, 
  getMeetingDetails,
  deleteMeeting 
} = require('../controllers/meeting.controller');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createMeeting)
  .get(getUserMeetings);

router.route('/:id')
  .get(getMeetingDetails)
  .delete(deleteMeeting);

router.route('/:id/status')
  .put(updateMeetingStatus);

module.exports = router; 