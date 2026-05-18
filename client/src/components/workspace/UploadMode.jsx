import React from 'react';
import { ArrowUpFromLine } from 'lucide-react';

export default function UploadMode({ handleAudioUpload }) {
  return (
    <div className="recording-card">
      <div className="upload-button-wrapper">
        <label className="upload-button">
          <ArrowUpFromLine size={16} style={{ marginRight: '8px' }} /> Upload audio or video file
          <input
            type="file"
            accept="audio/*,video/mp4,video/webm,video/quicktime,video/x-matroska"
            onChange={handleAudioUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      <p className="status-text" style={{ marginTop: '12px', fontSize: '0.85rem' }}>
        Supports audio (mp3, wav, m4a, webm) and video (mp4, webm, mov, mkv)
      </p>
    </div>
  );
}
