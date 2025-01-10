const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /auth/register
// @access  Public
const register = async (req, res) => {
  const { fullName, email, password } = req.body;
  // Set a default user type that can be updated later in the profile
  const defaultUserType = 'freelancer';

  try {
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default user type
    const result = await pool.query(
      'INSERT INTO users (full_name, email, password, user_type) VALUES ($1, $2, $3, $4) RETURNING id',
      [fullName, email, hashedPassword, defaultUserType]
    );

    if (!result.rows[0].id) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create user'
      });
    }

    const newUser = await pool.query(
      'SELECT id, full_name, email, user_type FROM users WHERE id = $1',
      [result.rows[0].id]
    );

    const token = generateToken(result.rows[0].id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.rows[0].id,
          fullName: newUser.rows[0].full_name,
          email: newUser.rows[0].email,
          userType: newUser.rows[0].user_type
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

// @desc    Login user
// @route   POST /auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for email:', email);
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];
    console.log('User found:', { id: user.id, email: user.email });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
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
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

module.exports = {
  register,
  login
}; 