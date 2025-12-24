const express = require('express');
const Note = require('../models/Note');
const router = express.Router();
const {isLoggedIn} =require('../middleware');
const {noteSchema}=require('../validation')

// Create a note
router.post('/', isLoggedIn, async (req, res) => {
    const { error } = noteSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    try {
        const note = await Note.create({
            owner: req.user._id, // enforce note ownership
            content: req.body.content,
            keywords: req.body.keywords || []
        });
        res.status(201).json(note);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all notes of logged-in user
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const notes = await Note.find({ owner: req.user._id });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update note
router.patch('/:id', isLoggedIn, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || !note.owner.equals(req.user._id)) return res.status(403).json({ error: "Not authorized" });
        Object.assign(note, req.body);
        await note.save();
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete note
router.delete('/:id', isLoggedIn, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || !note.owner.equals(req.user._id)) return res.status(403).json({ error: "Not authorized" });
        await note.remove();
        res.json({ message: "Note deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
