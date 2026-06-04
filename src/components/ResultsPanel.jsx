import { useState } from 'react';

function CaptionCard({ caption, index }) {
  const [copied, setCopied] = useState(false);

  const toneColors = {
    heartfelt: 'tone-heartfelt',
    witty: 'tone-witty',
    poetic: 'tone-poetic',
  };

  const toneEmojis = {
    heartfelt: '💛',
    witty: '😄',
    poetic: '🌸',
  };

  const copy = async () => {
    await navigator.clipboard.writeText(caption.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`caption-card ${toneColors[caption.tone] || ''}`}>
      <div className="caption-header">
        <span className="tone-label">
          {toneEmojis[caption.tone] || '✨'} {caption.tone}
        </span>
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
          {copied ? (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="caption-text">{caption.text}</p>
    </div>
  );
}

function SongCard({ song, index }) {
  const NOTE_COLORS = ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'];
  const color = NOTE_COLORS[index % NOTE_COLORS.length];

  return (
    <div className="song-card">
      <div className="song-num" style={{ background: color }}>
        {index + 1}
      </div>
      <div className="song-info">
        <p className="song-title">{song.title}</p>
        <p className="song-artist">{song.artist}</p>
        <p className="song-reason">{song.reason}</p>
      </div>
      <div className="song-note">
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
    </div>
  );
}

export default function ResultsPanel({ results, images, onReanalyze, loading }) {
  const { selectedIndices, captions, songs } = results;
  const selectedImages = selectedIndices.map((idx) => images[idx]).filter(Boolean);

  return (
    <div className="results-panel">
      <div className="results-section">
        <div className="results-section-header">
          <h2>
            <span className="gradient-text">Best {selectedImages.length} Photos</span>
          </h2>
          <p>AI picked these for your carousel — scores shown in gallery above</p>
        </div>
        <div className="selected-strip">
          {selectedImages.map((img, pos) => (
            <div key={img.id} className="strip-item">
              <img src={img.dataUrl} alt={img.name} />
              <span className="strip-pos">{pos + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="results-section">
        <div className="results-section-header">
          <h2>
            <span className="gradient-text">Caption Suggestions</span>
          </h2>
          <p>Three different tones — pick your favourite or mix and match</p>
        </div>
        <div className="captions-list">
          {captions.map((caption, i) => (
            <CaptionCard key={i} caption={caption} index={i} />
          ))}
        </div>
      </div>

      <div className="results-section">
        <div className="results-section-header">
          <h2>
            <span className="gradient-text">Song Picks</span>
          </h2>
          <p>Music that matches your post's vibe</p>
        </div>
        <div className="songs-list">
          {songs.map((song, i) => (
            <SongCard key={i} song={song} index={i} />
          ))}
        </div>
      </div>

      <div className="results-footer">
        <button
          className="btn btn-outline"
          onClick={onReanalyze}
          disabled={loading}
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Re-analyze with Different Results
        </button>
      </div>
    </div>
  );
}
