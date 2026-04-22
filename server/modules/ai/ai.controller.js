const { summarizeText, explainConcept, generateMCQQuiz } = require("./summarization.service");
const { ML } = require("../../config/constants");
const Note = require("../../models/Note");
const logger = require("../../utils/logger");

const VALID_MODES = ["first_pass", "deep_study", "exam_prep", "quick_refresh"];

const summarize = async (req, res) => {
    const text = req.body?.text?.trim();
    let mode = req.body?.mode?.trim();

    if (!text) {
        return res.status(400).json({ error: "Text is required" });
    }
    
    const wordCount = text.split(/\s+/).length; // Count words by splitting on whitespace
    if (wordCount < ML.MIN_WORD_COUNT) {
        return res.status(400).json({ error: `Text must be at least ${ML.MIN_WORD_COUNT} words long to summarize.` });
    }
    
    if (!mode || !VALID_MODES.includes(mode)) {
        mode = "first_pass";
    }

    try {
        const summaryData = await summarizeText(text, mode);
        return res.json(summaryData);
    } catch (err) {
        logger.error("[AI_SERVICE]", "Summarization failed", err);
        return res.status(500).json({
            error: err.message || "Summarization failed",
        });
    }
};

const explain = async (req, res) => {
    try {
        const { term, context, level } = req.body;
        if (!term) return res.status(400).json({ error: "Term is required" });

        const result = await explainConcept(term, context, level);
        res.json(result);
    } catch (err) {
        logger.error("[AI_SERVICE]", "Explain failed", err);
        res.status(500).json({ error: err.message });
    }
};

const generateQuiz = async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.noteId, userId: req.user._id });
        if (!note) return res.status(404).json({ error: "Note not found" });

        if (note.quiz_data && note.quiz_data.length > 0) {
            logger.info("[AI_SERVICE]", `Returning cached quiz for note: ${req.params.noteId}`);
            return res.json({ quiz_data: note.quiz_data });
        }

        const quiz_data = await generateMCQQuiz(note);

        if (!Array.isArray(quiz_data) || quiz_data.length === 0) {
            return res.status(400).json({ error: "Failed to generate quiz from this material." });
        }

        note.quiz_data = quiz_data;
        await note.save();

        logger.info("[AI_SERVICE]", `Generated and cached quiz for note: ${req.params.noteId}`);
        res.json({ quiz_data });

    } catch (err) {
        logger.error("[AI_SERVICE]", "Quiz generation failed", err);
        res.status(500).json({ error: "Quiz generation failed: " + err.message });
    }
};

module.exports = { summarize, explain, generateQuiz };
