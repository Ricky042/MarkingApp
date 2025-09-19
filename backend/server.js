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

// --- NEW REQUIRES FOR AWS SDK v3 ---
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

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

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER || "markingapp3077@gmail.com",
    pass: process.env.EMAIL_PASS || "mche wvuu wkbh nxbi",
  },
});

// --- NEW: AWS SDK v3 & MULTER CONFIGURATION ---
// The S3Client will automatically read credentials from your .env file
// as long as the variable names are correct (AWS_ACCESS_KEY_ID, etc.)
const s3Client = new S3Client({
  region: process.env.AWS_REGION // The region from your .env file
});

// Configure multer-s3 to use the v3 client
const upload = multer({
  storage: multerS3({
    s3: s3Client, // Pass the v3 client here
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
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

// Fetch all members of a team
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
  // Destructure both emails and the new message field
  const { emails, message } = req.body; 
  const inviterId = req.user.id;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "No emails provided." });
  }

  try {
    const results = [];
    for (const email of emails) {
      // 1. Check if user is already a member (no changes needed here)
      const memberCheck = await pool.query(
        `SELECT u.id FROM users u JOIN team_members tm ON u.id = tm.user_id WHERE tm.team_id = $1 AND u.username = $2`,
        [teamId, email]
      );

      if (memberCheck.rows.length > 0) {
        results.push({ email, status: "already_member" });
        continue;
      }

      // 2. Check for pending invites (no changes needed here)
      const inviteCheck = await pool.query(
        `SELECT id FROM team_invites WHERE team_id=$1 AND invitee_email=$2 AND status='pending'`,
        [teamId, email]
      );

      if (inviteCheck.rows.length > 0) {
        results.push({ email, status: "already_invited" });
        continue;
      }

      // 3. Create invite + send mail (MODIFIED SECTION)
      const inviteToken = require("crypto").randomBytes(32).toString("hex");

      await pool.query(
        `INSERT INTO team_invites (team_id, inviter_id, invitee_email, token, status) VALUES ($1, $2, $3, $4, 'pending')`,
        [teamId, inviterId, email, inviteToken]
      );

      const inviteUrl = `${process.env.FRONTEND_URL}/join-team?token=${inviteToken}`;
      
      // --- Start of email message logic ---
      // Build the email HTML dynamically
      let emailHtml = `<p>You have been invited to join a team.</p>`;

      // If a custom message exists, add it to the email body
      if (message && message.trim() !== "") {
        emailHtml += `
          <div style="padding: 10px; border-left: 3px solid #ccc; margin: 15px 0;">
            <p style="margin: 0;"><i>A message from the inviter:</i></p>
            <p style="margin: 5px 0 0 0;">${message}</p>
          </div>
        `;
      }
      
      emailHtml += `
        <p>Click the button below to accept the invitation:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0F172A; color: #ffffff; text-decoration: none; border-radius: 5px;">
          Join Team
        </a>
      `;
      // --- End of email message logic ---

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "You're invited to join a team!",
        html: emailHtml, // Use the dynamically created HTML
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

// ----------------------------------------------------------------------------------
// FINAL ENDPOINT for Assignment Creation with AWS SDK v3
// This is the full code for the endpoint that handles the multi-step form,
// including the S3 file uploads for control papers.
// ----------------------------------------------------------------------------------


app.post("/assignments", authenticateToken, upload.fields([
  { name: 'controlPaperA', maxCount: 1 },
  { name: 'controlPaperB', maxCount: 1 }
]), async (req, res) => {
  const client = await pool.connect();
  try {
    // STEP 1: PARSE INCOMING DATA
    // The JSON data comes as a string in the 'assignmentData' field from the FormData object.
    const { assignmentDetails, markers, rubric } = JSON.parse(req.body.assignmentData);
    const createdById = req.user.id; 
    
    
    const fileA = req.files.controlPaperA[0];
    const fileB = req.files.controlPaperB[0];
    const fs = require('fs');
    const path = require('path');
    const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
    const docxConverter = require('docx-pdf');
    const { v4: uuidv4 } = require('uuid');

    // --- Helper: sanitize filenames for Windows ---
    const sanitizeFileName = (name) => {
      return name.replace(/[^a-zA-Z0-9.-]/g, '_');
    };

    // --- Helper: download S3 file locally ---
    const downloadS3File = async (bucket, key, originalName) => {
    const safeName = sanitizeFileName(originalName);
    const tempPath = path.join(__dirname, 'temp', safeName);

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const s3Object = await s3Client.send(command);

    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(tempPath);
      s3Object.Body.pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    return tempPath;
  };

// --- Helper: convert doc/docx to PDF ---
  const convertToPdf = async (inputPath) => {
    const outputPath = inputPath.replace(/\.(doc|docx)$/i, '.pdf');

    await new Promise((resolve, reject) => {

      const originalConsoleWarn = console.warn;
      console.warn = () => {};


      docxConverter(inputPath, outputPath, (err, result) => {

        console.warn = originalConsoleWarn;

      
        if (err) reject(err);
        else resolve(result);
      });
    });

    return outputPath;
  };


  // --- Helper: upload PDF to S3 ---
  const uploadPdfToS3 = async (pdfPath, originalName) => {
    if (!pdfPath || !fs.existsSync(pdfPath)) return null; // skip if conversion failed

    const pdfKey = `pdfs/${uuidv4()}-${sanitizeFileName(path.basename(originalName, path.extname(originalName)))}.pdf`;
    const fileContent = fs.readFileSync(pdfPath);

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: pdfKey,
      Body: fileContent,
      ContentType: 'application/pdf',
    }));

    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${pdfKey}`;
  };

  // --- Cleanup temp files safely ---
  const cleanupFiles = (files) => {
    files.forEach(file => {
      if (file && fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (err) {
          console.warn('Failed to delete temp file:', file, err.message);
        }
      }
    });
  };


    // --- PROCESS FILES ---
    const localA = await downloadS3File(fileA.bucket, fileA.key, fileA.originalname);
    const localB = await downloadS3File(fileB.bucket, fileB.key, fileB.originalname);

    const pdfAPath = await convertToPdf(localA);
    const pdfBPath = await convertToPdf(localB);

    const controlPaperAPath = await uploadPdfToS3(pdfAPath, fileA.originalname);
    const controlPaperBPath = await uploadPdfToS3(pdfBPath, fileB.originalname);

    // Clean up temp files
    cleanupFiles([localA, localB, pdfAPath, pdfBPath]);

    // --- DATABASE TRANSACTION STARTS ---
    await client.query('BEGIN');

    // STEP 2: Insert the main assignment details into the 'assignments' table.
    const assignmentSql = `
      INSERT INTO assignments (team_id, created_by, course_code, course_name, semester, due_date)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
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

    // STEP 3: Create the control paper submissions with the S3 file paths.
    const submissionsSql = `
      INSERT INTO submissions (assignment_id, student_identifier, is_control_paper, file_path)
      VALUES ($1, 'cp-A', TRUE, $2), 
             ($1, 'cp-B', TRUE, $3);
    `;
    await client.query(submissionsSql, [newAssignmentId, controlPaperAPath, controlPaperBPath]);

    // STEP 4: Insert the assigned markers into the 'assignment_markers' join table.
    if (markers && markers.length > 0) {
      const markerSql = 'INSERT INTO assignment_markers (assignment_id, user_id) VALUES ($1, $2);';
      for (const markerId of markers) {
        await client.query(markerSql, [newAssignmentId, markerId]);
      }
    }

    // STEP 5: Insert the rubric criteria and their corresponding tiers.
    const criteriaSql = `
      INSERT INTO rubric_criteria (assignment_id, criterion_description, points, deviation_threshold)
      VALUES ($1, $2, $3, $4) RETURNING id;
    `;
    const tierSql = `
      INSERT INTO rubric_tiers (criterion_id, tier_name, description, lower_bound, upper_bound)
      VALUES ($1, $2, $3, $4, $5);
    `;

    for (const criterion of rubric) {
      // Insert the criterion row and get its new ID back.
      const criteriaValues = [
        newAssignmentId,
        criterion.criteria,
        criterion.points,
        criterion.deviation,
      ];
      const newCriterion = await client.query(criteriaSql, criteriaValues);
      const newCriterionId = newCriterion.rows[0].id;

      // Now, loop through the tiers and insert them, linking them to the criterion ID.
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

    // --- DATABASE TRANSACTION ENDS (SUCCESS) ---
    await client.query('COMMIT');

    // Send a success response to the frontend.
    res.status(201).json({ 
      message: 'Assignment created successfully!',
      assignmentId: newAssignmentId 
    });

  } catch (error) {
    // --- DATABASE TRANSACTION ENDS (FAILURE) ---
    // If any step in the 'try' block failed, undo all changes.
    await client.query('ROLLBACK');
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Failed to create assignment due to a server error.' });
  } finally {
    // Crucially, release the database client back to the pool so it can be reused.
    client.release();
  }
});


////////////////////////////////////////////////////////////////////
// User Management
////////////////////////////////////////////////////////////////////

// New endpoint to fetch a single user by ID
app.get("/users/:id", authenticateToken, async (req, res) => {
  const userId = req.params.id;
  const requestingUserId = req.user.id; // The ID of the user making the request

  // Optional: Add a check if the requesting user is allowed to view this user's profile.
  // For simplicity, we'll allow any authenticated user to fetch details of any user,
  // but in a real app, you might only allow fetching your own profile or profiles
  // of users within your team, or by an admin.
  // If you want to restrict it to only fetching their own profile:
  // if (String(userId) !== String(requestingUserId)) {
  //   return res.status(403).json({ message: "Access denied: Cannot view other users' profiles." });
  // }


  try {
    const result = await pool.query("SELECT id, username FROM users WHERE id=$1", [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user); // Return id and username
  } catch (err) {
    console.error(`Error fetching user with ID ${userId}:`, err);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

////////////////////////////////////////////////////
// Assignment Stuff
////////////////////////////////////////////////////

// ----------------------------------------------------------------------------------
// FINAL, COMPLETE 'DETAILS' ENDPOINT WITH ROLE DETECTION
// This is the full code for the endpoint that serves the Assignment Details page.
// It includes all queries for assignment data, markers, rubric, marks, file paths,
// and the current user's specific role within the team.
// ----------------------------------------------------------------------------------
app.get("/team/:teamId/assignments/:assignmentId/details", authenticateToken, async (req, res) => {
  const { assignmentId, teamId } = req.params;
  const currentUserId = req.user.id; // Get the user's global ID from the token

  try {
    // --- STEP 1: DEFINE ALL DATABASE QUERIES ---

    // Query 1: Get main assignment details, including the creator's ID, and verify the current user is a member of the team.
    const assignmentQuery = pool.query(
      `SELECT a.id, a.course_code, a.course_name, a.semester, a.due_date, a.created_by 
       FROM assignments a
       JOIN team_members tm ON a.team_id = tm.team_id
       WHERE a.id = $1 AND a.team_id = $2 AND tm.user_id = $3`,
      [assignmentId, teamId, currentUserId]
    );

    // Query 2: Get all markers who are specifically assigned to this assignment.
    const markersQuery = pool.query(
      `SELECT u.id, u.username
       FROM assignment_markers am
       JOIN users u ON am.user_id = u.id
       WHERE am.assignment_id = $1`,
      [assignmentId]
    );

    // Query 3: Get all rubric criteria for the assignment.
    const criteriaQuery = pool.query(
      `SELECT id, criterion_description, points, deviation_threshold
       FROM rubric_criteria
       WHERE assignment_id = $1
       ORDER BY id ASC`,
      [assignmentId]
    );
    
    // Query 4: Get all submitted marks for the control papers associated with this assignment.
    const marksQuery = pool.query(
      `SELECT
         m.tutor_id as "marker_id",
         s.student_identifier as "paper_id",
         m.criterion_id,
         m.marks_awarded as "score"
       FROM marks m
       JOIN submissions s ON m.submission_id = s.id
       WHERE s.assignment_id = $1 AND s.is_control_paper = TRUE`,
      [assignmentId]
    );

    // Query 5: Get the control paper submissions themselves to retrieve their file paths from S3.
    const submissionsQuery = pool.query(
      `SELECT student_identifier, file_path 
       FROM submissions 
       WHERE assignment_id = $1 AND is_control_paper = TRUE`,
      [assignmentId]
    );


    // Query 7: Count how many unique markers have submitted marks for any control paper
    const markersAlreadyMarkedQuery = pool.query(
      `SELECT COUNT(DISTINCT m.tutor_id) AS graded_marker_count
      FROM marks m
      JOIN submissions s ON s.id = m.submission_id
      WHERE s.assignment_id = $1`,
      [assignmentId]
    );

    // Query 6: Get the current user's role ('admin' or 'tutor') for THIS specific team.
    const userRoleQuery = pool.query(
      `SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2`,
      [currentUserId, teamId]
    );

    // --- STEP 2: EXECUTE ALL QUERIES IN PARALLEL FOR PERFORMANCE ---
    const [
      assignmentRes,
      markersRes,
      criteriaRes,
      marksRes,
      submissionsRes,
      userRoleRes,
      markersAlreadyMarkedRes
    ] = await Promise.all([
      assignmentQuery,
      markersQuery,
      criteriaQuery,
      marksQuery,
      submissionsQuery,
      userRoleQuery,
      markersAlreadyMarkedQuery
    ]);

    // If the assignment query returns no rows, the user either doesn't have access or the assignment doesn't exist.
    if (assignmentRes.rows.length === 0) {
      return res.status(404).json({ message: "Assignment not found or you do not have access." });
    }
    
    // Extract the role from the new query result. Default to 'tutor' as a safe fallback.
    const currentUserRole = userRoleRes.rows[0]?.role || 'tutor';

    // --- STEP 3: ASSEMBLE THE FINAL JSON PAYLOAD ---

    // A) Assemble the control paper data, including their file paths and any submitted marks.
    const controlPapersMap = new Map();
    const filePaths = {};
    submissionsRes.rows.forEach(row => {
        filePaths[row.student_identifier] = row.file_path;
    });

    // Initialize the paper objects with their file paths.
    controlPapersMap.set('cp-A', { id: 'cp-A', name: 'Control Paper A', marks: [], filePath: filePaths['cp-A'] || null });
    controlPapersMap.set('cp-B', { id: 'cp-B', name: 'Control Paper B', marks: [], filePath: filePaths['cp-B'] || null });

    // Group the raw marks data by marker and paper for easy consumption by the frontend.
    const marksByMarkerAndPaper = new Map();
    marksRes.rows.forEach(mark => {
      const key = `${mark.marker_id}|${mark.paper_id}`;
      if (!marksByMarkerAndPaper.has(key)) {
        marksByMarkerAndPaper.set(key, { markerId: mark.marker_id, scores: [] });
      }
      marksByMarkerAndPaper.get(key).scores.push({
        rubricCategoryId: mark.criterion_id,
        score: parseFloat(mark.score)
      });
    });

    // Add the grouped marks to the correct control paper object.
    marksByMarkerAndPaper.forEach((value, key) => {
      const [markerId, paperId] = key.split('|');
      if (controlPapersMap.has(paperId)) {
        controlPapersMap.get(paperId).marks.push(value);
      }
    });

    // B) Construct the final response object in the exact shape the frontend expects.
    const finalResponse = {
      assignmentDetails: assignmentRes.rows[0], // This object now includes the `created_by` field.
      currentUser: {
        id: currentUserId,
        role: currentUserRole // This now includes the user's team-specific role.
      },
      markers: markersRes.rows.map(marker => ({
        id: marker.id,
        name: marker.username
      })),
      rubric: criteriaRes.rows.map(criterion => ({
        id: criterion.id,
        categoryName: criterion.criterion_description,
        maxScore: parseFloat(criterion.points),
        deviationScore: parseFloat(criterion.deviation_threshold),
        tiers: [] // Tiers are not needed for the details page, keeping payload smaller.
      })),
      controlPapers: Array.from(controlPapersMap.values()),
      markersAlreadyMarked: parseInt(markersAlreadyMarkedRes.rows[0].graded_marker_count, 10)
    };

    // --- STEP 4: SEND THE RESPONSE ---
    res.json(finalResponse);

  } catch (err) {
    console.error(`Failed to fetch detailed data for assignment ${assignmentId}:`, err);
    res.status(500).json({ message: "Server error while fetching assignment details." });
  }
});

// Receives and saves the marks for a single control paper from a single marker.
// Uses a transaction to safely replace old marks with the new submission.
app.post("/assignments/:assignmentId/mark", authenticateToken, async (req, res) => {
  // Use a database client from the pool to run a transaction
  const client = await pool.connect();

  try {
    // --- STEP 1: EXTRACT DATA & VALIDATE ---
    const { assignmentId } = req.params;
    const { paperId, scores } = req.body; // 'paperId' is 'cp-A', 'cp-B', etc.
    const tutorId = req.user.id; // The ID of the marker submitting the scores

    // Basic validation to ensure the payload is correct
    if (!paperId || !scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ message: "Invalid payload. 'paperId' and a non-empty 'scores' array are required." });
    }

    // --- STEP 2: BEGIN DATABASE TRANSACTION ---
    await client.query('BEGIN');

    // --- STEP 3: FIND THE SUBMISSION ID ---
    // We need to translate the 'paperId' (e.g., 'cp-A') into the actual ID 
    // from the 'submissions' table to use as a foreign key.
    const submissionRes = await client.query(
      `SELECT id FROM submissions WHERE assignment_id = $1 AND student_identifier = $2 AND is_control_paper = TRUE`,
      [assignmentId, paperId]
    );

    if (submissionRes.rows.length === 0) {
      // This is a server-side issue if the control paper doesn't exist.
      // We throw an error to trigger the ROLLBACK.
      throw new Error(`Control paper '${paperId}' not found for assignment ${assignmentId}.`);
    }
    const submissionId = submissionRes.rows[0].id;

    // --- STEP 4: DELETE OLD MARKS (for idempotency) ---
    // To handle re-submissions, we first delete any existing marks this tutor
    // may have already submitted for this specific control paper.
    await client.query(
      `DELETE FROM marks WHERE submission_id = $1 AND tutor_id = $2`,
      [submissionId, tutorId]
    );

    // --- STEP 5: INSERT NEW MARKS ---
    // Loop through the scores from the payload and insert each one as a new row.
    const insertSql = `
      INSERT INTO marks (submission_id, criterion_id, tutor_id, marks_awarded)
      VALUES ($1, $2, $3, $4)
    `;

    for (const score of scores) {
      // Add validation for each score object if desired
      const values = [submissionId, score.criterionId, tutorId, score.score];
      await client.query(insertSql, values);
    }

    // --- STEP 6: COMMIT THE TRANSACTION ---
    // If all the above queries succeeded, permanently save the changes.
    await client.query('COMMIT');

    // Send a success response.
    res.status(201).json({ message: `Marks for ${paperId} submitted successfully!` });

  } catch (error) {
    // If any error occurred in the 'try' block, undo all database changes.
    await client.query('ROLLBACK');
    console.error("Error submitting marks:", error);
    res.status(500).json({ message: "Failed to submit marks due to a server error." });
  } finally {
    // ALWAYS release the client back to the pool.
    client.release();
  }
});


/////////////////////
// Start Server
/////////////////////
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
