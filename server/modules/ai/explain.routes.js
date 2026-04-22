const express = require("express");
const router = express.Router();
const aiController = require("./ai.controller");

router.post("/", aiController.explain);

module.exports = router;
