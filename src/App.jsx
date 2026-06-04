import { useState, useCallback, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import ImageGallery from './components/ImageGallery';
import MoodPanel from './components/MoodPanel';
import ResultsPanel from './components/ResultsPanel';
import LoadingOverlay from './components/LoadingOverlay';

const MAX_SELECT = 20;

export default function App() {
  const [images, setImages] = useState([]);
  const [mood, setMood] = useState('');
  const [targetCount, setTargetCount] = useState(MAX_SELECT);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (images.length > 0) {
      setTargetCount((prev) => Math.min(prev, images.length, MAX_SELECT));
    }
  }, [images.length]);

  const resizeImageToDataUrl = (file) =>
    new Promise((resolve) => {
      const MAX_DIM = 1024;
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = url;
    });

  const addImages = useCallback(async (files) => {
    const newEntries = await Promise.all(
      files.map(async (file) => {
        const dataUrl = await resizeImageToDataUrl(file);
        return {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          dataUrl,
          name: file.name,
        };
      })
    );
    setImages((prev) => [...prev, ...newEntries]);
    setResults(null);
    setError('');
  }, []);

  const removeImage = useCallback((id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setResults(null);
  }, []);

  const clearAll = useCallback(() => {
    setImages([]);
    setResults(null);
    setError('');
  }, []);

  const handleAnalyze = async () => {
    if (images.length < 1) return;
    setError('');
    setResults(null);
    setLoading(true);
    setLoadingStep('Uploading photos…');

    try {
      const formData = new FormData();

      await Promise.all(
        images.map(async (img, idx) => {
          const res = await fetch(img.dataUrl);
          const blob = await res.blob();
          formData.append('images', blob, img.name || `photo-${idx}.jpg`);
        })
      );

      formData.append('mood', mood);
      formData.append('count', targetCount);
      formData.append('provider', provider);

      const providerLabel = provider === 'ollama' ? 'Ollama (local)' : 'Claude Haiku';
      setLoadingStep(`Analyzing ${images.length} photos with ${providerLabel}…`);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${response.status}`);
      }

      setLoadingStep('Generating captions & song picks…');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const canAnalyze = images.length >= 1 && !loading;
  const needsMorePhotos = images.length > 0 && images.length <= targetCount;

  return (
    <div className="app">
      {loading && <LoadingOverlay step={loadingStep} total={images.length} />}

      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="14" fill="url(#logoGrad)" />
              <rect x="12" y="12" width="40" height="40" rx="8" stroke="white" strokeWidth="3" />
              <circle cx="32" cy="32" r="10" stroke="white" strokeWidth="3" />
              <circle cx="44" cy="20" r="3" fill="white" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f09433" />
                  <stop offset="0.25" stopColor="#e6683c" />
                  <stop offset="0.5" stopColor="#dc2743" />
                  <stop offset="0.75" stopColor="#cc2366" />
                  <stop offset="1" stopColor="#bc1888" />
                </linearGradient>
              </defs>
            </svg>
            <div>
              <h1>TopFrame</h1>
              <p>Instagram Post Curator</p>
            </div>
          </div>

          <div className="header-right">
            <div className="provider-toggle">
              <button
                className={`provider-option ${provider === 'anthropic' ? 'active' : ''}`}
                onClick={() => setProvider('anthropic')}
                title="Claude Haiku (cloud)"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                Claude Haiku
              </button>
              <button
                className={`provider-option ${provider === 'ollama' ? 'active' : ''}`}
                onClick={() => setProvider('ollama')}
                title="Ollama local model"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd"/></svg>
                Ollama (local)
              </button>
            </div>

            <button
              className="theme-toggle"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {images.length > 0 && (
              <div className="header-stats">
                <span className="stat-badge">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/></svg>
                  {images.length} uploaded
                </span>
                {results && (
                  <span className="stat-badge selected">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {results.selectedIndices.length} selected
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="section">
          <UploadZone onAddImages={addImages} hasImages={images.length > 0} />
        </section>

        {images.length > 0 && (
          <>
            <section className="section">
              <MoodPanel
                mood={mood}
                setMood={setMood}
                targetCount={targetCount}
                setTargetCount={setTargetCount}
                imageCount={images.length}
              />
            </section>

            <section className="section">
              <div className="section-header">
                <h2>Your Photos</h2>
                <div className="section-actions">
                  <button className="btn btn-ghost btn-sm" onClick={clearAll}>
                    Clear all
                  </button>
                </div>
              </div>
              <ImageGallery
                images={images}
                onRemove={removeImage}
                selectedIndices={results?.selectedIndices}
                scores={results?.scores}
              />
            </section>

            {!results && (
              <section className="section cta-section">
                {needsMorePhotos && (
                  <p className="hint">
                    Tip: upload more than {targetCount} photos so AI has more to choose from!
                  </p>
                )}
                {error && <p className="error-msg">{error}</p>}
                <button
                  className="btn btn-primary btn-lg analyze-btn"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Pick Best {targetCount} &amp; Generate Post
                </button>
              </section>
            )}

            {results && (
              <section className="section">
                {error && <p className="error-msg">{error}</p>}
                <ResultsPanel
                  results={results}
                  images={images}
                  onReanalyze={handleAnalyze}
                  loading={loading}
                />
              </section>
            )}
          </>
        )}

        {images.length === 0 && (
          <div className="empty-hero">
            <div className="hero-grid">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="hero-placeholder" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <h2>Drop your photos above to get started</h2>
            <p>Upload 20+ images, describe your vibe, and let AI curate your perfect Instagram post.</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>TopFrame — powered by {provider === 'ollama' ? 'Ollama (qwen2.5vl:7b)' : 'Claude Haiku'}</p>
      </footer>
    </div>
  );
}
