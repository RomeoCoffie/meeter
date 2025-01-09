const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const [user] = await pool.query(
    `SELECT 
      id, full_name, email, user_type, 
      created_at,
      (SELECT COUNT(*) FROM meetings WHERE created_by = users.id) as meetings_created,
      (SELECT COUNT(*) FROM meeting_participants WHERE user_id = users.id) as meetings_participated
    FROM users 
    WHERE id = ?`,
    [req.user.id]
  );

  if (!user[0]) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user[0]);
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const { fullName, email, currentPassword, newPassword } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if email is already taken by another user
    if (email) {
      const [existingUser] = await connection.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.id]
      );

      if (existingUser.length > 0) {
        res.status(400);
        throw new Error('Email already in use');
      }
    }

    let updateQuery = 'UPDATE users SET ';
    const updateParams = [];

    if (fullName) {
      updateQuery += 'full_name = ?, ';
      updateParams.push(fullName);
    }

    if (email) {
      updateQuery += 'email = ?, ';
      updateParams.push(email);
    }

    // Handle password update
    if (currentPassword && newPassword) {
      const [user] = await connection.query(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id]
      );

      const isMatch = await bcrypt.compare(currentPassword, user[0].password);
      if (!isMatch) {
        res.status(400);
        throw new Error('Current password is incorrect');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      updateQuery += 'password = ?, ';
      updateParams.push(hashedPassword);
    }

    // Remove trailing comma and add WHERE clause
    updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
    updateParams.push(req.user.id);

    await connection.query(updateQuery, updateParams);
    await connection.commit();

    // Get updated user profile
    const [updatedUser] = await pool.query(
      'SELECT id, full_name, email, user_type FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(updatedUser[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// @desc    Get user's meeting statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  const [stats] = await pool.query(
    `SELECT 
      (SELECT COUNT(*) FROM meetings WHERE created_by = ?) as meetings_created,
      (SELECT COUNT(*) FROM meeting_participants WHERE user_id = ? AND status = 'accepted') as meetings_accepted,
      (SELECT COUNT(*) FROM meeting_participants WHERE user_id = ? AND status = 'pending') as meetings_pending
    FROM dual`,
    [req.user.id, req.user.id, req.user.id]
  );

  res.json(stats[0]);
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserStats
}; 