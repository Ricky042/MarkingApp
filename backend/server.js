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
      if (allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
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
  return jwt.sign({ username: user.username, id: user.id }, SECRET, { expiresIn: "1h" });
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
    res.json({ message: "Login successful", token });
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

/////////////////////
// Start Server
/////////////////////
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
