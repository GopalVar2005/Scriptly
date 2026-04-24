export function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

export async function fetchCaptionsClientSide(videoId) {
  // Step 1: POST to YouTube's internal API
  const playerResponse = await fetch('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-YouTube-Client-Name': '3',
      'X-YouTube-Client-Version': '17.31.35'
    },
    body: JSON.stringify({
      videoId: videoId,
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '17.31.35',
          androidSdkVersion: 30,
          hl: 'en',
          gl: 'US'
        }
      }
    })
  });

  if (!playerResponse.ok) {
    throw new Error("Could not reach YouTube. Check your connection.");
  }

  const playerData = await playerResponse.json();
  const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error("No captions found for this video. Try a video with the CC button visible.");
  }

  // Step 3: Pick the best caption track
  let track = captionTracks.find(t => t.languageCode === 'en' && !t.kind?.includes('asr'));
  if (!track) {
    track = captionTracks.find(t => t.languageCode === 'en');
  }
  if (!track) {
    track = captionTracks[0];
  }

  // Step 4: Fetch the caption XML
  const captionResponse = await fetch(track.baseUrl);
  if (!captionResponse.ok) {
    throw new Error("Failed to download caption data.");
  }

  const xmlText = await captionResponse.text();

  // Step 5: Parse the XML into plain text using DOMParser
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const textNodes = xmlDoc.querySelectorAll('text');

  const segments = [];
  const tempDiv = document.createElement('div');

  for (const node of textNodes) {
    tempDiv.innerHTML = node.textContent;
    segments.push(tempDiv.textContent);
  }

  return segments.join(' ');
}
