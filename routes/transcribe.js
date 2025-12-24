const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);
const router = express.Router();

// Upload config
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /\.(wav|mp3|m4a|webm)$/i.test(file.originalname)
      ? cb(null, true)
      : cb(new Error("Only audio files allowed")),
});

// Helper: remove files safely
const safeDelete = (file) => file && fs.existsSync(file) && fs.unlink(file, () => {});

// ---- TRANSCRIBE ENDPOINT ----
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio uploaded" });

  const input = req.file.path;
  const output = `${input}.wav`;

  try {
    // Convert to WAV
    await new Promise((resolve, reject) =>
      ffmpeg(input)
        .toFormat("wav")
        .save(output)
        .on("end", resolve)
        .on("error", reject)
    );

    const pythonScript = path.join(__dirname, "../python/transcribe.py");
    if (!fs.existsSync(pythonScript))
      return res.status(500).json({ error: "Transcription script missing" });

    // Prefer project's virtualenv python if it exists (Windows layout)
    const venvPython = path.join(__dirname, "..", "env", "Scripts", "python.exe");
    const pythonCmd = fs.existsSync(venvPython) ? venvPython : (process.platform === "win32" ? "python" : "python3");
    const env = { ...process.env, FFMPEG_PATH: ffmpegPath };

    console.error("Using python executable:", pythonCmd);
    const python = spawn(pythonCmd, ["-u", pythonScript, output], { env });

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (d) => (stdout += d.toString()));
    python.stderr.on("data", (d) => (stderr += d.toString()));

    python.on("close", () => {
      safeDelete(input);
      safeDelete(output);

      // Prefer JSON error if python returned one
      if (stderr.trim().startsWith("{")) {
        try {
          return res.status(500).json(JSON.parse(stderr));
        } catch {}
      }

      const transcript = stdout.trim();
      if (!transcript || transcript === "No speech detected in audio.")
        return res.json({
          transcription:
            "No speech detected in the audio. Please record again.",
        });

      return res.json({ transcription: transcript });
    });
  } catch (err) {
    safeDelete(input);
    safeDelete(output);
    return res.status(500).json({
      error: `Audio processing failed: ${err.message || err}`,
    });
  }
});

module.exports = router;
