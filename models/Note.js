const mongoose = require('mongoose');
const User = require('./User');

const noteSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, // ensures every note must have an owner
    },
    content: {
        type: String,
        trim: true,
        required: true
    },
    keywords: {
        type: [String],
        default: []
    }
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);
module.exports = Note;
