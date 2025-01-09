const { pool } = require('../config/db');

// @desc    Update user availability
// @route   POST /api/users/availability
// @access  Private
const updateAvailability = async (req, res) => {
  const { dates, isAvailable } = req.body;
  const userId = req.user.id;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete existing availability for these dates
    await connection.query(
      'DELETE FROM user_availability WHERE user_id = ? AND date IN (?)',
      [userId, dates]
    );

    // Insert new availability
    const values = dates.map(date => [userId, date, isAvailable]);
    await connection.query(
      'INSERT INTO user_availability (user_id, date, is_available) VALUES ?',
      [values]
    );

    await connection.commit();
    res.json({ message: 'Availability updated successfully' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// @desc    Get user availability
// @route   GET /api/users/availability
// @access  Private
const getAvailability = async (req, res) => {
  const { startDate, endDate } = req.query;

  const [availability] = await pool.query(
    'SELECT date, is_available FROM user_availability WHERE user_id = ? AND date BETWEEN ? AND ?',
    [req.user.id, startDate, endDate]
  );

  res.json(availability);
};

module.exports = {
  updateAvailability,
  getAvailability
}; 