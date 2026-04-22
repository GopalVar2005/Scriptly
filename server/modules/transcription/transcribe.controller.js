const fs = require("fs");
const path = require("path");
const { transcribeAudio } = require("./transcription.service");
const { extractAudioFromVideo } = require("./video.service");
const logger = require("../../utils/logger");

const safeDelete = (file) => file && fs.existsSync(file) && fs.unlink(file, () => {});// Safely delete a file if it exists, ignoring errors

const transcribe = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio uploaded" });

  const originalExt = path.extname(req.file.originalname) || ".wav";// Ensure the file has an extension for processing, defaulting to .wav if missing
  const newPath = req.file.path + originalExt;// Rename the uploaded file to include the correct extension for processing

  try {
    fs.renameSync(req.file.path, newPath);
  } catch (err) {
    return res.status(500).json({ error: "File system error processing upload" });
  }

  try {
    const isVideo = req.file.mimetype && req.file.mimetype.startsWith('video/');
    let transcriptionPath = newPath;
    let audioOutputPath = null;

    if (isVideo) {
      logger.info('[TRANSCRIPTION]', 'Video file detected, extracting audio...');
      audioOutputPath = newPath.replace(path.extname(newPath), '.mp3');
      await extractAudioFromVideo(newPath, audioOutputPath);
      transcriptionPath = audioOutputPath;
    }

    const text = await transcribeAudio(transcriptionPath, req.file.mimetype);

    safeDelete(newPath);
    if (audioOutputPath) safeDelete(audioOutputPath);

    if (!text || !text.trim()) {
      return res.json({ transcription: "No speech detected in the audio. Please record again." });
    }

    return res.json({ transcription: text });

  } catch (err) {
    safeDelete(newPath);
    logger.error("[TRANSCRIPTION]", "Local process failure", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { transcribe };
