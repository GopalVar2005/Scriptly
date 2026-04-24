const fs = require('fs');
const path = require('path');
const he = require('he');

// Configure API Keys from environment
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

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

// ── Transcript Fetching APIs ───────────────────────────────────

// Method 1 (PRIMARY): Supadata
async function fetchTranscriptSupadata(videoId) {
  if (!SUPADATA_API_KEY) {
    console.log("[YouTube] SUPADATA_API_KEY not set. Skipping primary API.");
    return null;
  }
  
  try {
    // Official Supadata REST endpoint (requesting English explicitly)
    const response = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en`, {
      method: 'GET',
      headers: {
        'x-api-key': SUPADATA_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Supadata API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse Supadata response
    if (data && data.content) {
      return data.content;
    } else if (Array.isArray(data)) {
      return data.map(item => item.text).join(' ');
    } else if (data && data.transcript) {
      return data.transcript;
    }
    
    return null;
  } catch (error) {
    console.error(`[YouTube API] Supadata fetch failed for ${videoId}:`, error.message);
    return null;
  }
}

// Method 2 (FALLBACK): RapidAPI
async function fetchTranscriptRapidAPI(videoId) {
  if (!RAPIDAPI_KEY) {
    console.log("[YouTube] RAPIDAPI_KEY not set. Skipping backup API.");
    return null;
  }
  
  try {
    // Common RapidAPI endpoint (requesting English explicitly)
    const response = await fetch(`https://youtube-transcripts.p.rapidapi.com/youtube/transcript?videoId=${videoId}&chunked=false&lang=en`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'youtube-transcripts.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data && data.content) {
      return data.content;
    } else if (Array.isArray(data)) {
      return data.map(t => t.text).join(' ');
    }
    return null;
  } catch (error) {
    console.error(`[YouTube API] RapidAPI fetch failed for ${videoId}:`, error.message);
    return null;
  }
}

async function getYouTubeTranscript(url, videoIdParam) {
  const videoId = videoIdParam || extractVideoId(url);
  if (!videoId) return null;

  // 1. Primary: Supadata
  console.log(`[YouTube] Attempting primary API (Supadata) for: ${videoId}`);
  let rawTranscript = await fetchTranscriptSupadata(videoId);

  // 2. Backup: RapidAPI
  if (!rawTranscript) {
    console.log(`[YouTube] Primary failed. Attempting backup API (RapidAPI) for: ${videoId}`);
    rawTranscript = await fetchTranscriptRapidAPI(videoId);
  }

  if (rawTranscript) {
    console.log(`[YouTube] ✅ Successfully fetched transcript for: ${videoId}`);
    
    // Safety check: Ensure rawTranscript is a string before decoding
    let finalTranscript = '';
    if (typeof rawTranscript === 'string') {
        finalTranscript = rawTranscript;
    } else if (Array.isArray(rawTranscript)) {
        // If it's an array of objects (like {text: 'hello'})
        finalTranscript = rawTranscript.map(item => typeof item === 'object' ? (item.text || '') : item).join(' ');
    } else if (typeof rawTranscript === 'object') {
        finalTranscript = rawTranscript.content || rawTranscript.transcript || rawTranscript.text || JSON.stringify(rawTranscript);
    } else {
        finalTranscript = String(rawTranscript);
    }
    
    if (typeof finalTranscript !== 'string') finalTranscript = String(finalTranscript);

    return cleanCaptionText(he.decode(finalTranscript));
  }

  // Both methods failed
  console.log(`[YouTube] ❌ All APIs failed for: ${videoId}`);
  return null;
}

module.exports = {
  extractVideoId,
  isValidYouTubeUrl,
  getVideoMetadata,
  getYouTubeTranscript
};
