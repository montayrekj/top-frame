export default function LoadingOverlay({ step, total }) {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-icon">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" stroke="url(#spinGrad)" strokeWidth="4" strokeLinecap="round" strokeDasharray="60 180" className="spin-ring" />
            <rect x="16" y="16" width="48" height="48" rx="10" stroke="url(#spinGrad2)" strokeWidth="3" />
            <circle cx="40" cy="40" r="13" stroke="url(#spinGrad2)" strokeWidth="3" />
            <circle cx="52" cy="28" r="4" fill="url(#spinGrad2)" />
            <defs>
              <linearGradient id="spinGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f09433" />
                <stop offset="1" stopColor="#bc1888" />
              </linearGradient>
              <linearGradient id="spinGrad2" x1="16" y1="16" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f09433" />
                <stop offset="1" stopColor="#bc1888" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h3>Curating your post…</h3>
        <p className="loading-step">{step}</p>

        {total && (
          <p className="loading-total">
            Analyzing {total} photo{total !== 1 ? 's' : ''}
          </p>
        )}

        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}
