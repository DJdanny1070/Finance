import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, ArrowLeft, Mail } from 'lucide-react'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    setLoading(true)
    setError('')
    try {
      await authService.resetPassword(email)
      setSent(true)
      toast.success('Password reset email sent!')
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <DollarSign size={32} />
          <span>FinanceFlow</span>
        </div>

        {sent ? (
          <div className="auth-success">
            <Mail size={48} className="success-icon" />
            <h2>Check your inbox</h2>
            <p>We've sent a password reset link to <strong>{email}</strong></p>
            <Link to="/login" className="btn btn--primary btn--full" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">Enter your email and we'll send a reset link</p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-field">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  className={`form-input ${error ? 'form-input--error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                {error && <span className="form-error">{error}</span>}
              </div>
              <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className="auth-switch">
              <Link to="/login" className="auth-link"><ArrowLeft size={14} /> Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
