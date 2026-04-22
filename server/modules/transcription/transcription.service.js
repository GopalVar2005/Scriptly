const fs = require("fs");
const Groq = require("groq-sdk");
require("dotenv").config();
const { ML } = require("../../config/constants");
const logger = require("../../utils/logger");

const { extractAudioFromVideo } = require('./video.service');
const path = require('path');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy", 
});

async function transcribeAudio(filePath, mimetype) {
  let fileToUpload = filePath;
  let compressedPath = null;

  try {
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 24) {
      logger.warn("[TRANSCRIPTION]", `File is large (${fileSizeMB.toFixed(2)}MB). Compressing via FFmpeg...`);
      compressedPath = filePath.replace(path.extname(filePath), "_compressed.mp3");
      await extractAudioFromVideo(filePath, compressedPath);
      fileToUpload = compressedPath;
    }

    logger.info("[TRANSCRIPTION]", `Starting Groq transcription for file: ${fileToUpload}`);
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(fileToUpload),
      model: ML.MODELS.TRANSCRIPTION,
      response_format: "json",
      language: "en",
      temperature: 0.0,
    });
    
    logger.info("[TRANSCRIPTION]", "Transcription successful");
    return transcription.text || "";
  } catch (error) {
    logger.error("[ERROR]", "Transcription service failed", error);
    const apiError = error.response && error.response.data && error.response.data.detail 
        ? error.response.data.detail 
        : error.message || error;
    throw new Error(`Failed to transcribe audio: ${apiError}`);
  } finally {
    if (compressedPath && fs.existsSync(compressedPath)) {
      try { fs.unlinkSync(compressedPath); } catch (e) {}
    }
  }
}

module.exports = {
  transcribeAudio
};
