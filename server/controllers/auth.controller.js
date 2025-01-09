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

  if (result.insertId) {
    const [newUser] = await pool.query(
      'SELECT id, full_name, email, user_type FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      user: newUser[0],
      token: generateToken(result.insertId)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const [users] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const user = users[0];

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  res.json({
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      userType: user.user_type
    },
    token: generateToken(user.id)
  });
};

module.exports = {
  register,
  login
}; 