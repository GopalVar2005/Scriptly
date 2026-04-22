const express = require("express");
const router = express.Router();
const youtubeController = require("./youtube.controller");

router.post("/metadata", youtubeController.getMetadata);
router.post("/process", youtubeController.processVideo);

module.exports = router;