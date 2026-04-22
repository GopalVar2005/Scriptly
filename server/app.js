// app.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo').default;
const rateLimit = require('express-rate-limit');
const User = require('./models/User');

// Routes
const userRoutes = require('./modules/auth/user.routes');
const noteRoutes = require('./modules/notes/note.routes');
const transcribeRoute = require('./modules/transcription/transcribe.routes');
const summarizeRoutes = require('./modules/ai/summarize.routes');
const explainRoutes = require('./modules/ai/explain.routes');
const quizRoutes = require('./modules/ai/quiz.routes');
const youtubeRoutes = require('./modules/youtube/youtube.routes');

// Middleware
const { isLoggedIn } = require('./middleware');

// Utils
const { cleanupOldUploads } = require('./utils/fileCleanup');

dotenv.config();  // Stores values in process.env

// --- Environment Validation ---
const REQUIRED_ENV = ['MONGO_URI', 'SESSION_SECRET', 'GROQ_API_KEY', 'GEMINI_API_KEY'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();

// Trust proxy — required for secure cookies behind Render's reverse proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected successfully"))
  .catch(err => console.error("DB error:", err));

// --- Middleware ---
app.use(express.json());

// CORS — restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Return false instead of throwing — browser sees missing CORS headers and blocks cleanly
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true //Allow cookies to be sent with requests
}));

// NOTE: Frontend is deployed separately on Vercel.
// No express.static for client/dist — it doesn't exist on Render.

// Request timeout middleware — prevent zombie connections
app.use((req, res, next) => {
  req.setTimeout(120000); // 2 minutes
  res.setTimeout(120000);
  next();
});

// SESSION_SECRET already validated in REQUIRED_ENV check above

// Session with MongoDB store for persistence across restarts
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,  // Don't save session if unmodified
  saveUninitialized: false,  // Don't create session until something stored
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60, // Session TTL: 24 hours
    autoRemove: 'native'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',        // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-origin in production
    httpOnly: true,                                        // Not accessible via JavaScript
    maxAge: 24 * 60 * 60 * 1000                           // 24 hours
  }
}));

app.use(passport.initialize()); 
app.use(passport.session());  

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);  
  next();
});

// --- Rate Limiting ---
// General API limit — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Strict limit for AI-powered endpoints — 30 requests per hour per IP (cost protection)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait before trying again.' }
});

app.use('/api/', apiLimiter);

// --- Passport Config ---
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --- Routes ---
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/users', userRoutes);
app.use('/api/notes', isLoggedIn, noteRoutes); // Notes routes protected
app.use('/api/transcribe', isLoggedIn, aiLimiter, transcribeRoute);
app.use("/api/summarize", isLoggedIn, aiLimiter, summarizeRoutes);
app.use("/api/explain", isLoggedIn, aiLimiter, explainRoutes);
app.use("/api/quiz", isLoggedIn, aiLimiter, quizRoutes);
app.use('/api/youtube', isLoggedIn, aiLimiter, youtubeRoutes);

// --- Catch-All ---
// Frontend is on Vercel, so no SPA fallback needed here.
// Just handle unknown API routes and provide a root info endpoint.
app.get('/', (req, res) => {
  res.json({ name: 'Scriptly API', status: 'running', health: '/health' });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found' });
  res.status(404).json({ error: 'Not found' });
});

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  res.status(statusCode).json({
    success: false,
    error: err.message || "An unexpected error occurred."
  });
});

// --- File Cleanup (run on startup + every hour) ---
cleanupOldUploads(1);
setInterval(() => cleanupOldUploads(1), 60 * 60 * 1000);

// --- Server ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
