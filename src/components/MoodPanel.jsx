const MOOD_PRESETS = [
  { label: 'Summer Vibes', emoji: '☀️' },
  { label: 'Golden Hour', emoji: '🌅' },
  { label: 'Travel Adventure', emoji: '✈️' },
  { label: 'Night Out', emoji: '🌙' },
  { label: 'Food & Drinks', emoji: '🍹' },
  { label: 'Cozy & Warm', emoji: '🍂' },
  { label: 'Fitness & Health', emoji: '💪' },
  { label: 'Friends & Fun', emoji: '🎉' },
  { label: 'Nature & Outdoors', emoji: '🌿' },
  { label: 'Aesthetic & Minimal', emoji: '🤍' },
];

export default function MoodPanel({ mood, setMood, targetCount, setTargetCount, imageCount }) {
  const maxCount = Math.min(imageCount, 20);

  return (
    <div className="mood-panel">
      <div className="mood-header">
        <div className="mood-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="url(#moodGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
            <defs>
              <linearGradient id="moodGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f09433" />
                <stop offset="1" stopColor="#bc1888" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h2>Describe your vibe</h2>
          <p>Help AI understand the feeling you want to capture</p>
        </div>
      </div>

      <div className="mood-presets">
        {MOOD_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className={`preset-chip ${mood === preset.label ? 'active' : ''}`}
            onClick={() => setMood(mood === preset.label ? '' : preset.label)}
          >
            {preset.emoji} {preset.label}
          </button>
        ))}
      </div>

      <textarea
        className="mood-textarea"
        placeholder="Or describe it in your own words… e.g. 'Soft, dreamy summer afternoon at the beach with friends, golden light and candid moments'"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        rows={3}
      />

      <div className="count-control">
        <label>
          <span>Photos to select</span>
          <span className="count-value">{targetCount}</span>
        </label>
        <input
          type="range"
          min={1}
          max={maxCount}
          value={targetCount}
          onChange={(e) => setTargetCount(parseInt(e.target.value))}
          className="count-slider"
        />
        <div className="count-hints">
          <span>1</span>
          <span>20 (max for IG)</span>
        </div>
        {imageCount <= targetCount && (
          <p className="count-hint">
            Upload more than {targetCount} photos so AI has room to pick the best ones.
          </p>
        )}
      </div>
    </div>
  );
}
