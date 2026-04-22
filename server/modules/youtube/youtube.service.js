const fs = require('fs');
const path = require('path');
let YTDlpWrap = require('yt-dlp-wrap').default || require('yt-dlp-wrap'); // tool to download YouTube content
if (!YTDlpWrap.downloadFromGithub && require('yt-dlp-wrap').default) {
  YTDlpWrap = require('yt-dlp-wrap').default;
}
const { v4: uuidv4 } = require('uuid');

// Store binary in uploads/ (writable on Render) instead of __dirname (may be read-only)
const ytDlpBinaryPath = path.join(__dirname, '../../uploads',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp-binary');
let ytDlpWrapInstance = null;
let ytDlpInitPromise = null;

async function getYtDlp() {
  if (ytDlpWrapInstance) return ytDlpWrapInstance;

  if (!ytDlpInitPromise) {
    ytDlpInitPromise = (async () => {
      // Ensure uploads directory exists
      const uploadsDir = path.dirname(ytDlpBinaryPath);
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      if (fs.existsSync(ytDlpBinaryPath)) {
        try {
          // Verify the binary is executable on this platform
          const wrap = new YTDlpWrap(ytDlpBinaryPath);
          await wrap.execPromise(['--version']);
          console.log('[YouTube] Using existing yt-dlp binary.');
          return wrap;
        } catch (e) {
          console.log('[YouTube] Existing binary incompatible with this platform, re-downloading...');
          try { fs.unlinkSync(ytDlpBinaryPath); } catch (unlinkErr) {}
        }
      }

      console.log('[YouTube] Downloading yt-dlp binary for this platform. This may take a minute...');
      await YTDlpWrap.downloadFromGithub(ytDlpBinaryPath);

      try {
        fs.chmodSync(ytDlpBinaryPath, '755');
      } catch (e) { }

      console.log('[YouTube] yt-dlp binary downloaded successfully.');
      return new YTDlpWrap(ytDlpBinaryPath);
    })();
  }

  ytDlpWrapInstance = await ytDlpInitPromise;
  return ytDlpWrapInstance;
}

const { fetchTranscript } = require('youtube-transcript-plus');// Library to fetch YouTube captions
const he = require('he');

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

async function getVideoMetadata(url) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");
  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let metadata = null;
  let duration = 0;

  // PRIMARY: YouTube Data API
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        duration = parseIsoDuration(item.contentDetails.duration);
        metadata = {
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          channelName: item.snippet.channelTitle,
          duration: duration,
          isLive: item.snippet.liveBroadcastContent !== 'none'
        };
        console.log(`[YouTube] Fetched metadata via YouTube API for ${videoId}`);
      } else {
        console.warn(`[YouTube] API returned no items for ${videoId}`);
      }
    } catch (err) {
      console.warn(`[YouTube] API fetch failed: ${err.message}`);
    }
  }

  // FALLBACK: yt-dlp (without Chrome cookies — Chrome is not available on servers)
  if (!metadata) {
    console.log(`[YouTube] Falling back to yt-dlp metadata for ${videoId}`);
    const wrap = await getYtDlp();

    try {
      const args = [cleanUrl, '--dump-json'];
      const output = await wrap.execPromise(args);
      const outputJson = JSON.parse(output);

      duration = outputJson.duration || 0;
      metadata = {
        title: outputJson.title,
        thumbnail: outputJson.thumbnail,
        channelName: outputJson.uploader,
        duration: duration,
        isLive: outputJson.is_live || false
      };
    } catch (err) {
      console.error(`[YouTube] yt-dlp metadata fallback failed: ${err.message}`);
      throw new Error(`Unable to fetch video metadata. Please check the URL and try again.`);
    }
  }

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
    title: metadata.title,
    thumbnail: metadata.thumbnail,
    duration: metadata.duration,
    durationFormatted: format(metadata.duration),
    channelName: metadata.channelName,
    isLive: metadata.isLive
  };
}

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
      console.log(`[YouTube] Caption array empty or invalid for video: ${videoId}. Proceeding to fallback.`);
      return null;
    }
  } catch (err) {
    console.log(`[YouTube] Caption fetch failed for video ${videoId}: ${err.message}. Proceeding to fallback.`);
    return null;
  }
}

async function downloadYouTubeAudio(url, videoIdParam) {
  const videoId = videoIdParam || extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");
  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const tempDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const outputPath = path.join(tempDir, `${videoId}-${uuidv4()}.mp3`);

  return new Promise(async (resolve, reject) => {
    const wrap = await getYtDlp();

    try {
      console.log(`[YouTube] Starting audio download: ${videoId}`);

      const args = [
        cleanUrl,
        '-x',
        '--audio-format', 'mp3',
        '--js-runtimes', 'node'
      ];

      const stream = wrap.execStream(args);
      const writeStream = fs.createWriteStream(outputPath);

      stream.pipe(writeStream);

      writeStream.on('finish', () => {
        console.log(`[YouTube] Audio download complete: ${outputPath}`);
        resolve({ filePath: outputPath, mimetype: 'audio/mp3' });
      });

      writeStream.on('error', (err) => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(err);
      });

      stream.on('error', (err) => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(err);
      });
    } catch (err) {
      console.error(`[YouTube] Failed to download audio.`, err.message);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      reject(err);
    }
  });
}

module.exports = {
  extractVideoId,
  isValidYouTubeUrl,
  getVideoMetadata,
  getYouTubeTranscript,
  downloadYouTubeAudio
};
