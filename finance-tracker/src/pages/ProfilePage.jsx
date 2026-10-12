import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { profileService } from '../services/profileService'
import { useTheme } from '../context/ThemeContext'
import { EMPLOYMENT_TYPES } from '../utils/constants'
import { Sun, Moon, User, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [form, setForm] = useState({
    full_name: '', age: '', occupation: '', employment_type: '',
    city: '', currency: 'INR', monthly_essential_expenses: '', emergency_fund_months: '6'
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('profile')

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        age: profile.age || '',
        occupation: profile.occupation || '',
        employment_type: profile.employment_type || '',
        city: profile.city || '',
        currency: profile.currency || 'INR',
        monthly_essential_expenses: profile.monthly_essential_expenses || '',
        emergency_fund_months: profile.emergency_fund_months || '6',
      })
    }
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await profileService.updateProfile(user.id, {
        ...form,
        age: form.age ? parseInt(form.age) : null,
        monthly_essential_expenses: form.monthly_essential_expenses ? parseFloat(form.monthly_essential_expenses) : 0,
        emergency_fund_months: parseInt(form.emergency_fund_months) || 6,
      })
      await refreshProfile()
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Profile & Settings</h1><p className="page-subtitle">Manage your account and preferences</p></div>
      </div>

      <div className="tabs">
        {[
          { id: 'profile', label: 'Profile', icon: <User size={15} /> },
          { id: 'preferences', label: 'Preferences', icon: <Shield size={15} /> },
        ].map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'tab-btn--active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header"><span className="card-title">Personal Information</span></div>
          <form onSubmit={handleSave}>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" />
              </div>
              <div className="form-field">
                <label className="form-label">Age</label>
                <input type="number" className="form-input" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="25" min="1" max="120" />
              </div>
              <div className="form-field">
                <label className="form-label">Occupation</label>
                <input className="form-input" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} placeholder="Software Engineer" />
              </div>
              <div className="form-field">
                <label className="form-label">Employment Type</label>
                <select className="form-select" value={form.employment_type} onChange={e => setForm({ ...form, employment_type: e.target.value })}>
                  <option value="">Select type</option>
                  {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">City</label>
                <input className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" />
              </div>
              <div className="form-field">
                <label className="form-label">Currency</label>
                <select className="form-select" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Monthly Essential Expenses (₹)</label>
                <input type="number" className="form-input" value={form.monthly_essential_expenses} onChange={e => setForm({ ...form, monthly_essential_expenses: e.target.value })} placeholder="30000" />
                <small className="form-hint">Rent + groceries + utilities + essential bills</small>
              </div>
              <div className="form-field">
                <label className="form-label">Emergency Fund Target</label>
                <select className="form-select" value={form.emergency_fund_months} onChange={e => setForm({ ...form, emergency_fund_months: e.target.value })}>
                  <option value="3">3 months</option>
                  <option value="6">6 months (recommended)</option>
                  <option value="9">9 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'preferences' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="stat-row">
              <div>
                <div style={{ fontWeight: 700 }}>Display Theme</div>
                <small style={{ color: 'var(--text-muted)' }}>Switch between light and dark mode</small>
              </div>
              <button className="btn btn--outline" onClick={toggleTheme}>
                {theme === 'light' ? <><Moon size={16} /> Dark Mode</> : <><Sun size={16} /> Light Mode</>}
              </button>
            </div>
            <div className="stat-row">
              <div>
                <div style={{ fontWeight: 700 }}>Account Email</div>
                <small style={{ color: 'var(--text-muted)' }}>{user?.email}</small>
              </div>
              <span className="badge badge--success">Verified</span>
            </div>
            <div className="stat-row">
              <div>
                <div style={{ fontWeight: 700 }}>Data Security</div>
                <small style={{ color: 'var(--text-muted)' }}>Row Level Security is enabled. Your financial data is private and accessible only by you.</small>
              </div>
              <span className="badge badge--primary">🔒 Secure</span>
            </div>
            <div className="stat-row">
              <div>
                <div style={{ fontWeight: 700 }}>Default Currency</div>
                <small style={{ color: 'var(--text-muted)' }}>Currently set to: {profile?.currency || 'INR'}</small>
              </div>
              <span className="badge badge--info">{profile?.currency || 'INR'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
