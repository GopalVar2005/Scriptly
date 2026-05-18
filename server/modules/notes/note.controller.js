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
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
        const sortParam = req.query.sort || 'newest';

        // Determine sort order
        let sortObj;
        switch (sortParam) {
            case 'oldest':  sortObj = { createdAt: 1 };  break;
            case 'updated': sortObj = { updatedAt: -1 }; break;
            default:        sortObj = { createdAt: -1 };  break; // 'newest'
        }

        // Lightweight projection — exclude heavy fields not needed for list view
        const listProjection = {
            transcription: 0,
            summary: 0,
            quiz_data: 0,
            key_concepts: 0,
            important_to_remember: 0,
            potential_exam_questions: 0,
            memory_anchors: 0,
            flashcard_progress: 0
        };

        const skip = (page - 1) * limit;
        const total = await Note.countDocuments({ userId: req.user._id });
        const notes = await Note.find({ userId: req.user._id }, listProjection)
            .sort(sortObj)
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: notes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
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
        const allowedFields = [
            "title", "summary", "keywords", "quick_recap", 
            "key_concepts", "important_to_remember", "potential_exam_questions", 
            "key_terms", "memory_anchors", "flashcard_progress"
        ];
        
        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (Object.keys(updateData).length === 0) {
            const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
            return res.json({ success: true, data: note });
        }

        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: updateData },
            { new: true }
        );

        if (!note) return res.status(403).json({ success: false, error: "Not authorized or not found" });

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
