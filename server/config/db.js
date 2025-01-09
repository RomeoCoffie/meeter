const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// First, create a connection without specifying a database
const createDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log('Database created or already exists');
  } catch (err) {
    console.error('Error creating database:', err);
    throw err;
  } finally {
    await connection.end();
  }
};

// Then create the pool with the database specified
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'meeting_scheduler',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const connectDB = async () => {
  try {
    // First create database if it doesn't exist
    await createDatabase();

    // Then connect to the database
    await pool.getConnection();
    console.log('MySQL Connected...');
    
    // Create tables if they don't exist
    await initializeTables();
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
};

const initializeTables = async () => {
  const connection = await pool.getConnection();
  try {
    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        user_type ENUM('freelancer', 'client') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Meetings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        duration INT NOT NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Meeting participants table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        meeting_id INT,
        user_id INT,
        status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
        FOREIGN KEY (meeting_id) REFERENCES meetings(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        PRIMARY KEY (meeting_id, user_id)
      )
    `);

    // User availability table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_availability (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        date DATE NOT NULL,
        is_available BOOLEAN DEFAULT true,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

  } catch (err) {
    console.error('Error initializing tables:', err);
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = { connectDB, pool }; 