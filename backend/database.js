// backend/database.js
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");

    // --- USERS ---
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // --- TEAMS ---
    db.run(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        profile_picture TEXT,
        owner_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )
    `);

    // --- TEAM MEMBERS ---
    db.run(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'tutor', -- role within team
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(team_id, user_id)
      )
    `);

    // --- ASSIGNMENTS ---
    db.run(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        created_by INTEGER NOT NULL, -- admin who created
        team_id INTEGER, -- optional team association
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (team_id) REFERENCES teams(id)
      )
    `);

    // --- SUBMISSIONS ---
    db.run(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        student_identifier TEXT NOT NULL,
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id)
      )
    `);

    // --- RUBRICS ---
    db.run(`
      CREATE TABLE IF NOT EXISTS rubrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        section_name TEXT NOT NULL,
        description TEXT,
        max_marks INTEGER NOT NULL,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id)
      )
    `);

    // --- MARKS ---
    db.run(`
      CREATE TABLE IF NOT EXISTS marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        rubric_id INTEGER NOT NULL,
        tutor_id INTEGER NOT NULL,
        marks_awarded INTEGER NOT NULL,
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES submissions(id),
        FOREIGN KEY (rubric_id) REFERENCES rubrics(id),
        FOREIGN KEY (tutor_id) REFERENCES users(id)
      )
    `);

    // --- CONTROL MARKS ---
    db.run(`
      CREATE TABLE IF NOT EXISTS control_marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        rubric_id INTEGER NOT NULL,
        official_marks INTEGER NOT NULL,
        comments TEXT,
        FOREIGN KEY (submission_id) REFERENCES submissions(id),
        FOREIGN KEY (rubric_id) REFERENCES rubrics(id)
      )
    `);

    // --- TEAM INVITES ---
    db.run(`
      CREATE TABLE IF NOT EXISTS team_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        inviter_id INTEGER NOT NULL,
        invitee_email TEXT NOT NULL,
        status TEXT DEFAULT 'pending', -- pending | accepted | declined
        token TEXT UNIQUE NOT NULL, -- random string for invite link
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (inviter_id) REFERENCES users(id)
      )
    `);

    console.log("All tables created or verified.");
  }
});

module.exports = db;
