1// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./database");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 5000;
const SECRET = "supersecret"; // in production use .env file to store

// Temporary store for verification codes
const verificationCodes = {};

app.use(cors());
app.use(bodyParser.json());

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "markingapp3077@gmail.com",
    pass: "mche wvuu wkbh nxbi",
  },
});

//////////////////////////
//     JWT Helpers
//////////////////////////

function generateToken(user) {
  return jwt.sign(
    { username: user.username, id: user.id }, // include id if available
    SECRET,
    { expiresIn: "1h" }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid/expired token" });
    req.user = user; // add user to request
    next();
  });
}

//////////////////////////
//      Signup Flow
//////////////////////////

// Send verification code
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

// Verify code + create user
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

///////////////////////////////
//      Login / Logout
///////////////////////////////

// Login
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

// Example of protected route
app.get("/profile", authenticateToken, (req, res) => {
  res.json({ message: "Welcome!", user: req.user });
});

// Logout (client side just deletes token, but we can blacklist if needed)
app.post("/logout", (req, res) => {
  // In stateless JWT, logout is handled client-side
  res.json({ message: "Logged out (client should discard token)" });
});

//////////////////////////////////////
//      Forgot Password Flow
//////////////////////////////////////

// Check if user exists
app.post("/check-user", (req, res) => {
  const { email } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!user) return res.json({ exists: false, message: "User not found" });
    res.json({ exists: true, message: "User exists" });
  });
});

// Verify code for forgot password
app.post("/verify-code-forgetpassword", (req, res) => {
  const { email, code } = req.body;
  const record = verificationCodes[email];

  if (!record) return res.status(400).json({ message: "No code sent to this email" });
  if (record.expires < Date.now()) return res.status(400).json({ message: "Code expired" });
  if (record.code !== code) return res.status(400).json({ message: "Invalid code" });

  res.json({ message: "Code verified, please reset your password." });
});

// Reset password
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

//////////////////////////////////////
//      Resend Verification
//////////////////////////////////////

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

////////////////////////////
//      Start server
////////////////////////////

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
