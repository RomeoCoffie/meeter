const { pool } = require('../config/db');

// @desc    Create new meeting
// @route   POST /api/meetings
// @access  Private
const createMeeting = async (req, res) => {
  const { title, description, datetime, duration, participants } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create meeting
    const result = await client.query(
      'INSERT INTO meetings (title, description, start_time, duration, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [title, description, datetime, duration, req.user.id]
    );

    const meetingId = result.rows[0].id;

    // Add participants
    if (participants && participants.length > 0) {
      const participantValues = participants.map((userId, index) => 
        `($${index * 2 + 1}, $${index * 2 + 2})`
      ).join(', ');
      
      const participantParams = participants.flatMap(userId => [meetingId, userId]);
      
      await client.query(`
        INSERT INTO meeting_participants (meeting_id, user_id)
        VALUES ${participantValues}
      `, participantParams);
    }

    await client.query('COMMIT');

    // Get meeting with participants
    const meetingResult = await client.query(`
      SELECT 
        m.*,
        string_agg(u.full_name, ', ') as participant_names,
        json_agg(json_build_object(
          'id', u.id,
          'fullName', u.full_name,
          'email', u.email
        )) as participants
      FROM meetings m 
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id 
      LEFT JOIN users u ON mp.user_id = u.id 
      WHERE m.id = $1 
      GROUP BY m.id`,
      [meetingId]
    );

    res.status(201).json({
      success: true,
      data: meetingResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating meeting'
    });
  } finally {
    client.release();
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

  try {
    let query = `
      SELECT 
        m.*, 
        string_agg(u.full_name, ', ') as participant_names,
        COUNT(*) OVER() as total_count
      FROM meetings m 
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id 
      LEFT JOIN users u ON mp.user_id = u.id 
      WHERE (m.created_by = $1 OR mp.user_id = $1)
    `;

    const queryParams = [req.user.id];
    let paramCount = 2;

    if (search) {
      query += ` AND (m.title ILIKE $${paramCount} OR m.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (startDate) {
      query += ` AND m.start_time >= $${paramCount}`;
      queryParams.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND m.start_time <= $${paramCount}`;
      queryParams.push(endDate);
      paramCount++;
    }

    if (status) {
      query += ` AND mp.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    query += ` GROUP BY m.id ORDER BY m.start_time DESC`;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);
    const meetings = result.rows;
    const totalCount = meetings.length > 0 ? parseInt(meetings[0].total_count) : 0;

    res.json({
      success: true,
      data: {
        meetings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving meetings'
    });
  }
};

// @desc    Update meeting status
// @route   PUT /api/meetings/:id/status
// @access  Private
const updateMeetingStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    await pool.query(
      'UPDATE meeting_participants SET status = $1 WHERE meeting_id = $2 AND user_id = $3',
      [status, id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Meeting status updated'
    });
  } catch (error) {
    console.error('Error updating meeting status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating meeting status'
    });
  }
};

// @desc    Get meeting details
// @route   GET /api/meetings/:id
// @access  Private
const getMeetingDetails = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        json_agg(
          json_build_object(
            'id', u.id,
            'name', u.full_name,
            'status', mp.status
          )
        ) as participants
      FROM meetings m 
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id 
      LEFT JOIN users u ON mp.user_id = u.id 
      WHERE m.id = $1
      GROUP BY m.id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting meeting details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving meeting details'
    });
  }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private
const deleteMeeting = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First check if meeting exists and user has permission
    const meetingResult = await client.query(
      'SELECT created_by FROM meetings WHERE id = $1',
      [req.params.id]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Delete meeting participants first (due to foreign key constraint)
    await client.query(
      'DELETE FROM meeting_participants WHERE meeting_id = $1',
      [req.params.id]
    );

    // Then delete the meeting
    await client.query(
      'DELETE FROM meetings WHERE id = $1',
      [req.params.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting meeting'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createMeeting,
  getUserMeetings,
  updateMeetingStatus,
  getMeetingDetails,
  deleteMeeting
}; 