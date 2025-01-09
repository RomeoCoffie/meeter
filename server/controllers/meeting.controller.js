const { pool } = require('../config/db');

// @desc    Create new meeting
// @route   POST /api/meetings
// @access  Private
const createMeeting = async (req, res) => {
  const { title, description, startTime, duration, participants } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Create meeting
    const [result] = await connection.query(
      'INSERT INTO meetings (title, description, start_time, duration, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, description, startTime, duration, req.user.id]
    );

    // Add participants
    const participantValues = participants.map(userId => [result.insertId, userId]);
    await connection.query(
      'INSERT INTO meeting_participants (meeting_id, user_id) VALUES ?',
      [participantValues]
    );

    await connection.commit();

    // Get meeting with participants
    const [meeting] = await pool.query(
      `SELECT m.*, GROUP_CONCAT(u.full_name) as participant_names 
       FROM meetings m 
       LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id 
       LEFT JOIN users u ON mp.user_id = u.id 
       WHERE m.id = ? 
       GROUP BY m.id`,
      [result.insertId]
    );

    res.status(201).json(meeting[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// @desc    Get user's meetings with search and filters
// @route   GET /api/meetings
// @access  Private
const getUserMeetings = async (req, res) => {
  const { 
    search, 
    startDate, 
    endDate, 
    status,
    limit = 10,
    page = 1
  } = req.query;

  let query = `
    SELECT 
      m.*, 
      GROUP_CONCAT(u.full_name) as participant_names,
      COUNT(*) OVER() as total_count
    FROM meetings m 
    LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id 
    LEFT JOIN users u ON mp.user_id = u.id 
    WHERE (m.created_by = ? OR mp.user_id = ?)
  `;

  const queryParams = [req.user.id, req.user.id];

  if (search) {
    query += ` AND (m.title LIKE ? OR m.description LIKE ?)`;
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  if (startDate) {
    query += ` AND m.start_time >= ?`;
    queryParams.push(startDate);
  }

  if (endDate) {
    query += ` AND m.start_time <= ?`;
    queryParams.push(endDate);
  }

  if (status) {
    query += ` AND mp.status = ?`;
    queryParams.push(status);
  }

  query += ` GROUP BY m.id ORDER BY m.start_time DESC`;
  
  // Add pagination
  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), offset);

  const [meetings] = await pool.query(query, queryParams);

  const totalCount = meetings.length > 0 ? meetings[0].total_count : 0;

  res.json({
    meetings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    }
  });
};

// @desc    Update meeting status
// @route   PUT /api/meetings/:id/status
// @access  Private
const updateMeetingStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  await pool.query(
    'UPDATE meeting_participants SET status = ? WHERE meeting_id = ? AND user_id = ?',
    [status, id, req.user.id]
  );

  res.json({ message: 'Meeting status updated' });
};

// @desc    Get meeting details
// @route   GET /api/meetings/:id
// @access  Private
const getMeetingDetails = async (req, res) => {
  const [meeting] = await pool.query(
    `SELECT 
      m.*,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', u.id,
          'name', u.full_name,
          'status', mp.status
        )
      ) as participants
    FROM meetings m 
    LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id 
    LEFT JOIN users u ON mp.user_id = u.id 
    WHERE m.id = ?
    GROUP BY m.id`,
    [req.params.id]
  );

  if (!meeting[0]) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  res.json(meeting[0]);
};

module.exports = {
  createMeeting,
  getUserMeetings,
  updateMeetingStatus,
  getMeetingDetails
}; 