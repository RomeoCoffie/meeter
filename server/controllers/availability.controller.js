const { pool } = require('../config/db');

// @desc    Update user availability
// @route   POST /availability
// @access  Private
const updateAvailability = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First, delete existing availability for the dates being updated
    await client.query(
      'DELETE FROM user_availability WHERE user_id = $1 AND date = ANY($2::date[])',
      [req.user.id, req.body.dates]
    );

    // Then insert new availability records
    const insertQuery = `
      INSERT INTO user_availability (user_id, date, is_available)
      SELECT $1, unnest($2::date[]), $3
    `;
    
    await client.query(insertQuery, [
      req.user.id,
      req.body.dates,
      false // false means the user is unavailable on these dates
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Availability updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating availability'
    });
  } finally {
    client.release();
  }
};

// @desc    Get user availability
// @route   GET /availability
// @access  Private
const getAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = `
      SELECT date, is_available
      FROM user_availability
      WHERE user_id = $1
        AND date >= $2::date
        AND date <= $3::date
      ORDER BY date
    `;
    
    const result = await pool.query(query, [req.user.id, startDate, endDate]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving availability'
    });
  }
};

module.exports = {
  updateAvailability,
  getAvailability
}; 