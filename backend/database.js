// backend/database.js
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config(); // loads DATABASE_URL from .env

// Create a pool using your DATABASE_URL from Render or local .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // allows self-signed certs (Render’s default)
  },
});


// Function to initialize tables
async function initDB() {
  try {
    // USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // TEAMS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        profile_picture TEXT,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // TEAM MEMBERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        role TEXT NOT NULL DEFAULT 'tutor',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      );
    `);

    // ASSIGNMENTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id),
        team_id INTEGER REFERENCES teams(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        due_date TIMESTAMPTZ
      );
    `);

    // Ensure due_date exists for older DBs
    await pool.query(`
      ALTER TABLE assignments
      ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
    `);
    console.log("✅ Checked assignments table: due_date column exists or was added.");

    // SUBMISSIONS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id),
        student_identifier TEXT NOT NULL,
        file_path TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // RUBRICS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rubrics (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id),
        section_name TEXT NOT NULL,
        description TEXT,
        max_marks INTEGER NOT NULL
      );
    `);

    // RUBRIC TIERS (new table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rubric_tiers (
        id SERIAL PRIMARY KEY,
        rubric_id INTEGER NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
        tier_name TEXT NOT NULL,
        description TEXT,
        marks INTEGER NOT NULL
      );
    `);
    console.log("✅ Rubric tiers table checked/created.");

    // MARKS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marks (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES submissions(id),
        rubric_id INTEGER NOT NULL REFERENCES rubrics(id),
        tutor_id INTEGER NOT NULL REFERENCES users(id),
        marks_awarded INTEGER NOT NULL,
        comments TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // CONTROL MARKS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS control_marks (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES submissions(id),
        rubric_id INTEGER NOT NULL REFERENCES rubrics(id),
        official_marks INTEGER NOT NULL,
        comments TEXT
      );
    `);

    // TEAM INVITES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_invites (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id),
        inviter_id INTEGER NOT NULL REFERENCES users(id),
        invitee_email TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log("PostgreSQL tables initialized.");
  } catch (err) {
    console.error("Error initializing PostgreSQL tables:", err);
  }
}

// Immediately initialize DB on startup
initDB();

module.exports = pool;

