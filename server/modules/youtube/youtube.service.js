const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { fetchTranscript: fetchTranscriptPlus } = require('youtube-transcript-plus'); // Fallback: web page scraping
const he = require('he');

// ── Direct Innertube API Implementation ────────────────────────
// youtube-transcript npm package has a broken ESM/CJS build that crashes on Node v24.
// Instead, we implement the same Innertube API call directly using built-in fetch().
// This is the exact logic: POST to YouTube's internal player API with an Android
// client identity, extract caption track URLs, fetch + parse the XML.

const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
const INNERTUBE_CONTEXT = { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } };
const INNERTUBE_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)';
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36';

async function fetchTranscriptViaInnertube(videoId, lang = 'en') {
  // Step 1: Get caption tracks from Innertube API
  const playerResponse = await fetch(INNERTUBE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': INNERTUBE_UA },
    body: JSON.stringify({ context: INNERTUBE_CONTEXT, videoId })
  });

  if (!playerResponse.ok) return null;

  const playerData = await playerResponse.json();
  const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!Array.isArray(tracks) || tracks.length === 0) return null;

  // Step 2: Find the requested language track (or use first available)
  const track = tracks.find(t => t.languageCode === lang) || tracks[0];
  if (!track?.baseUrl) return null;

  // Step 3: Fetch the caption XML
  const captionResponse = await fetch(track.baseUrl, {
    headers: { 'User-Agent': BROWSER_UA }
  });

  if (!captionResponse.ok) return null;

  const xml = await captionResponse.text();

  // Step 4: Parse XML into segments
  const segments = [];
  const regex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    segments.push({
      text: match[3],
      offset: parseFloat(match[1]),
      duration: parseFloat(match[2])
    });
  }

  return segments.length > 0 ? segments : null;
}

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

// ── Helper: clean raw caption text ─────────────────────────────

function cleanCaptionText(rawText) {
  return rawText
    .replace(/\s+/g, ' ')       // Normalize whitespace
    .replace(/\.\s+/g, '.\n\n') // Add paragraph breaks after sentences
    .replace(/\?\s+/g, '?\n\n') // Add paragraph breaks after questions
    .replace(/!\s+/g, '!\n\n')  // Add paragraph breaks after exclamations
    .trim();
}

// ── Captions / Transcript (Dual-Library Fallback) ──────────────
//
// Method 1 (PRIMARY):   youtube-transcript → Innertube API with Android client identity
//                       Much better success rate from cloud/datacenter IPs
// Method 2 (FALLBACK):  youtube-transcript-plus → web page scraping
//                       May work if Innertube is temporarily down

async function getYouTubeTranscript(url, videoIdParam) {
  const videoId = videoIdParam || extractVideoId(url);
  if (!videoId) return null;

  // ── Method 1: Direct Innertube API (Android client identity) ──
  try {
    const segments = await fetchTranscriptViaInnertube(videoId, 'en');

    if (segments && Array.isArray(segments) && segments.length > 0) {
      console.log(`[YouTube] ✅ Method 1 (Innertube) succeeded for: ${videoId}. Items: ${segments.length}`);
      const rawText = segments.map(s => he.decode(s.text)).join(' ');
      return cleanCaptionText(rawText);
    }
  } catch (err) {
    console.log(`[YouTube] Method 1 (Innertube) failed for ${videoId}: ${err.message}. Trying fallback...`);
  }

  // ── Method 2: youtube-transcript-plus (web page scraping) ──
  try {
    const segments = await fetchTranscriptPlus(videoId, { lang: 'en' });

    if (segments && Array.isArray(segments) && segments.length > 0) {
      console.log(`[YouTube] ✅ Method 2 (web scrape) succeeded for: ${videoId}. Items: ${segments.length}`);
      const rawText = segments.map(s => he.decode(s.text)).join(' ');
      return cleanCaptionText(rawText);
    }
  } catch (err) {
    console.log(`[YouTube] Method 2 (web scrape) also failed for ${videoId}: ${err.message}.`);
  }

  // Both methods failed
  console.log(`[YouTube] ❌ All caption methods failed for: ${videoId}`);
  return null;
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
