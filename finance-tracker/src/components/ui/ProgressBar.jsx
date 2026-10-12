export default function ProgressBar({ value, max = 100, showPercent = true, label, size = 'md' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const barColor = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--primary)'

  return (
    <div className={`progress-wrap progress-wrap--${size}`}>
      {label && (
        <div className="progress-header">
          <span className="progress-label">{label}</span>
          {showPercent && <span className="progress-pct">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  )
}
