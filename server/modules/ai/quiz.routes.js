const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../../middleware");
const aiController = require("./ai.controller");

router.post("/generate/:noteId", isLoggedIn, aiController.generateQuiz);

module.exports = router;
