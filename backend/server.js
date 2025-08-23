// Main server system for the login + signup pages + users.db
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./database");

const app = express();
const PORT = 5000;
const SECRET = "supersecret";

app.use(cors());
app.use(bodyParser.json());

// Signup
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  // Hash password for db
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, hashedPassword],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ message: "User already exists" });
        }
        return res.status(500).json({ message: "Error creating user" });
      }
      res.json({ message: "Signup successful" });
    }
  );
});

// Login and rejection system
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    async (err, user) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (!user) return res.status(400).json({ message: "Invalid login" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid login" });

      const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
      res.json({ message: "Login successful", token });
    }
  );
});



// Password validation function
function passwordValidation(password) {
// Password must be at least 6 characters long, contain numbers and letters,
// with at least one capital letter and one lowercase letter
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9]{7,19}$/;
return regex.test(password);
}



// Password reset system
app.put('/forgetpassword', async(req, res) => {
  const { username, newPassword} = req.body;
  if (!username) {
    return res.status(400).json({ message: "Username(E-mail) is required" });
  }

  // Validate new password
  if (passwordValidation(newPassword) === false) {
    return res.status(400).json({ message: "New password must be at least 6 characters long\n \
      only including numbers and letters with at least one capital letter and one lowercase letter" });
  }
  
  
  // Hash new password for db
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  
  db.run(
    `UPDATE users SET password = ? WHERE username = ?`,
    [hashedPassword, username],
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
  });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
