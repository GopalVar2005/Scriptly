const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../../middleware');
const noteController = require('./note.controller');

router.post('/', isLoggedIn, noteController.createNote);
router.get('/', isLoggedIn, noteController.getNotes);
router.get('/:id', isLoggedIn, noteController.getSingleNote);
router.patch('/:id', isLoggedIn, noteController.updateNote);
router.delete('/:id', isLoggedIn, noteController.deleteNote);

module.exports = router;
