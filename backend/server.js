//////////////////////////////////////////////////////////////////////
//  server.js (Postgres version)
//  ------------------------
//  Backend API for assignment marking portal
//  - Handles user authentication (signup, login, logout)
//  - Manages JWT token creation and verification
//  - Sends email verification codes via Nodemailer
//  - Supports password reset flow
//////////////////////////////////////////////////////////////////////

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./database.js");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || "supersecret"; // use .env in prod

// Temporary in-memory store for email verification codes
const verificationCodes = {};

// Middleware Setup
const allowedOrigins = [
  "http://localhost:5173",      
  "https://markingapp-frontend.onrender.com"  
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER || "markingapp3077@gmail.com",
    pass: process.env.EMAIL_PASS || "mche wvuu wkbh nxbi",
  },
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//  JWT Helpers
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function generateToken(user) {
  return jwt.sign({ username: user.username, id: user.id }, SECRET, { expiresIn: "24h" });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid/expired token" });
    req.user = user;
    next();
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Signup Flow
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = { code, expires: Date.now() + 10 * 60 * 1000 };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your verification code",
      text: `Your verification code is: ${code}. This code will expire in 10 minutes`,
    });
    res.json({ message: "Verification code sent" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ message: "Error sending email" });
  }
});

app.post("/verify-code", async (req, res) => {
  const { email, password, code } = req.body;
  const record = verificationCodes[email];

  if (!record) return res.status(400).json({ message: "No code sent to this email" });
  if (record.expires < Date.now()) return res.status(400).json({ message: "Code expired" });
  if (record.code !== code) return res.status(400).json({ message: "Invalid code" });

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      [email, hashedPassword]
    );
    delete verificationCodes[email];
    res.json({ message: "Signup successful" });
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ message: "User already exists" });
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
});

////////////////////////////////////////////////////////////////////
//  Login
////////////////////////////////////////////////////////////////////

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: "Invalid login" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid login" });

    const token = generateToken(user);

    // Include minimal user info in the response
    res.json({ 
      message: "Login successful", 
      token, 
      user: { id: user.id, username: user.username } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
//  Forgot Password
////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/check-user", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT id FROM users WHERE username=$1", [email]);
    if (result.rows.length === 0) return res.json({ exists: false, message: "User not found" });
    res.json({ exists: true, message: "User exists" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});

app.post("/verify-code-forgetpassword", (req, res) => {
  const { email, code } = req.body;
  const record = verificationCodes[email];

  if (!record) return res.status(400).json({ message: "No code sent to this email" });
  if (record.expires < Date.now()) return res.status(400).json({ message: "Code expired" });
  if (record.code !== code) return res.status(400).json({ message: "Invalid code" });

  res.json({ message: "Code verified, please reset your password." });
});

app.post("/forgetpassword", async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "UPDATE users SET password=$1 WHERE username=$2",
      [hashedPassword, email]
    );
    if (result.rowCount === 0) return res.status(400).json({ message: "User not found" });
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});

//////////////////////////////////////////////////////////////////////////
//  Resend Code
//////////////////////////////////////////////////////////////////////////

app.post("/resend-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const existing = verificationCodes[email];
  if (existing && existing.expires > Date.now()) {
    return res.status(400).json({ message: "Code already sent. Please wait until it expires." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = { code, expires: Date.now() + 5 * 60 * 1000 };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your verification code",
      text: `Your code is: ${code}. This code will expire in 5 minutes`,
    });
    res.json({ message: "Verification code resent" });
  } catch (err) {
    console.error("Resend code error:", err);
    res.status(500).json({ message: "Failed to resend code" });
  }
});

////////////////////////////////////////////////////////////////////
// Teams
////////////////////////////////////////////////////////////////////

app.get("/my-team", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.profile_picture, t.created_at, tm.role AS user_role
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id=$1`,
      [userId]
    );
    res.json({
      hasTeams: result.rows.length > 0,
      teams: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check teams" });
  }
});

app.post("/create-team", authenticateToken, async (req, res) => {
  const { name } = req.body;
  const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;
  const userId = req.user.id;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Team name is required." });
  }

  try {
    const teamRes = await pool.query(
      "INSERT INTO teams (name, profile_picture, owner_id) VALUES ($1,$2,$3) RETURNING id,name,profile_picture",
      [name, profilePicture, userId]
    );
    const teamId = teamRes.rows[0].id;

    await pool.query(
      "INSERT INTO team_members (team_id, user_id, role) VALUES ($1,$2,'admin')",
      [teamId, userId]
    );

    res.status(201).json({
      message: "Team created successfully.",
      team: teamRes.rows[0],
    });
  } catch (err) {
    console.error("Failed to create team:", err);
    res.status(500).json({ error: "Failed to create team." });
  }
});

app.get("/team/:teamId", authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT t.id,t.name,t.profile_picture,t.created_at,tm.role AS user_role
       FROM team_members tm
       JOIN teams t ON tm.team_id=t.id
       WHERE t.id=$1 AND tm.user_id=$2`,
      [teamId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Team not found or access denied" });

    res.json({ team: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch team details" });
  }
});

app.get("/team/:teamId/members", authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.id,u.username,tm.role
       FROM team_members tm
       JOIN users u ON tm.user_id=u.id
       WHERE tm.team_id=$1`,
      [teamId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: "No team members found" });
    res.json({ members: result.rows });
  } catch (err) {
    console.error("Failed to fetch team members:", err);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// Invite multiple users to a team
app.post("/team/:teamId/invite", authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  const { emails } = req.body; // expects an array of emails
  const inviterId = req.user.id;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "No emails provided." });
  }

  try {
    const results = [];
    for (const email of emails) {
      // 1. Check if user with this email is already in the team
      const memberCheck = await pool.query(
        `SELECT u.id
         FROM users u
         JOIN team_members tm ON u.id = tm.user_id
         WHERE tm.team_id = $1 AND u.username = $2`,
        [teamId, email]
      );

      if (memberCheck.rows.length > 0) {
        results.push({ email, status: "already_member" });
        continue; // skip to next email
      }

      // 2. Check if invite already exists and is still pending
      const inviteCheck = await pool.query(
        `SELECT id FROM team_invites
         WHERE team_id=$1 AND invitee_email=$2 AND status='pending'`,
        [teamId, email]
      );

      if (inviteCheck.rows.length > 0) {
        results.push({ email, status: "already_invited" });
        continue; // skip to next email
      }

      // 3. Create invite + send mail
      const inviteToken = require("crypto").randomBytes(32).toString("hex");

      await pool.query(
        `INSERT INTO team_invites (team_id, inviter_id, invitee_email, token, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [teamId, inviterId, email, inviteToken]
      );

      const inviteUrl = `${process.env.FRONTEND_URL}join-team?token=${inviteToken}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "You're invited to join a team!",
        html: `<p>You have been invited to join a team.</p>
               <p>Click below to accept the invitation:</p>
               <a href="${inviteUrl}">Join Team</a>`,
      });

      results.push({ email, status: "sent" });
    }

    res.json({ message: "Invitation process complete", results });
  } catch (err) {
    console.error("Error sending invites:", err);
    res.status(500).json({ error: "Failed to send invites" });
  }
});


// Accept or deny an invite
app.post("/team/invite/:token/respond", authenticateToken, async (req, res) => {
  const { token } = req.params;
  const { action } = req.body; // 'accept' or 'deny'
  const userId = req.user.id;

  try {
    const inviteRes = await pool.query(
      "SELECT * FROM team_invites WHERE token=$1 AND status='pending'",
      [token]
    );
    const invite = inviteRes.rows[0];
    if (!invite) return res.status(404).json({ error: "Invite not found or already responded" });

    if (action === "accept") {
      // Add user to team_members
      await pool.query(
        "INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'tutor')",
        [invite.team_id, userId]
      );
      await pool.query(
        "UPDATE team_invites SET status='accepted' WHERE id=$1",
        [invite.id]
      );
      res.json({ message: "Invite accepted" });
    } else if (action === "deny") {
      await pool.query(
        "UPDATE team_invites SET status='denied' WHERE id=$1",
        [invite.id]
      );
      res.json({ message: "Invite denied" });
    } else {
      res.status(400).json({ error: "Invalid action" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to respond to invite" });
  }
});

// Get invite details by token
app.get("/team/invite/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const inviteRes = await pool.query(
      `SELECT 
         ti.id, 
         ti.team_id, 
         ti.invitee_email, 
         ti.status, 
         t.name AS team_name,
         u.username AS inviter_email
       FROM team_invites ti
       JOIN teams t ON ti.team_id = t.id
       JOIN users u ON ti.inviter_id = u.id
       WHERE ti.token = $1`,
      [token]
    );

    const invite = inviteRes.rows[0];
    if (!invite) return res.status(404).json({ error: "Invite not found" });

    res.json(invite);
  } catch (err) {
    console.error("Error fetching invite:", err);
    res.status(500).json({ error: "Failed to fetch invite" });
  }
});

app.get("/team/:teamId/assignments", authenticateToken, async (req, res) => {
  const { teamId } = req.params;

  try {
    const assignmentsRes = await pool.query(
      `SELECT id, course_code, course_name, semester, due_date, created_by 
       FROM assignments 
       WHERE team_id=$1
       ORDER BY due_date ASC`,
      [teamId]
    );

    res.json({ assignments: assignmentsRes.rows });
  } catch (err) {
    console.error("Failed to fetch assignments:", err);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Get a SINGLE, detailed assignment with its full rubric and markers (COMPLETELY REWRITTEN)
// This endpoint now fetches data from multiple tables and assembles a complete object.
app.get("/team/:teamId/assignments/:assignmentId", authenticateToken, async (req, res) => {
  const { assignmentId, teamId } = req.params;
  const userId = req.user.id; // from authenticateToken

  try {
    // Step 1: Fetch the main assignment details.
    // We also verify that the user is a member of the team that owns the assignment.
    const assignmentQuery = pool.query(
      `SELECT a.id, a.course_code, a.course_name, a.semester, a.due_date, a.created_by
       FROM assignments a
       JOIN team_members tm ON a.team_id = tm.team_id
       WHERE a.id = $1 AND a.team_id = $2 AND tm.user_id = $3`,
      [assignmentId, teamId, userId]
    );

    // Step 2: Fetch the assigned markers for this assignment.
    const markersQuery = pool.query(
      `SELECT u.id, u.username
       FROM assignment_markers am
       JOIN users u ON am.user_id = u.id
       WHERE am.assignment_id = $1`,
      [assignmentId]
    );

    // Step 3: Fetch all rubric criteria for this assignment.
    const criteriaQuery = pool.query(
      `SELECT id, criterion_description, points, deviation_threshold
       FROM rubric_criteria
       WHERE assignment_id = $1
       ORDER BY id ASC`, // Keep a consistent order
      [assignmentId]
    );

    // Step 4: Fetch all rubric tiers for all criteria in this assignment.
    const tiersQuery = pool.query(
      `SELECT T.id, T.criterion_id, T.tier_name, T.description, T.lower_bound, T.upper_bound
       FROM rubric_tiers T
       JOIN rubric_criteria C ON T.criterion_id = C.id
       WHERE C.assignment_id = $1
       ORDER BY T.criterion_id ASC, T.upper_bound DESC`, // Order is important for assembly
      [assignmentId]
    );
    
    // Run all queries in parallel for better performance
    const [assignmentRes, markersRes, criteriaRes, tiersRes] = await Promise.all([
      assignmentQuery,
      markersQuery,
      criteriaQuery,
      tiersQuery
    ]);

    // Check if assignment exists and if user has access
    if (assignmentRes.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found or you do not have access." });
    }

    // Step 5: Assemble the final JSON object.
    const criteriaMap = new Map();
    // Initialize each criterion with an empty tiers array
    criteriaRes.rows.forEach(criterion => {
      criterion.tiers = [];
      criteriaMap.set(criterion.id, criterion);
    });

    // Populate the tiers for each criterion
    tiersRes.rows.forEach(tier => {
      if (criteriaMap.has(tier.criterion_id)) {
        criteriaMap.get(tier.criterion_id).tiers.push(tier);
      }
    });

    const finalRubric = Array.from(criteriaMap.values());

    const finalResponse = {
      assignment: assignmentRes.rows[0],
      markers: markersRes.rows,
      rubric: finalRubric,
    };
    
    res.json(finalResponse);

  } catch (err) {
    console.error(`Failed to fetch details for assignment ${assignmentId}:`, err);
    res.status(500).json({ error: "Failed to fetch assignment details" });
  }
});

////////////////////////////////////////////////////////////////////
//  Assignments - NEW SECTION
////////////////////////////////////////////////////////////////////

// This is the new endpoint to handle the creation of a full assignment with its rubric.
app.post("/assignments", authenticateToken, async (req, res) => {
  // Use a client from the pool to run a transaction. This ensures that if any part
  // of the process fails, the entire operation is undone (rolled back).
  const client = await pool.connect();

  try {
    // 1. Destructure the payload from the frontend request body.
    const { assignmentDetails, markers, rubric } = req.body;
    
    // 2. The user's ID is available from the 'authenticateToken' middleware.
    const createdById = req.user.id; 

    // --- BEGIN DATABASE TRANSACTION ---
    await client.query('BEGIN');

    // 3. Insert the main assignment details into the 'assignments' table.
    //    We use 'RETURNING id' to immediately get the ID of the new assignment.
    const assignmentSql = `
      INSERT INTO assignments (team_id, created_by, course_code, course_name, semester, due_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    const assignmentValues = [
      assignmentDetails.teamId,
      createdById,
      assignmentDetails.courseCode,
      assignmentDetails.courseName,
      assignmentDetails.semester,
      assignmentDetails.dueDate,
    ];
    const newAssignment = await client.query(assignmentSql, assignmentValues);
    const newAssignmentId = newAssignment.rows[0].id;

    // 4. Loop through the marker IDs and insert them into the 'assignment_markers' join table.
    if (markers && markers.length > 0) {
      const markerSql = 'INSERT INTO assignment_markers (assignment_id, user_id) VALUES ($1, $2);';
      for (const markerId of markers) {
        await client.query(markerSql, [newAssignmentId, markerId]);
      }
    }

    // 5. Loop through the rubric criteria. For each criterion, insert it, then insert its tiers.
    const criteriaSql = `
      INSERT INTO rubric_criteria (assignment_id, criterion_description, points, deviation_threshold)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const tierSql = `
      INSERT INTO rubric_tiers (criterion_id, tier_name, description, lower_bound, upper_bound)
      VALUES ($1, $2, $3, $4, $5);
    `;

    for (const criterion of rubric) {
      // Insert the criterion row and get its new ID.
      const criteriaValues = [
        newAssignmentId,
        criterion.criteria,
        criterion.points,
        criterion.deviation,
      ];
      const newCriterion = await client.query(criteriaSql, criteriaValues);
      const newCriterionId = newCriterion.rows[0].id;

      // Loop through the 5 tiers and insert them, linking them to the criterion ID we just got.
      for (const tier of criterion.tiers) {
        const tierValues = [
          newCriterionId,
          tier.name,
          tier.description,
          tier.lowerBound,
          tier.upperBound,
        ];
        await client.query(tierSql, tierValues);
      }
    }

    // --- COMMIT THE TRANSACTION ---
    // If all the above queries succeeded without errors, permanently save the changes.
    await client.query('COMMIT');

    // Send a success response back to the frontend.
    res.status(201).json({ 
      message: 'Assignment created successfully!',
      assignmentId: newAssignmentId 
    });

  } catch (error) {
    // If any error occurred in the 'try' block, undo all the changes.
    await client.query('ROLLBACK');
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Failed to create assignment due to a server error.' });
  } finally {
    // Crucially, release the database client back to the pool so it can be reused.
    client.release();
  }
});

/////////////////////
// Start Server
/////////////////////
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
