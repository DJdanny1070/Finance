import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, DollarSign, Check } from 'lucide-react'
import { authService } from '../../services/authService'
import { profileService } from '../../services/profileService'
import { validatePassword } from '../../utils/validators'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const passwordChecks = validatePassword(form.password)

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (passwordChecks.length > 0) e.password = 'Password does not meet requirements'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = await authService.signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
      })
      if (data.user) {
        await profileService.upsertProfile(data.user.id, {
          full_name: form.fullName,
          onboarding_completed: false,
        })
      }
      toast.success("Account created! Let's set up your profile.")
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const ALL_REQS = ['At least 8 characters', 'One uppercase letter', 'One number']

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-logo">
          <DollarSign size={32} />
          <span>FinanceFlow</span>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start tracking your finances today</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className={`form-input ${errors.fullName ? 'form-input--error' : ''}`}
              placeholder="John Doe"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
            />
            {errors.fullName && <span className="form-error">{errors.fullName}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <div className="input-password-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                placeholder="Create a strong password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.password && (
              <div className="password-checks">
                {ALL_REQS.map(req => (
                  <div key={req} className={`password-check ${!passwordChecks.includes(req) ? 'check--pass' : 'check--fail'}`}>
                    <Check size={12} />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-field">
            <label className="form-label">Confirm Password</label>
            <div className="input-password-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`form-input ${errors.confirmPassword ? 'form-input--error' : ''}`}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
