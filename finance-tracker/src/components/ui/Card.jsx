export default function Card({ children, className = '', onClick }) {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}

export function SummaryCard({ title, value, subtitle, icon, trend, color = 'blue' }) {
  return (
    <div className={`summary-card summary-card--${color}`}>
      <div className="summary-card-header">
        <div className="summary-card-icon">{icon}</div>
        <div className="summary-card-trend">{trend}</div>
      </div>
      <div className="summary-card-value">{value}</div>
      <div className="summary-card-title">{title}</div>
      {subtitle && <div className="summary-card-subtitle">{subtitle}</div>}
    </div>
  )
}
