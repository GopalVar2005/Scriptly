import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Simple client-side check — same patterns as the server's extractVideoId
function looksLikeYouTubeUrl(url) {
  return /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)[a-zA-Z0-9_-]{11}/.test(url);
}

export default function YouTubeMode({ 
  youtubeUrl, 
  setYoutubeUrl, 
  youtubeLoading, 
  youtubeLoadingPreview, 
  isProcessing, 
  youtubeMetadata, 
  youtubeError, 
  handleYouTubeProcess 
}) {
  const urlTrimmed = youtubeUrl.trim();
  const isValidUrl = looksLikeYouTubeUrl(urlTrimmed);
  const isLive = youtubeMetadata?.isLive;
  const isTooLong = youtubeMetadata?.tooLong;

  const canProcess = urlTrimmed && isValidUrl && !youtubeLoading && !isTooLong && !isLive && !youtubeLoadingPreview && !isProcessing;

  return (
    <div className="youtube-input-section">
      <p className="youtube-description">
        Paste a YouTube lecture or tutorial URL to generate a study summary.
      </p>
      <p className="youtube-guidelines">
        Works best with English audio and caption-enabled videos. Max duration: 45 minutes.
      </p>

      <div className="youtube-url-row">
        <input
          type="text"
          className="youtube-url-input"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={e => setYoutubeUrl(e.target.value)}
          disabled={youtubeLoading}
        />
        <button
          className="youtube-process-btn"
          onClick={handleYouTubeProcess}
          disabled={!canProcess}
        >
          {youtubeLoading ? 'Processing...' : 'Process'}
        </button>
      </div>

      {/* Client-side URL format hint */}
      {urlTrimmed && !isValidUrl && !youtubeLoadingPreview && (
        <p className="youtube-url-hint">Please enter a valid YouTube video URL.</p>
      )}

      {youtubeLoadingPreview && (
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading preview...</p>
      )}

      {youtubeMetadata && !youtubeLoadingPreview && (
        <div className="youtube-preview-card" style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
          {youtubeMetadata.thumbnail && (
            <img src={youtubeMetadata.thumbnail} alt="Thumbnail" style={{ maxHeight: '80px', borderRadius: '4px' }} />
          )}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{youtubeMetadata.title?.length > 60 ? youtubeMetadata.title.substring(0, 60) + '...' : youtubeMetadata.title}</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {youtubeMetadata.channelName} • {youtubeMetadata.durationFormatted}
            </p>
            {isTooLong && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#e63946', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Video exceeds maximum length of 45 minutes.
              </p>
            )}
            {isLive && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#e63946', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Live streams are not supported. Please use a recorded video.
              </p>
            )}
          </div>
        </div>
      )}

      {youtubeError && (
        <div className="youtube-error-container" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(230, 57, 70, 0.1)', border: '1px solid #e63946', borderRadius: '8px', color: '#e63946' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
            {typeof youtubeError === 'string' ? youtubeError : youtubeError.message}
          </p>
          {typeof youtubeError === 'object' && youtubeError.suggestions && (
            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
              {youtubeError.suggestions.map((suggestion, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
