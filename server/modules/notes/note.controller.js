const Note = require('../../models/Note');
const { noteSchema } = require('../../validation');
const logger = require('../../utils/logger');

const createNote = async (req, res) => {
    const { error } = noteSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    try {
        let title = req.body.title;
        if (!title || title.trim() === '') {
            title = `Note - ${new Date().toLocaleDateString()}`;
        }

        let baseTitle = title;
        let suffix = 1;
        while (await Note.findOne({ userId: req.user._id, title })) {
            title = `${baseTitle} (${suffix})`;
            suffix++;
        }

        const note = await Note.create({
            userId: req.user._id,
            title: title,
            transcription: req.body.transcription,
            summary: req.body.summary || "",
            keywords: req.body.keywords || [],
            subject_detected: req.body.subject_detected || "",
            quick_recap: req.body.quick_recap || "",
            key_concepts: req.body.key_concepts || [],
            important_to_remember: req.body.important_to_remember || [],
            potential_exam_questions: req.body.potential_exam_questions || [],
            key_terms: req.body.key_terms || {},
            memory_anchors: req.body.memory_anchors || [],
        });
        
        logger.info('[NOTES]', `Created node ${note._id} for user ${req.user._id}`);
        res.status(201).json({ success: true, data: note });
    } catch (err) {
        logger.error('[NOTES]', 'Failed to create note', err);
        res.status(400).json({ success: false, error: err.message });
    }
};

const getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: notes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getSingleNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || !note.userId.equals(req.user._id)) return res.status(403).json({ success: false, error: "Not authorized" });
        res.json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const updateNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || !note.userId.equals(req.user._id)) return res.status(403).json({ success: false, error: "Not authorized" });
        
        const allowedFields = [
            "title", "summary", "keywords", "quick_recap", 
            "key_concepts", "important_to_remember", "potential_exam_questions", 
            "key_terms", "memory_anchors"
        ];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                note[field] = req.body[field];
            }
        });

        await note.save();
        logger.info('[NOTES]', `Updated note ${note._id}`);
        res.json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || !note.userId.equals(req.user._id)) return res.status(403).json({ success: false, error: "Not authorized" });
        await note.deleteOne();
        logger.info('[NOTES]', `Deleted note ${req.params.id}`);
        res.json({ success: true, message: "Note deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { createNote, getNotes, getSingleNote, updateNote, deleteNote };
