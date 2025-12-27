require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/Database");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const sendRegistrationEmail = require("./Utils/email");

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://registration-two-amber.vercel.app'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize database connection (only once, not on every request)
let dbInitialized = false;

const initializeDatabase = async () => {
  if (!dbInitialized) {
    try {
      await sequelize.authenticate();
      console.log("MySQL connected");
      await sequelize.sync({ alter: true });
      console.log("Models synced");
      dbInitialized = true;
    } catch (err) {
      console.error("Database initialization failed:", err);
      throw err;
    }
  }
};

app.post("/register", async (req, res) => {
  try {
    // Initialize database on first request
    await initializeDatabase();

    const { name, email, password } = req.body;
    console.log(name, email, password);

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const user = await User.create({
      name,
      email,
      password, 
    });

    sendRegistrationEmail(email, name)
      .then(() => console.log("Email sent successfully to:", email))
      .catch((err) => {
        console.error("Email sending failed:", err.message);
        if (process.env.NODE_ENV === 'development') {
          console.error("Full error:", err);
        }
      });

    res.status(201).json({
      message: "Registration successful. Email sent.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
      if (err.errors && err.errors.some(e => e.type === 'unique violation' || e.path === 'email')) {
        return res.status(400).json({ error: "Email already exists. Please use a different email address." });
      }

      const validationErrors = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
      return res.status(400).json({ error: validationErrors });
    }
    console.error("Registration error:", err);
    res.status(400).json({ error: err.message || "An error occurred during registration" });
  }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// Export for Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
  sequelize.authenticate()
    .then(() => console.log("MySQL connected"))
    .catch(err => console.error("Connection failed:", err));

  sequelize.sync({ alter: true })
    .then(() => console.log("Models synced"));

  app.listen(3000, () => console.log("Server running on port 3000"));
}
