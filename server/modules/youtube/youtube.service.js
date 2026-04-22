const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { fetchTranscript } = require('youtube-transcript-plus'); // Library to fetch YouTube captions
const he = require('he');

// ── URL Utilities ──────────────────────────────────────────────

function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  const patterns = [// Common YouTube URL formats
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];// If a match is found, return the video ID
  }

  return null;
}

function isValidYouTubeUrl(url) {
  return extractVideoId(url) !== null;
}

// Convert ISO 8601 duration (e.g. PT1H2M10S) to seconds
function parseIsoDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  return (hours * 3600) + (minutes * 60) + seconds;
}

// ── Video Metadata ─────────────────────────────────────────────

async function getVideoMetadata(url) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");
  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // YouTube Data API — the only production-reliable source for metadata
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key not configured. Please contact support.");
  }

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error("Video not found. It may be private or deleted.");
    }

    const item = data.items[0];
    const duration = parseIsoDuration(item.contentDetails.duration);

    console.log(`[YouTube] Fetched metadata via YouTube API for ${videoId}`);

    function format(secs) {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    return {
      videoId,
      url: cleanUrl,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      duration: duration,
      durationFormatted: format(duration),
      channelName: item.snippet.channelTitle,
      isLive: item.snippet.liveBroadcastContent !== 'none'
    };
  } catch (err) {
    // Re-throw our own errors, wrap unexpected ones
    if (err.message.includes('not found') || err.message.includes('not configured')) {
      throw err;
    }
    console.error(`[YouTube] API fetch failed: ${err.message}`);
    throw new Error("Could not fetch video information. Please check the URL and try again.");
  }
}

// ── Captions / Transcript ──────────────────────────────────────

async function getYouTubeTranscript(url, videoIdParam) {
  const videoId = videoIdParam || extractVideoId(url);
  if (!videoId) return null;

  try {
    const segments = await fetchTranscript(videoId, { lang: 'en' });

    if (segments && Array.isArray(segments) && segments.length > 0) {
      console.log(`[YouTube] Successfully fetched captions for video: ${videoId}. Items: ${segments.length}`);
      const rawText = segments.map(s => he.decode(s.text)).join(' ');
      // Clean and structure caption text for better AI processing
      const cleanedText = rawText
        .replace(/\s+/g, ' ')       // Normalize whitespace
        .replace(/\.\s+/g, '.\n\n') // Add paragraph breaks after sentences
        .replace(/\?\s+/g, '?\n\n') // Add paragraph breaks after questions
        .replace(/!\s+/g, '!\n\n')  // Add paragraph breaks after exclamations
        .trim();
      return cleanedText;
    } else {
      console.log(`[YouTube] Caption array empty or invalid for video: ${videoId}.`);
      return null;
    }
  } catch (err) {
    console.log(`[YouTube] Caption fetch failed for video ${videoId}: ${err.message}.`);
    return null;
  }
}

// ── Audio Download (DISABLED IN PRODUCTION) ────────────────────
// Kept for backward compatibility and potential future use with
// a paid proxy or different hosting environment.
// In production (Render), yt-dlp is blocked by YouTube anti-bot.

async function downloadYouTubeAudio(url, videoIdParam) {
  throw new Error(
    "Audio download is not available in production. " +
    "YouTube blocks server-side downloads. " +
    "Please use a video with captions enabled."
  );
}

module.exports = {
  extractVideoId,
  isValidYouTubeUrl,
  getVideoMetadata,
  getYouTubeTranscript,
  downloadYouTubeAudio
};
