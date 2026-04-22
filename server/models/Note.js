const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        trim: true,
        default: "Untitled Note"
    },
    transcription: {
        type: String,
        trim: true,
        required: true
    },
    // Legacy string summary (kept for backward compat)
    summary: {
        type: String,
        trim: true,
        default: ""
    },
    keywords: {
        type: [String],
        default: []
    },
    // Structured summary fields (new)
    subject_detected: { type: String, default: "" },
    quick_recap: { type: String, default: "" },
    key_concepts: { type: Array, default: [] },
    important_to_remember: { type: [String], default: [] },
    potential_exam_questions: { type: Array, default: [] },
    key_terms: { type: Object, default: {} },
    memory_anchors: { type: [String], default: [] },
    // Quiz data — cached after first generation
    quiz_data: { type: Array, default: [] }
}, { timestamps: true });

// Index for efficient per-user note queries (sorted by newest first)
noteSchema.index({ userId: 1, createdAt: -1 });

const Note = mongoose.model('Note', noteSchema);
module.exports = Note;
