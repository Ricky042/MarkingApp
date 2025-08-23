// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./database");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 5000;
const SECRET = "supersecret";

// Temporary store for verification codes
const verificationCodes = {};

app.use(cors());
app.use(bodyParser.json());

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "markingapp3077@gmail.com",
    pass: "mche wvuu wkbh nxbi",
  },
});

// Send verification code
app.post("/send-code", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  // Generate 6-digit code (maybe hash or something in future?)
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Save code with expiration (10 minutes)
  verificationCodes[email] = {
    code,
    expires: Date.now() + 10 * 60 * 1000,
  };

  // Send email
  const mailOptions = {
    from: "markingapp3077@gmail.com",
    to: email,
    subject: "Your verification code",
    text: `Your verification code is: ${code}. This code will expire in 5 minutes`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error sending email:", err)
      return res.status(500).json({
        message: "Error sending email",
        error: err.message,
        code: err.response?.status || null,
      });
    }
    res.json({ message: "Verification code sent" });
  });
});

// Verify code and create user
app.post("/verify-code", async (req, res) => {
  const { email, password, code } = req.body;
  const record = verificationCodes[email];

  if (!record) return res.status(400).json({ message: "No code sent to this email" });
  if (record.expires < Date.now()) return res.status(400).json({ message: "Code expired" });
  if (record.code !== code) return res.status(400).json({ message: "Invalid code" });

  // Hash password and insert user
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

      // Remove the code from memory
      delete verificationCodes[email];
      res.json({ message: "Signup successful" });
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!user) return res.status(400).json({ message: "Invalid login" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid login" });

      const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
      res.json({ message: "Login successful", token });
    }
  );
});



app.post("/verify-code-forgetpassword", async (req, res) => {
  const { email, code } = req.body;
  const record = verificationCodes[email];

  if (!record) return res.status(400).json({ message: "No code sent to this email" });
  if (record.expires < Date.now()) return res.status(400).json({ message: "Code expired" });
  if (record.code !== code) return res.status(400).json({ message: "Invalid code" });
  return res.json({ message: "Code verified, please reset your password." });
});




// Password reset system
app.post('/forgetpassword', async(req, res) => {
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





// Debug: user list TO BE REMOVED
app.get("/users", (req, res) => {
  db.all(`SELECT id, username FROM users`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
    const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  });
});

// Resend verification code
app.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  // Check if a code already exists
  const existing = verificationCodes[email];
  if (existing && existing.expires > Date.now()) {
    return res.status(400).json({ message: "Code already sent. Please wait until it expires." });
  }

  // Generate new code
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  verificationCodes[email] = {
    code,
    expires: Date.now() + 5 * 60 * 1000, // 5 min
  };

  // Send email
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));