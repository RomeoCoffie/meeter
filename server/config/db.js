const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL Connected...');
    
    // Create tables if they don't exist
    await initializeTables();
    client.release();
  } catch (err) {
    console.error('Error connecting to the database:', err);
    // Don't exit the process in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

const initializeTables = async () => {
  const client = await pool.connect();
  try {
    // Create enum type for user_type if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_type_enum AS ENUM ('freelancer', 'client');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create enum type for meeting status if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE meeting_status_enum AS ENUM ('pending', 'accepted', 'declined');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Users table with additional profile fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        user_type user_type_enum NOT NULL,
        phone VARCHAR(50),
        skills TEXT,
        hourly_rate DECIMAL(10,2),
        experience INTEGER,
        company VARCHAR(255),
        industry VARCHAR(255),
        project_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist (for existing tables)
    const columns = [
      'phone VARCHAR(50)',
      'skills TEXT',
      'hourly_rate DECIMAL(10,2)',
      'experience INTEGER',
      'company VARCHAR(255)',
      'industry VARCHAR(255)',
      'project_description TEXT'
    ];

    for (const column of columns) {
      const columnName = column.split(' ')[0];
      await client.query(`
        DO $$ 
        BEGIN
          BEGIN
            ALTER TABLE users ADD COLUMN ${column};
          EXCEPTION
            WHEN duplicate_column THEN null;
          END;
        END $$;
      `);
    }

    // Meetings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Meeting participants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        meeting_id INTEGER REFERENCES meetings(id),
        user_id INTEGER REFERENCES users(id),
        status meeting_status_enum DEFAULT 'pending',
        PRIMARY KEY (meeting_id, user_id)
      )
    `);

    // User availability table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_availability (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        date DATE NOT NULL,
        is_available BOOLEAN DEFAULT true
      )
    `);

  } catch (err) {
    console.error('Error initializing tables:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { connectDB, pool }; 