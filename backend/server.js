//////////////////////////////////////////////////////////////////////
//  server.js
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
const db = require("./database");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 5000;
const SECRET = "supersecret"; // In production, store in .env

// Temporary in-memory store for email verification codes
const verificationCodes = {};

//  Middleware Setup
app.use(cors());
app.use(bodyParser.json());

//  Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "markingapp3077@gmail.com",
    pass: "mche wvuu wkbh nxbi", // ⚠️ Store in .env in production
  },
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//  JWT Helpers
//  -----------------
//  generateToken(user): creates a signed JWT for user, payload as 'username' and 'id' w 1hr expiry
//  authenticateToken(req,res,next): validates JWT from auth header, 'req.user' if valid, error if not
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function generateToken(user) {
  return jwt.sign(
    { username: user.username, id: user.id },
    SECRET,
    { expiresIn: "1h" }
  );
}

// Not currently used, but might be needed if we're trying to hide specific pages for lecturers or tutors only
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
//  ---------------------
//  POST /send-code: generate 6 digit code, give 10m expiry, send via Nodemailer
//  POST /verify-code: verify email + code, hash password + new user in db (errors for invalid code, expired or user already in db)
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/send-code", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = {
    code,
    expires: Date.now() + 10 * 60 * 1000, // 10 min expiry
  };

  const mailOptions = {
    from: "markingapp3077@gmail.com",
    to: email,
    subject: "Your verification code",
    text: `Your verification code is: ${code}. This code will expire in 10 minutes`,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error("Error sending email:", err);
      return res.status(500).json({ message: "Error sending email" });
    }
    res.json({ message: "Verification code sent" });
  });
});

app.post("/verify-code", async (req, res) => {
  const { email, password, code } = req.body;
  const record = verificationCodes[email];

  if (!record) return res.status(400).json({ message: "No code sent to this email" });
  if (record.expires < Date.now()) return res.status(400).json({ message: "Code expired" });
  if (record.code !== code) return res.status(400).json({ message: "Invalid code" });

  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [email, hashedPassword],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ message: "User already exists" });
        }
        return res.status(500).json({ message: "Error creating user" });
      }

      delete verificationCodes[email];
      res.json({ message: "Signup successful" });
    }
  );
});

////////////////////////////////////////////////////////////////////
//  Login / Logout Flow
//  --------------------------
//  POST /login: validate user, return JWT if successful
////////////////////////////////////////////////////////////////////

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!user) return res.status(400).json({ message: "Invalid login" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid login" });

    const token = generateToken(user);
    res.json({ message: "Login successful", token });
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
//  Forgot Password Flow
//  -------------------------------
//  POST /check-user: check if user email exists in db, return bool
//  POST /verify-code-forgetpassword: verify code for password reset, return success if valid
//  POST /forgetpassword: resets user's password, hashes new pass + db update
////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/check-user", (req, res) => {
  const { email } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!user) return res.json({ exists: false, message: "User not found" });
    res.json({ exists: true, message: "User exists" });
  });
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

  db.run(
    `UPDATE users SET password = ? WHERE username = ?`,
    [hashedPassword, email],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error" });
      if (this.changes === 0) return res.status(400).json({ message: "User not found" });
      res.json({ message: "Password updated successfully" });
    }
  );
});

//////////////////////////////////////////////////////////////////////////
//  Resending validation codes
//  -----------------------------
//  POST /resend-code: resends verification code, prevents spam
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
      from: "markingapp3077@gmail.com",
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

/////////////////////
//  Start Server
/////////////////////
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
