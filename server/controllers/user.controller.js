const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, full_name, email, user_type, 
        phone, skills, hourly_rate, experience,
        company, industry, project_description,
        created_at,
        (SELECT COUNT(*) FROM meetings WHERE created_by = users.id) as meetings_created,
        (SELECT COUNT(*) FROM meeting_participants WHERE user_id = users.id) as meetings_participated
      FROM users 
      WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const { 
    fullName, 
    email, 
    currentPassword, 
    newPassword, 
    userType,
    phone,
    skills,
    hourlyRate,
    experience,
    company,
    industry,
    projectDescription
  } = req.body;

  try {
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, req.user.id]
        );

        if (existingUser.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use'
          });
        }
      }

      let updateQuery = 'UPDATE users SET ';
      const updateValues = [];
      const queryParams = [];
      let paramCount = 1;

      if (fullName) {
        updateValues.push(`full_name = $${paramCount}`);
        queryParams.push(fullName);
        paramCount++;
      }

      if (email) {
        updateValues.push(`email = $${paramCount}`);
        queryParams.push(email);
        paramCount++;
      }

      if (userType) {
        updateValues.push(`user_type = $${paramCount}`);
        queryParams.push(userType);
        paramCount++;
      }

      // Add new profile fields
      if (phone !== undefined) {
        updateValues.push(`phone = $${paramCount}`);
        queryParams.push(phone);
        paramCount++;
      }

      if (skills !== undefined) {
        updateValues.push(`skills = $${paramCount}`);
        queryParams.push(skills);
        paramCount++;
      }

      if (hourlyRate !== undefined) {
        updateValues.push(`hourly_rate = $${paramCount}`);
        queryParams.push(hourlyRate);
        paramCount++;
      }

      if (experience !== undefined) {
        updateValues.push(`experience = $${paramCount}`);
        queryParams.push(experience);
        paramCount++;
      }

      if (company !== undefined) {
        updateValues.push(`company = $${paramCount}`);
        queryParams.push(company);
        paramCount++;
      }

      if (industry !== undefined) {
        updateValues.push(`industry = $${paramCount}`);
        queryParams.push(industry);
        paramCount++;
      }

      if (projectDescription !== undefined) {
        updateValues.push(`project_description = $${paramCount}`);
        queryParams.push(projectDescription);
        paramCount++;
      }

      // Handle password update
      if (currentPassword && newPassword) {
        const user = await client.query(
          'SELECT password FROM users WHERE id = $1',
          [req.user.id]
        );

        const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
          });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        updateValues.push(`password = $${paramCount}`);
        queryParams.push(hashedPassword);
        paramCount++;
      }

      if (updateValues.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      // Add WHERE clause
      updateQuery += updateValues.join(', ') + ` WHERE id = $${paramCount}`;
      queryParams.push(req.user.id);

      // Execute update
      await client.query(updateQuery, queryParams);

      // Get updated user profile
      const result = await client.query(
        `SELECT 
          id, full_name, email, user_type,
          phone, skills, hourly_rate, experience,
          company, industry, project_description
        FROM users WHERE id = $1`,
        [req.user.id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// @desc    Get user's meeting statistics
// @route   GET /users/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM meetings WHERE created_by = $1) as meetings_created,
        (SELECT COUNT(*) FROM meeting_participants WHERE user_id = $1 AND status = 'accepted') as meetings_accepted,
        (SELECT COUNT(*) FROM meeting_participants WHERE user_id = $1 AND status = 'pending') as meetings_pending`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving stats'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserStats
}; 