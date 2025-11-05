// backend/database.js
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

async function initDB() {
  try {
    // --- CREATE NEW TABLES ---

    // USERS (Kept as is)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // TEAMS (Kept as is)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        profile_picture TEXT,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // TEAM MEMBERS (Kept as is)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'tutor',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      );
    `);

    // TEAM INVITES (Kept as is)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_invites (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        inviter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_email TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ASSIGNMENTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        created_by INTEGER NOT NULL REFERENCES users(id),
        course_code TEXT NOT NULL,
        course_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Marking', -- 'Marking' or 'Completed'
        semester INTEGER NOT NULL,
        due_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ASSIGNMENT_MARKERS (Many-to-Many join table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignment_markers (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        UNIQUE(assignment_id, user_id)
      );
    `);



    // RUBRIC_CRITERIA (Each row of the rubric)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rubric_criteria (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        criterion_description TEXT NOT NULL,
        points NUMERIC(5, 2) NOT NULL,
        deviation_threshold NUMERIC(5, 2) NOT NULL DEFAULT 0,
        admin_comments TEXT
      );
    `);

    // RUBRIC_TIERS (The 5 rating levels for each criterion)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rubric_tiers (
        id SERIAL PRIMARY KEY,
        criterion_id INTEGER NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
        tier_name TEXT NOT NULL,
        description TEXT NOT NULL,
        lower_bound NUMERIC(5, 2) NOT NULL,
        upper_bound NUMERIC(5, 2) NOT NULL
      );
    `);

    // SUBMISSIONS (Includes flag for control papers)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_identifier TEXT NOT NULL,
        file_path TEXT,
        is_control_paper BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // MARKS (Stores individual marks from tutors for control papers)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marks (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        criterion_id INTEGER NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
        tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        marks_awarded NUMERIC(5, 2) NOT NULL,
        comments TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // REMINDERS_LOG (Tracks sent reminders to prevent duplicates)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reminders_log (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bucket_day INTEGER NOT NULL,
        sent_on DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(assignment_id, user_id, bucket_day, sent_on)
      );
    `);

    // NEW: Per-tutor per-criterion coordinator comments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tutor_criterion_comments (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        criterion_id INTEGER NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(assignment_id, tutor_id, criterion_id)
      );
    `);

    console.log("New database schema initialized successfully.");

  } catch (err) {
    console.error("Error during database reset and initialization:", err);
  }
}

// Immediately initialize DB on startup
initDB();

module.exports = pool;