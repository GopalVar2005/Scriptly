module.exports = {
  YOUTUBE: {
    MAX_DURATION_SECONDS: 2700, // 45 minutes
  },
  ML: {
    MIN_WORD_COUNT: 20,
    MODELS: {
      PRIMARY_GEMINI: "gemini-2.5-flash",
      FALLBACK_GROQ: "llama-3.3-70b-versatile",
      TRANSCRIPTION: "whisper-large-v3"
    },
    TEMPERATURE: {  // How predictable vs creative should the answer be
      DEFAULT: 0.2,
      QUIZ: 0.3
    }
  }
};
