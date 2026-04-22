# COMPREHENSIVE SCRIPTLY CODEBASE ANALYSIS REPORT

## Executive Summary

**Scriptly** is a full-stack, AI-powered study platform that transforms spoken content (audio recordings or YouTube videos) into structured educational materials including transcriptions, AI-generated summaries, flashcards, and quizzes. The project is feature-complete with a modern React frontend and Node.js backend powered by multiple AI services.

**Current Status**: Feature-complete, requires security hardening before production deployment
**Deployment Timeline**: 10-12 hours of focused work
**Technology Stack**: React 19 / Vite | Express.js 5 | MongoDB 8 | Groq Whisper | Google Gemini 2.5

---

## 1. PROJECT OVERVIEW & PURPOSE

### Core Problem Solved
Students and professionals need a fast way to convert lecture content (YouTube videos or live audio) into structured, searchable study material without manual transcription or summarization.

### Primary Features
1. **Audio/Video Transcription** - Convert live recordings or uploaded files to text using Groq Whisper
2. **AI Summarization** - Generate structured study summaries with multiple modes (first_pass, deep_study, exam_prep, quick_refresh)
3. **YouTube Integration** - Extract content directly from YouTube with caption fallback and audio transcription
4. **Study Materials** - Automatic generation of flashcards, key concepts, exam questions, and glossaries
5. **Quiz Generation** - AI-generated MCQ quizzes with pedagogically-sound distractors
6. **Note Management** - Full CRUD operations for saving and organizing generated notes
7. **User Authentication** - Email-based authentication with session management

### Target Users
- Students preparing for exams
- Online learners taking video courses
- Professionals attending webinars
- Language learners reviewing transcripts

---

## 2. ARCHITECTURE & TECHNOLOGY STACK

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19/Vite)                    │
│  Pages: Home, Login, Register, Workspace, Notes, NoteDetail     │
│  Components: AuthForm, Quiz, Flashcard, ConceptPanel, etc.      │
│  Services: API wrapper for backend communication                │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST API
┌───────────────────────────▼─────────────────────────────────────┐
│                 BACKEND (Express.js 5)                          │
├─────────────────────────────────────────────────────────────────┤
│  Routes & Controllers:                                          │
│  • Auth (Login, Register, Logout)                               │
│  • Notes CRUD (Create, Read, Update, Delete)                    │
│  • Transcription (Upload & process audio/video)                 │
│  • AI Summarization (Text → Structured summaries)               │
│  • YouTube Processing (Extract transcripts)                     │
│  • Explain & Quiz (On-demand AI generation)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼────┐         ┌────▼────┐        ┌────▼────┐
    │MongoDB │         │  Groq   │        │ Google  │
    │(Data)  │         │ Whisper │        │ Gemini  │
    │        │         │& LLaMA  │        │2.5 Flash│
    └────────┘         └─────────┘        └─────────┘
```

### Frontend Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 19 | UI component library |
| Build Tool | Vite 8 | Fast development and production builds |
| Routing | React Router 7 | Client-side navigation |
| HTTP | Fetch API | Backend communication |
| Recording | MediaRecorder API | Live audio capture |
| Styling | CSS3 | Component and page styling |
| Linting | ESLint 9 | Code quality |

### Backend Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js | JavaScript server runtime |
| Framework | Express 5 | HTTP server and routing |
| Database | MongoDB 8 + Mongoose | User and note persistence |
| Authentication | Passport.js + Local Strategy | Session-based auth with email login |
| File Upload | Multer 2 | Handle audio/video file uploads |
| Audio Processing | FFmpeg + fluent-ffmpeg | Extract audio from video, compress |
| Validation | Joi 18 | Request schema validation |
| Logging | Custom Logger | Colorized console logging |

### AI/ML Integration Stack

| Service | Provider | Purpose | Configuration |
|---------|----------|---------|---------------|
| Speech-to-Text | Groq Whisper (Large v3) | Transcribe audio to text | Multilingual, JSON format |
| Primary LLM | Google Gemini 2.5 Flash | Generate structured summaries | Temperature 0.2 (deterministic) |
| Fallback LLM | Groq LLaMA 3.3 70B | Fallback if Gemini fails | Temperature 0.3 for flexibility |
| YouTube Data | YouTube Data API v3 | Fetch video metadata | Fallback to yt-dlp if unavailable |
| Captions | youtube-transcript-plus | Extract YouTube captions | Fallback to audio transcription |

### Key Design Patterns

- **Resilient AI Pipeline**: Dual-model fallback system (Gemini → LLaMA) ensures reliability
- **Service Architecture**: Separate service files for transcription, summarization, YouTube processing
- **Controller-Route Separation**: Clean MVC pattern with routes and controllers
- **Middleware Stack**: Authentication, CORS, logging, error handling

---

## 3. KEY FEATURES & FUNCTIONALITY

### 3.1 Audio Recording & Upload
- **Recording**: Browser-based audio capture using MediaRecorder API
- **Formats**: Supports WebM, MP3, OGG, WAV, M4A
- **Limits**: 100MB file size limit
- **Encoding Detection**: Automatically detects supported MIME types per browser
- **Audio Enhancement**: Echo cancellation, noise suppression, auto-gain control

```javascript
// useAudioRecorder Hook: Captures audio with browser microphone
const stream = await navigator.mediaDevices.getUserMedia({
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
});
const mediaRecorder = new MediaRecorder(stream, { mimeType });
```

### 3.2 Transcription Pipeline

**Flow**: Upload Audio → FFmpeg Compress (if >24MB) → Groq Whisper → Return Text

```javascript
// transcription.service.js
async function transcribeAudio(filePath, mimetype) {
  // Large files (>24MB) compressed to 32kbps MP3
  if (fileSizeMB > 24) {
    compressedPath = await extractAudioFromVideo(filePath, outputPath);
    fileToUpload = compressedPath;
  }

  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(fileToUpload),
    model: "whisper-large-v3",
    response_format: "json",
    language: "en",
    temperature: 0.0
  });

  return transcription.text;
}
```

### 3.3 Structured Summarization

**Modes** (configurable per note):
- **first_pass**: Quick overview, balanced coverage
- **deep_study**: Thorough breakdown with 5-6 concepts, detailed explanations
- **exam_prep**: Test-focused with common misconceptions and 5+ exam questions
- **quick_refresh**: Brief essentials only, 3 concepts max

**Output Structure** (JSON):
```json
{
  "subject_detected": "Molecular Biology",
  "quick_recap": "2-sentence summary of entire content",
  "key_concepts": [
    {
      "concept": "DNA Replication",
      "explanation": "Clear explanation",
      "why_it_matters": "Connection to broader topic"
    }
  ],
  "important_to_remember": ["facts", "dates", "definitions"],
  "potential_exam_questions": [
    { "question": "...", "hint": "..." }
  ],
  "key_terms": { "term": "definition", ... },
  "memory_anchors": ["mnemonics and analogies"],
  "keywords": ["tags", "topics"]
}
```

**Fallback Mechanism**:
```javascript
async function executeLLMWithFallback(prompt, primaryModel, fallbackModel, temperature) {
  try {
    // Primary: Google Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    return extractJSON(result.response.text());
  } catch (primaryError) {
    // Fallback: Groq LLaMA
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature
    });
    return extractJSON(chatCompletion.choices[0].message.content);
  }
}
```

### 3.4 YouTube Integration

**Processing Flow**:
1. Extract video metadata (YouTube API or yt-dlp)
2. Attempt caption extraction from YouTube
3. If captions unavailable, download audio and transcribe
4. Return transcript with source information

```javascript
// youtube.controller.js
const processVideo = async (req, res) => {
  const url = req.body.url;

  // Validate and get metadata
  const metadata = await getVideoMetadata(url);
  if (metadata.duration > 2700) { // 45 min limit
    return res.status(400).json({ error: "Video too long" });
  }

  // Try captions first
  const captionTranscript = await getYouTubeTranscript(url, videoId);
  if (captionTranscript && captionTranscript.length > 20) {
    return res.json({
      transcript: captionTranscript,
      source: "captions",
      videoTitle: metadata.title
    });
  }

  // Fallback: Download and transcribe audio
  const { filePath, mimetype } = await downloadYouTubeAudio(url, videoId);
  const audioTranscript = await transcribeAudio(filePath, mimetype);
  return res.json({
    transcript: audioTranscript,
    source: "audio",
    videoTitle: metadata.title
  });
};
```

**Supported URLs**:
- `youtube.com/watch?v=...`
- `youtu.be/...`
- `youtube.com/embed/...`
- `youtube.com/shorts/...`

### 3.5 Quiz Generation

**Features**:
- Generates 5-8 MCQ questions per note
- Pedagogically sound distractors (misconceptions, adjacent concepts, partial truths)
- Cached after first generation
- Scoring and result tracking

```javascript
// AI generates questions with three distractor categories:
// 1. MISCONCEPTION - common wrong belief
// 2. ADJACENT CONCEPT - related but inapplicable
// 3. PARTIAL TRUTH - true in different context
{
  "question": "What is DNA replication?",
  "correct_answer": "The process by which DNA makes an exact copy of itself",
  "distractors": [
    "The process of converting DNA to RNA (translation misconception)",
    "The process of reading genetic code (adjacent: transcription)",
    "The process of repairing damaged DNA (partial truth in different context)"
  ],
  "explanation": "DNA replication creates identical copies; transcription converts to RNA."
}
```

### 3.6 Flashcard System

**Decks**:
- **Terms Deck**: Key terms from `key_terms` object
- **Concepts Deck**: Key concepts from `key_concepts` array

**Features**:
- Flip animation for front/back
- "I Know This" tracking
- Review mode for unknowns only
- Progress indicator

### 3.7 Concept Explanation

**On-Demand Explanation**:
```javascript
// Explain any term in context
async function explainConcept(term, context, level) {
  // Returns: one_liner, full_explanation, real_world_example,
  //          common_misconception, connects_to (related concepts)
}
```

---

## 4. FILE STRUCTURE & ORGANIZATION

### Backend Structure

```
server/
├── app.js                          # Express app setup, middleware, routes
├── middleware.js                   # Authentication middleware (isLoggedIn)
├── validation.js                   # Joi schemas for input validation
├── config/
│   └── constants.js                # ML models, min word count, timeouts
├── models/
│   ├── User.js                     # User schema + Passport config
│   └── Note.js                     # Note schema with all study fields
├── modules/
│   ├── auth/
│   │   ├── user.routes.js          # POST /register, /login, /logout
│   │   └── user.controller.js      # User registration, auth logic
│   ├── notes/
│   │   ├── note.routes.js          # CRUD routes for notes
│   │   └── note.controller.js      # Note CRUD logic
│   ├── transcription/
│   │   ├── transcribe.routes.js    # POST /transcribe
│   │   ├── transcribe.controller.js # File upload handler
│   │   ├── transcription.service.js # Groq Whisper integration
│   │   └── video.service.js        # FFmpeg audio extraction
│   ├── ai/
│   │   ├── summarize.routes.js     # POST /summarize
│   │   ├── quiz.routes.js          # POST /quiz/generate/:noteId
│   │   ├── explain.routes.js       # POST /explain
│   │   ├── ai.controller.js        # Controller for summarize/explain/quiz
│   │   └── summarization.service.js # Gemini + Groq LLM logic
│   └── youtube/
│       ├── youtube.routes.js       # POST /metadata, /process
│       ├── youtube.controller.js   # YouTube processing logic
│       └── youtube.service.js      # Video download, captions, metadata
├── utils/
│   ├── AppError.js                 # Custom error class
│   ├── catchAsync.js               # Async error wrapper
│   └── logger.js                   # Colorized logging
└── uploads/                        # Temporary file storage
```

### Frontend Structure

```
client/
├── src/
│   ├── App.jsx                     # Main router config
│   ├── main.jsx                    # React entry point
│   ├── pages/
│   │   ├── HomePage.jsx            # Landing page
│   │   ├── LoginPage.jsx           # Email login
│   │   ├── RegisterPage.jsx        # Email registration
│   │   ├── WorkspacePage.jsx       # Main workflow (record→transcribe→summarize)
│   │   ├── NotesPage.jsx           # List all notes with search
│   │   └── NoteDetailPage.jsx      # View single note with quiz/flashcards
│   ├── components/
│   │   ├── AuthForm.jsx            # Reusable login/register form
│   │   ├── Navbar.jsx              # Header with navigation
│   │   ├── Footer.jsx              # Page footer
│   │   ├── ProtectedRoute.jsx      # Auth guard for pages
│   │   ├── Quiz.jsx                # MCQ quiz player
│   │   ├── Flashcard.jsx           # Flashcard deck player
│   │   ├── ConceptPanel.jsx        # Inline concept explanation
│   │   ├── Loader.jsx              # Loading spinner
│   │   ├── BenefitCard.jsx         # Feature cards
│   │   ├── FeatureCard.jsx         # Feature showcase
│   │   └── StepCard.jsx            # Process step indicator
│   ├── hooks/
│   │   └── useAudioRecorder.js     # Audio recording hook
│   ├── services/
│   │   └── api.js                  # Centralized API client
│   ├── styles/
│   │   ├── global.css              # Global styles
│   │   ├── auth.css                # Auth pages
│   │   ├── workspace.css           # Workspace styling
│   │   ├── Quiz.css                # Quiz component
│   │   ├── Flashcard.css           # Flashcard component
│   │   └── [other].css             # Component-specific styles
│   └── assets/                     # Images, icons
├── index.html                      # HTML entry point
├── vite.config.js                  # Vite configuration with API proxy
└── package.json
```

---

## 5. DEPENDENCIES & CONFIGURATIONS

### Backend Dependencies

```json
{
  "@google/generative-ai": "^0.10.0",      // Google Gemini API
  "@ru-hend/ytdl-core": "^4.16.15",        // YouTube video download (fallback)
  "cors": "^2.8.5",                        // CORS headers
  "dotenv": "^17.2.3",                     // Environment variables
  "express": "^5.1.0",                     // Web framework
  "express-session": "^1.18.2",            // Session management
  "ffmpeg-static": "^5.3.0",               // FFmpeg binary
  "fluent-ffmpeg": "^2.1.3",               // FFmpeg wrapper
  "groq-sdk": "^0.3.3",                    // Groq API (Whisper + LLaMA)
  "mongoose": "^8.4.5",                    // MongoDB ODM
  "multer": "^2.0.2",                      // File upload middleware
  "passport": "^0.7.0",                    // Authentication
  "passport-local-mongoose": "^8.0.0",     // Passport MongoDB plugin
  "yt-dlp-wrap": "^2.3.12",                // yt-dlp wrapper
  "youtube-transcript": "^1.3.0",          // YouTube captions
  "joi": "^18.0.2"                         // Input validation
}
```

### Frontend Dependencies

```json
{
  "react": "^19.2.4",                      // UI library
  "react-dom": "^19.2.4",                  // React DOM
  "react-router-dom": "^7.14.0"            // Client routing
}
```

### Environment Variables Required

```
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/scriptly

# API Keys
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_google_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key (optional, has fallback)

# Session
SESSION_SECRET=your_secure_random_secret_key

# Deployment
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Key Configuration Files

**[constants.js](constants.js)**: ML models and limits
```javascript
module.exports = {
  YOUTUBE: { MAX_DURATION_SECONDS: 2700 },  // 45 min limit
  ML: {
    MIN_WORD_COUNT: 20,
    MODELS: {
      PRIMARY_GEMINI: "gemini-2.5-flash",
      FALLBACK_GROQ: "llama-3.3-70b-versatile",
      TRANSCRIPTION: "whisper-large-v3"
    }
  }
};
```

**[vite.config.js](client/vite.config.js)**: API proxy during development
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
});
```

---

## 6. API ENDPOINTS & DATA MODELS

### Authentication Endpoints

| Method | Endpoint | Protected | Purpose | Request Body |
|--------|----------|-----------|---------|--------------|
| POST | `/api/users/register` | ❌ | Register new user | `{ email, password, username? }` |
| POST | `/api/users/login` | ❌ | Login user | `{ email, password }` |
| POST | `/api/users/logout` | ✅ | Logout user | (none) |

### Note Management Endpoints

| Method | Endpoint | Protected | Purpose |
|--------|----------|-----------|---------|
| GET | `/api/notes` | ✅ | List all user notes |
| POST | `/api/notes` | ✅ | Create new note |
| GET | `/api/notes/:id` | ✅ | Get single note |
| PATCH | `/api/notes/:id` | ✅ | Update note |
| DELETE | `/api/notes/:id` | ✅ | Delete note |

### Transcription Endpoints

| Method | Endpoint | Protected | Purpose | Input |
|--------|----------|-----------|---------|-------|
| POST | `/api/transcribe/transcribe` | ❌ | Upload audio and transcribe | multipart/form-data (audio file) |

### AI Processing Endpoints

| Method | Endpoint | Protected | Purpose | Request Body |
|--------|----------|-----------|---------|--------------|
| POST | `/api/summarize` | ❌ | Summarize text | `{ text, mode? }` |
| POST | `/api/explain` | ❌ | Explain a concept | `{ term, context?, level? }` |
| POST | `/api/quiz/generate/:noteId` | ✅ | Generate quiz for note | (none) |

### YouTube Endpoints

| Method | Endpoint | Protected | Purpose | Request Body |
|--------|----------|-----------|---------|--------------|
| POST | `/api/youtube/metadata` | ✅ | Get video metadata | `{ url }` |
| POST | `/api/youtube/process` | ✅ | Process YouTube video | `{ url }` |

### Data Models

**User Schema** (Mongoose):
```javascript
{
  username: String,           // Display name
  email: String (unique),     // Passport login field
  salt: String,               // Passport-local-mongoose
  hash: String,               // Hashed password
  timestamps: true            // createdAt, updatedAt
}
```

**Note Schema** (Mongoose):
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  transcription: String,

  // Legacy fields
  summary: String,
  keywords: [String],

  // Structured summary fields
  subject_detected: String,
  quick_recap: String,
  key_concepts: [{
    concept: String,
    explanation: String,
    why_it_matters: String
  }],
  important_to_remember: [String],
  potential_exam_questions: [{
    question: String,
    hint: String
  }],
  key_terms: Object,           // { term: definition }
  memory_anchors: [String],
  quiz_data: Array,            // Cached quiz questions

  timestamps: true
}
```

---

## 7. AUTHENTICATION & SECURITY

### Current Authentication Flow

```javascript
// 1. Registration: Email + password
User.register(user, password, (err, user) => {
  // Password hashed via passport-local-mongoose
});

// 2. Login: Email-based authentication
passport.authenticate('local', { usernameField: 'email' })

// 3. Session Management
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// 4. Protected Routes
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated' });
};
```

### Security Configuration

**Current Implementation**:
- ✅ Passport.js with local strategy
- ✅ Password hashing via passport-local-mongoose
- ✅ Session-based authentication
- ✅ Input validation via Joi
- ✅ User authorization checks in note operations

**Current Vulnerabilities** (from analysis docs):
- ⚠️ CORS allows ANY origin (`origin: true`)
- ⚠️ No rate limiting → expensive API usage
- ⚠️ No input sanitization → XSS risk
- ⚠️ No request timeouts → server hang risk
- ⚠️ No HTTPS redirect in production

### Recommended Fixes (from IMPLEMENTATION_QUICK_START.md)

1. **Secure CORS** (5 min):
   ```javascript
   const allowedOrigins = [
     'http://localhost:3000',
     process.env.FRONTEND_URL
   ];
   app.use(cors({
     origin: (origin, callback) => {
       if (allowedOrigins.includes(origin)) callback(null, true);
       else callback(new Error('CORS not allowed'));
     }
   }));
   ```

2. **Add Rate Limiting** (10 min):
   ```bash
   npm install express-rate-limit
   ```
   Apply to `/api/summarize`, `/api/transcribe`, `/api/youtube` routes

3. **Add Input Sanitization** (10 min):
   ```bash
   npm install helmet xss
   ```

4. **Add Request Timeouts** (5 min):
   ```javascript
   app.use((req, res, next) => {
     req.setTimeout(30000);  // 30 seconds
     next();
   });
   ```

---

## 8. UI/UX COMPONENTS & PAGES

### Page Architecture

**HomePage** (`/`)
- Hero section with CTA buttons
- Feature showcase (YouTube → Notes → Flashcards → Quizzes)
- Bottom CTA for registration
- Navbar with login/register links

**LoginPage** (`/login`)
- AuthForm component
- Email + password inputs
- Links to registration

**RegisterPage** (`/register`)
- AuthForm component
- Email + password inputs
- Links to login

**WorkspacePage** (`/workspace`) - Protected
- **3-Step Workflow**:
  1. **Input**: Choose recording mode
     - Record audio (MediaRecorder)
     - Upload file
     - Paste YouTube URL
  2. **Processing**: Show transcription
  3. **Summarization**: Display AI-generated summary with mode selector
- **Mode Selection**: first_pass | deep_study | exam_prep | quick_refresh
- **Summary Display**: Expandable sections for concepts, questions, terms
- **Save**: Convert to note with title

**NotesPage** (`/notes`) - Protected
- List all user notes with pagination
- Search across title, content, keywords
- Delete notes
- Click to view detail page

**NoteDetailPage** (`/notes/:id`) - Protected
- Full note view with all fields
- **Quiz Tab**: Generate MCQ quiz, track score
- **Flashcards Tab**: Study terms and concepts
- **Summary Tab**: View structured summary
- Edit capability for manual updates

### Component Library

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| AuthForm | Login/register form | `type` ("login"\|"register"), `onSubmit` |
| Quiz | MCQ quiz player | `noteId`, `subject`, `cachedQuizData` |
| Flashcard | Spaced repetition flashcards | `termCards`, `conceptCards` |
| ConceptPanel | Hover to explain concepts | `term`, `context` |
| ProtectedRoute | Auth guard | `children` |
| Navbar | Header navigation | (none) |
| Footer | Page footer | (none) |
| Loader | Loading spinner | `message` |

### Key User Flows

**Flow 1: Record Audio**
```
1. Start recording via microphone (useAudioRecorder hook)
2. Upload to /api/transcribe/transcribe
3. Receive transcription text
4. Send to /api/summarize with mode
5. Receive structured summary
6. Save as note via /api/notes
```

**Flow 2: Process YouTube Video**
```
1. Paste YouTube URL
2. Fetch metadata via /api/youtube/metadata
3. Preview video (title, thumbnail, duration)
4. Submit via /api/youtube/process
5. Backend: tries captions → fallback to audio download
6. Receive transcript
7. Continue as audio flow (summarize → save)
```

**Flow 3: Study Existing Note**
```
1. Go to /notes to list all
2. Click note to view detail page
3. View summary, key concepts
4. Click "Generate Quiz" → AI generates MCQs
5. Click "Study Flashcards" → Interactive card drilling
6. Hover on terms → See explanation
```

---

## 9. AI/ML WORKFLOWS

### 9.1 Transcription Workflow

```
User Audio Input
    ↓
[Multer] File Upload Handler
    ↓
[Validate] File type & size (<100MB)
    ↓
[FFmpeg] (if >24MB) Compress to 32kbps MP3
    ↓
[Groq Whisper Large v3] Audio → Text
    ↓
[Parse JSON] Extract transcription.text
    ↓
[Cleanup] Delete temporary files
    ↓
Return: { transcription: "..." }
```

**Groq Configuration**:
```javascript
const transcription = await groq.audio.transcriptions.create({
  file: fs.createReadStream(filePath),
  model: "whisper-large-v3",
  response_format: "json",
  language: "en",
  temperature: 0.0  // Deterministic
});
```

### 9.2 Summarization Workflow

```
User Transcript Text (min 20 words)
    ↓
[Validate] Text length, word count
    ↓
[Generate Prompt] Include mode instructions
    ↓
[Try Primary] Google Gemini 2.5 Flash
    │   ├─ Success → Extract JSON
    │   └─ Timeout/Error → Try Fallback
    ↓ (if Gemini fails)
[Try Fallback] Groq LLaMA 3.3 70B
    │   ├─ Success → Extract JSON
    │   └─ Failure → Return error
    ↓
[Parse JSON] Extract structured fields
    ↓
[Validate] Ensure all fields present
    ↓
Return: Structured summary object
```

**Mode Prompts** (from summarization.service.js):

| Mode | Focus | Output |
|------|-------|--------|
| first_pass | Clear overview | 3-4 concepts, 2 exam questions |
| deep_study | Thorough analysis | 5-6 concepts, 4-5 exam questions, memory anchors |
| exam_prep | Test preparation | Maximize exam questions, common misconceptions |
| quick_refresh | Quick essentials | 3 concepts max, 2-sentence recap |

### 9.3 Quiz Generation Workflow

```
Note Data (concepts, important points)
    ↓
[Extract Content] From key_concepts, important_to_remember, key_terms
    ↓
[Generate Prompt] 5-8 questions, pedagogical distractor rules
    ↓
[LLM Call] Primary Gemini → Fallback LLaMA
    ↓
[Parse Response] JSON array of MCQ objects
    ↓
[Validate Quiz] Ensure proper structure
    ↓
[Cache] Store in Note.quiz_data
    ↓
Return: Quiz array with questions, correct_answer, distractors
```

**Distractor Categories** (pedagogically sound):
1. **Misconception**: Common student error for this topic
2. **Adjacent Concept**: Related but incorrect application
3. **Partial Truth**: True in different context

Example:
```json
{
  "question": "What is photosynthesis?",
  "correct_answer": "Process converting light energy to chemical energy in plants",
  "distractors": [
    "Process where plants consume oxygen (misconception)",
    "Process of cellular respiration (adjacent concept)",
    "Process of plant growth (partial truth)"
  ]
}
```

### 9.4 YouTube Processing Workflow

```
YouTube URL
    ↓
[Validate] Extract video ID, check URL format
    ↓
[Get Metadata] YouTube API → yt-dlp (fallback)
    ├─ Title, Thumbnail, Duration, Channel
    └─ Check: Not live, <45 min duration
    ↓
[Try Captions] youtube-transcript library
    ├─ Success & valid → Return captions text
    │   └─ Fail/Invalid → Continue to audio
    ↓
[Download Audio] yt-dlp → MP3 file
    ↓
[Transcribe] Groq Whisper (same as audio flow)
    ↓
[Cleanup] Delete temporary MP3
    ↓
Return: { transcript, source: "captions"|"audio", videoTitle }
```

### 9.5 Explain Concept Workflow

```
User: { term, context, level }
    ↓
[Generate Prompt] Include term, context, difficulty level
    ↓
[Call LLM] Gemini → LLaMA fallback
    ↓
[Parse Response] JSON with fields:
    ├─ one_liner
    ├─ full_explanation
    ├─ real_world_example
    ├─ common_misconception
    └─ connects_to (related concepts)
    ↓
Return: Explanation object for display
```

---

## 10. CURRENT IMPLEMENTATION STATUS & LIMITATIONS

### Completed Features ✅

- ✅ User authentication (email/password)
- ✅ Audio recording with browser MediaRecorder
- ✅ File upload with validation
- ✅ Groq Whisper transcription
- ✅ Google Gemini + Groq LLaMA summarization with fallback
- ✅ YouTube video processing (captions + audio fallback)
- ✅ Structured summary generation with 4 modes
- ✅ Note CRUD operations
- ✅ Quiz generation with cached results
- ✅ Flashcard decks (terms + concepts)
- ✅ Concept explanation on-demand
- ✅ Responsive UI with React Router
- ✅ Session-based authentication

### Known Limitations ⚠️

**Security**:
- CORS allows any origin (critical fix needed)
- No rate limiting (API cost risk)
- No input sanitization (XSS vulnerability)
- No request timeouts (DDoS/hang risk)
- No HTTPS redirect in production

**Performance**:
- No database indexes (will degrade with scale)
- No caching layer (redundant API calls)
- Large file uploads not optimized
- No background job queue

**Features**:
- YouTube 45-minute limit (hard limit)
- No edit of transcription before summarizing
- No collaborative notes
- No offline mode
- No export (PDF, Word, etc.)
- No API rate limits per user
- No admin dashboard

**Infrastructure**:
- No logging/monitoring
- No error tracking (Sentry)
- No analytics
- No deployment automation
- File cleanup not automated

### Database Scalability Concerns

- Notes collection needs index on `userId` + `createdAt`
- No pagination implemented (all notes fetched at once)
- No soft deletes for audit trail
- No archiving strategy for old notes

---

## 11. SETUP & DEPLOYMENT INSTRUCTIONS

### Local Development Setup

**Prerequisites**:
- Node.js 16+
- MongoDB 4.4+ (local or Atlas)
- FFmpeg installed (or ffmpeg-static handles it)

**Backend Setup** (30 min):
```bash
cd server
npm install

# Create .env file
cat > .env << EOF
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/scriptly
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
YOUTUBE_API_KEY=your_youtube_key (optional, has fallback)
SESSION_SECRET=your_random_secret_here
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EOF

# Start server (with nodemon hot reload)
npm start
```

**Frontend Setup** (20 min):
```bash
cd client
npm install
npm run dev
```

Open browser to `http://localhost:5173`

### Production Deployment (on Render, Heroku, etc.)

**1. Environment Setup**:
   - Create production `.env` with real API keys
   - Set `NODE_ENV=production`
   - Update `FRONTEND_URL` to your domain

**2. Build Frontend**:
   ```bash
   cd client
   npm run build
   ```
   This creates `dist/` folder served by Express

**3. Start Backend**:
   ```bash
   cd server
   npm start
   ```
   Serves frontend from `dist/` directory

**4. Database**:
   - Use MongoDB Atlas (cloud)
   - Create indexes on `User` and `Note` collections

**5. API Keys**:
   - Google Gemini: https://ai.google.dev/
   - Groq: https://console.groq.com/
   - YouTube: https://console.developers.google.com/

### Deployment Checklist (from DEPLOYMENT_CHECKLIST.md)

- [ ] Fix CORS security (5 min)
- [ ] Add rate limiting (10 min)
- [ ] Add input sanitization (10 min)
- [ ] Add request timeouts (5 min)
- [ ] Implement file cleanup (15 min)
- [ ] Create `.env.example` (10 min)
- [ ] Create README with instructions (20 min)
- [ ] Test production build locally (1.5 hours)
- [ ] Deploy to production platform (1-2 hours)
- [ ] Setup monitoring & logging

---

## 12. RECOMMENDATIONS FOR IMPROVEMENTS

### Priority 1: Security (Must Do Before Deployment)

1. **Implement Rate Limiting** ($1000+ cost prevention)
   ```bash
   npm install express-rate-limit
   ```
   - 100 requests/15min for general API
   - 20 requests/hour for AI operations per user

2. **Fix CORS** (Data breach prevention)
   - Whitelist specific origins
   - Remove `origin: true`

3. **Add Input Sanitization** (XSS prevention)
   ```bash
   npm install helmet xss
   ```

4. **Request Timeouts** (Server stability)
   - Set 30-60 second timeout on all routes
   - Especially transcription endpoints

### Priority 2: UX Improvements (High Impact)

1. **Progress Indicators** (users think app is frozen)
   - Add progress bar for transcription
   - Add status messages for each step
   - Show estimated time remaining

2. **Error Boundary Component**
   - Catch React errors
   - Display user-friendly messages
   - Replace all `alert()` with Toast notifications

3. **Loading States**
   - YouTube processing status
   - AI summarization progress
   - Quiz generation spinner

### Priority 3: Performance (Scale-Ready)

1. **Database Indexes**
   ```javascript
   noteSchema.index({ userId: 1, createdAt: -1 });
   userSchema.index({ email: 1 });
   ```

2. **File Cleanup Scheduler** (storage cost prevention)
   - Delete uploads older than 1 hour
   - Run every 6 hours

3. **Caching Layer**
   - Redis for quiz cache
   - Cache YouTube metadata (1 hour)
   - Cache summary templates

4. **Pagination**
   - Implement offset/limit for notes
   - Frontend: infinite scroll or page buttons

### Priority 4: Features (Product Enhancements)

1. **Edit Before Save**
   - Allow users to edit transcription before summarizing
   - Faster for users with audio issues

2. **Export Notes**
   - PDF generation
   - Markdown export
   - Anki flashcard format

3. **Collaborative Features**
   - Share notes with classmates
   - Comments on specific concepts

4. **Better Quiz Analytics**
   - Track quiz history
   - Spaced repetition scheduler
   - Performance by topic

5. **Search Enhancement**
   - Full-text search in notes
   - Filter by subject/date
   - Keyword extraction UI

### Priority 5: Infrastructure (Enterprise Ready)

1. **Monitoring & Logging**
   - Winston or Pino logger
   - Sentry error tracking
   - Datadog or New Relic APM

2. **API Documentation**
   - Swagger/OpenAPI spec
   - Interactive API explorer

3. **Testing**
   - Unit tests (Jest)
   - Integration tests
   - E2E tests (Cypress)

4. **CI/CD Pipeline**
   - GitHub Actions
   - Automated tests on PR
   - Auto-deploy to staging

5. **Backup & Recovery**
   - MongoDB backup automation
   - File storage backup
   - Disaster recovery plan

### Code Quality Improvements

1. **Error Handling**: Standardize error responses
2. **Type Safety**: Add TypeScript or JSDoc
3. **API Versioning**: Prepare for `/api/v2`
4. **Configuration**: Environment-based settings
5. **Documentation**: API docs, deployment guide

---

## 13. KEY METRICS & PERFORMANCE CONSIDERATIONS

### Performance Baselines (from code analysis)

| Operation | Estimated Time |
|-----------|---|
| Audio upload & transcribe | 30-120 sec (depends on audio length) |
| Text summarization | 15-45 sec (Gemini) or 20-60 sec (Groq) |
| YouTube processing | 45-180 sec (includes download + transcribe) |
| Quiz generation | 30-90 sec (LLM API calls) |
| Note CRUD | <500ms (local DB) |

### Scalability Concerns

- **Database**: Will need indexes at 10K+ notes
- **File Storage**: Temporary upload folder cleanup needed
- **API Costs**: Groq Whisper ~$0.02/min, Gemini ~variable based on tokens
- **Concurrent Users**: Single Express server handles ~1000 concurrent

### Resource Allocation

```
API Keys Budget (estimate for 1000 users):
- Transcription: $20-50/month (voice input)
- Summarization: $50-200/month (text → AI)
- YouTube Processing: $0-50/month (depends on YouTube API usage)
- Total: $70-300/month
```

---

## CONCLUSION

**Scriptly** is a well-architected, feature-complete AI-powered study platform ready for production deployment with minor security hardening. The codebase demonstrates good separation of concerns with modular services, resilient AI pipelines with fallback mechanisms, and user-friendly interfaces.

### Time to Production: 1-2 weeks
- Security fixes: 1.5 hours
- UX improvements: 2-3 hours
- Testing & deployment: 5-10 hours

### Recommendation: Deploy immediately after implementing the 5 critical security fixes from Priority 1, then iterate on improvements based on user feedback.

