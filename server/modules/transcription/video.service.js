const ffmpeg = require('fluent-ffmpeg');// Import the ffmpeg library for audio/video processing
const ffmpegStatic = require('ffmpeg-static');// Import the static ffmpeg binary path for cross-platform compatibility
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegStatic);// Set the path to the ffmpeg binary for fluent-ffmpeg to use

/**
 * Extract audio from an uploaded video file using FFmpeg.
 * Outputs a low-bitrate MP3 (64k) to stay within Whisper's 25MB limit.
 */
function extractAudioFromVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`[Video] Extracting audio from: ${inputPath}`);

    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioChannels(1)
      .audioBitrate('32k')
      .save(outputPath)
      .on('end', () => {
        console.log(`[Video] Audio extraction complete: ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`[Video] Audio extraction error:`, err.message);
        reject(err);
      });
  });
}

module.exports = { extractAudioFromVideo };
