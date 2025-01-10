const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { fullName, email, password, userType } = req.body;

  try {
    // Check if user exists
    const [existingUser] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, user_type) VALUES (?, ?, ?, ?)',
      [fullName, email, hashedPassword, userType]
    );

    if (!result.insertId) {
      res.status(400);
      throw new Error('Failed to create user');
    }

    const [newUser] = await pool.query(
      'SELECT id, full_name, email, user_type FROM users WHERE id = ?',
      [result.insertId]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser[0].id,
          fullName: newUser[0].full_name,
          email: newUser[0].email,
          userType: newUser[0].user_type
        },
        token
      }
    });
  } catch (error) {
    // If error is not already handled (doesn't have a status code)
    if (!res.statusCode || res.statusCode === 200) {
      res.status(400);
    }
    throw error;
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for email:', email);
    
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('No user found with email:', email);
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const user = users[0];
    console.log('User found:', { id: user.id, email: user.email });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user.id);

    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          userType: user.user_type
        },
        token
      }
    };
    
    console.log('Sending successful login response');
    res.json(response);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401);
    throw new Error(error.message);
  }
};

module.exports = {
  register,
  login
}; 