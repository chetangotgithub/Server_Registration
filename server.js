require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
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


app.post("/register", async (req, res) => {
  try {
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
    // Handle unique constraint error (duplicate email)
    if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
      if (err.errors && err.errors.some(e => e.type === 'unique violation' || e.path === 'email')) {
        return res.status(400).json({ error: "Email already exists. Please use a different email address." });
      }
      // Handle other validation errors
      const validationErrors = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
      return res.status(400).json({ error: validationErrors });
    }
    // Handle other errors
    console.error("Registration error:", err);
    res.status(400).json({ error: err.message || "An error occurred during registration" });
  }
});


sequelize.authenticate()
  .then(() => console.log("MySQL connected"))
  .catch(err => console.error("Connection failed:", err));

sequelize.sync({ alter: true })
  .then(() => console.log("Models synced"));

app.listen(3000, () => console.log("Server running on port 3000"));
