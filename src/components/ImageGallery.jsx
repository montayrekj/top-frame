import { useState } from 'react';

export default function ImageGallery({ images, onRemove, selectedIndices, scores }) {
  const [lightbox, setLightbox] = useState(null);

  const getScore = (idx) => scores?.find((s) => s.index === idx)?.score;
  const isSelected = (idx) => selectedIndices?.includes(idx);

  return (
    <>
      <div className="gallery">
        {images.map((img, idx) => {
          const selected = isSelected(idx);
          const score = getScore(idx);
          return (
            <div
              key={img.id}
              className={`gallery-item ${selected ? 'selected' : ''} ${selectedIndices && !selected ? 'dimmed' : ''}`}
            >
              <img
                src={img.dataUrl}
                alt={img.name}
                onClick={() => setLightbox(img.dataUrl)}
                draggable={false}
              />

              {score !== undefined && (
                <div className={`score-badge ${score >= 8 ? 'score-high' : score >= 6 ? 'score-mid' : 'score-low'}`}>
                  {score.toFixed(1)}
                </div>
              )}

              {selected && (
                <div className="selected-badge">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(img.id);
                }}
                aria-label={`Remove ${img.name}`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="img-name">{img.name}</div>
            </div>
          );
        })}
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <img src={lightbox} alt="Preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
