const {
  extractVideoId,
  isValidYouTubeUrl,
  getVideoMetadata,
  getYouTubeTranscript,
} = require("./youtube.service");
const { youtubeSchema } = require("../../validation");
const { YOUTUBE } = require("../../config/constants");
const logger = require("../../utils/logger");

const getMetadata = async (req, res) => {
  try {
    const { error } = youtubeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const { url } = req.body;

    if (!isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL." });
    }

    const metadata = await getVideoMetadata(url);

    if (metadata.duration > YOUTUBE.MAX_DURATION_SECONDS) {
      metadata.tooLong = true;
      metadata.maxDurationFormatted = `${Math.floor(YOUTUBE.MAX_DURATION_SECONDS / 60)} minutes`;
    }

    if (metadata.isLive) {
      return res.status(400).json({ error: "Live streams cannot be transcribed." });
    }

    return res.json(metadata);

  } catch (err) {
    logger.error("[YOUTUBE_SERVICE]", "Could not fetch metadata", err);
    return res.status(500).json({ error: "Could not fetch video information." });
  }
};

const processVideo = async (req, res) => {
  try {
    const { error } = youtubeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const { url } = req.body;

    if (!isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL." });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: "Could not extract video ID from URL." });
    }

    const metadata = await getVideoMetadata(url);

    if (metadata.isLive) {
      return res.status(400).json({ error: "Live streams cannot be transcribed." });
    }

    if (metadata.duration > 0 && metadata.duration > YOUTUBE.MAX_DURATION_SECONDS) {
      return res.status(400).json({
        error: `Video is too long (${metadata.durationFormatted}). Maximum supported length is ${Math.floor(YOUTUBE.MAX_DURATION_SECONDS / 60)} minutes.`,
      });
    }

    logger.info("[YOUTUBE_SERVICE]", `Attempting caption extraction for: ${videoId}`);
    const captionTranscript = await getYouTubeTranscript(url, videoId);

    if (captionTranscript && captionTranscript.trim().length > 20) {
      logger.info("[YOUTUBE_SERVICE]", `Returning caption-based transcript for: ${videoId}`);
      return res.json({
        transcript: captionTranscript,
        source: "captions",
        videoTitle: metadata.title,
      });
    }

    // No captions available — return a helpful, structured response
    logger.info("[YOUTUBE_SERVICE]", `No captions available for: ${videoId}`);
    return res.status(422).json({
      error: "This video doesn't have captions available.",
      code: "CAPTIONS_UNAVAILABLE",
      videoTitle: metadata.title,
      suggestions: [
        "Look for the CC (subtitles) icon on the YouTube video",
        "Educational channels like Khan Academy, MIT OCW usually have captions",
        "You can also record or upload audio directly using the Record/Upload tab"
      ]
    });

  } catch (err) {
    logger.error("[YOUTUBE_SERVICE]", "Process failure", err);
    return res.status(500).json({
      error: "Failed to process YouTube video. Please try again.",
    });
  }
};

module.exports = {
  getMetadata,
  processVideo
};
