// app.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const User = require('./models/User');


// hello brother

// Routes
const userRoutes = require('./routes/user');
const noteRoutes = require('./routes/note');
const transcribeRoute = require('./routes/transcribe');
const summarizeRoutes = require('./routes/summarize');

// Middleware
const { isLoggedIn } = require('./middleware');

dotenv.config();
const app = express();

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected successfully"))
  .catch(err => console.error("DB error:", err));

// --- Middleware ---
app.use(express.json());
// Allow local development origins; when deploying, restrict this to your frontend domain
// Allow cross-origin requests but enable credentials for session cookies.
// In development set `origin: true` to reflect the request origin; in production set a specific origin.
app.use(cors({
  origin: true,
  credentials: true
}));

// Serve frontend static files (index.html, login.html, etc.) from project root
app.use(express.static(path.join(__dirname)));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// --- Passport Config ---
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --- Routes ---
app.use('/api/users', userRoutes);
app.use('/api/notes', isLoggedIn, noteRoutes); // Notes routes protected
app.use('/api/transcribe', transcribeRoute);
app.use("/api/summarize", summarizeRoutes);
// --- Basic Test Route ---
// Serve the main frontend page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// --- Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
