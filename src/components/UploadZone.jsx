import { useRef, useState, useCallback } from 'react';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export default function UploadZone({ onAddImages, hasImages }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFiles = useCallback(
    (fileList) => {
      const valid = Array.from(fileList).filter((f) => {
        // browsers may not report a HEIC mime type, so also check extension
        const ext = f.name.split('.').pop().toLowerCase();
        return ACCEPTED.includes(f.type) || ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext);
      });
      if (valid.length) onAddImages(valid);
    },
    [onAddImages]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);

  return (
    <div
      className={`upload-zone ${dragging ? 'dragging' : ''} ${hasImages ? 'compact' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      aria-label="Upload photos"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => processFiles(e.target.files)}
      />

      <div className="upload-icon">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="24" fill="url(#uploadGrad)" opacity="0.15" />
          <path
            d="M24 14v14M17 21l7-7 7 7"
            stroke="url(#uploadGrad2)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 34h20"
            stroke="url(#uploadGrad2)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="uploadGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f09433" />
              <stop offset="1" stopColor="#bc1888" />
            </linearGradient>
            <linearGradient id="uploadGrad2" x1="14" y1="14" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f09433" />
              <stop offset="1" stopColor="#bc1888" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="upload-text">
        {hasImages ? (
          <>
            <strong>Add more photos</strong>
            <span>drag & drop or click to browse</span>
          </>
        ) : (
          <>
            <strong>Drop your photos here</strong>
            <span>or click to browse — upload as many as you like</span>
            <span className="upload-sub">JPG, PNG, WEBP, HEIC supported</span>
          </>
        )}
      </div>
    </div>
  );
}
