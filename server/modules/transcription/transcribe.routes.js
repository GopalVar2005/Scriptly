const express = require("express");
const multer = require("multer");
const transcribeController = require("./transcribe.controller");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 },  // 100 MB limit
  fileFilter: (req, file, cb) =>
    /\.(wav|mp3|m4a|webm|mp4|mkv|mov)$/i.test(file.originalname)  // Allow common audio and video formats
      ? cb(null, true)
      : cb(new Error("Only audio or video files allowed")),
});
// Accept ONE file from the request, where the field name is audio
router.post("/transcribe", upload.single("audio"), transcribeController.transcribe);

module.exports = router;
