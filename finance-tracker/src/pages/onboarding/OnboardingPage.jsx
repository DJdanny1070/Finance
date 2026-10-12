import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { profileService } from '../../services/profileService'
import { incomeService } from '../../services/incomeService'
import { DollarSign, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { EMPLOYMENT_TYPES, INCOME_TYPES } from '../../utils/constants'
import toast from 'react-hot-toast'

const STEPS = ['Personal Details', 'Income Setup', 'Emergency Fund', 'Complete']

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [personal, setPersonal] = useState({
    full_name: '', age: '', occupation: '', employment_type: '', city: ''
  })
  const [income, setIncome] = useState({
    type: 'salary', name: 'Primary Income', amount: '', frequency: 'monthly'
  })
  const [prefs, setPrefs] = useState({
    monthly_essential_expenses: '', emergency_fund_months: '6'
  })

  const handleFinish = async () => {
    setLoading(true)
    try {
      await profileService.upsertProfile(user.id, {
        full_name: personal.full_name,
        age: personal.age ? parseInt(personal.age) : null,
        occupation: personal.occupation,
        employment_type: personal.employment_type,
        city: personal.city,
        monthly_essential_expenses: prefs.monthly_essential_expenses ? parseFloat(prefs.monthly_essential_expenses) : 0,
        emergency_fund_months: parseInt(prefs.emergency_fund_months) || 6,
        onboarding_completed: true,
      })

      if (income.amount && parseFloat(income.amount) > 0) {
        await incomeService.createSource(user.id, {
          name: income.name,
          type: income.type,
          amount: parseFloat(income.amount),
          frequency: income.frequency,
        })
        const monthlyAmt =
          income.frequency === 'yearly' ? parseFloat(income.amount) / 12
          : income.frequency === 'quarterly' ? parseFloat(income.amount) / 3
          : parseFloat(income.amount)

        await incomeService.createTransaction(user.id, {
          amount: monthlyAmt,
          date: new Date().toISOString().split('T')[0],
          source_name: income.name,
          source_type: income.type,
          description: `Initial income setup — ${income.name}`,
          is_recurring: true,
          frequency: income.frequency,
        })
      }

      await refreshProfile()
      toast.success('Profile setup complete! Welcome to FinanceFlow!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Setup failed, please try again')
    } finally {
      setLoading(false)
    }
  }

  const emergencyTarget = prefs.monthly_essential_expenses
    ? parseFloat(prefs.monthly_essential_expenses) * parseInt(prefs.emergency_fund_months)
    : 0

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-logo">
          <DollarSign size={28} />
          <span>FinanceFlow</span>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          {STEPS.map((s, i) => (
            <div key={s} className={`step-dot ${i <= step ? 'step-dot--active' : ''}`}>
              {i < step ? <Check size={12} /> : <span>{i + 1}</span>}
            </div>
          ))}
        </div>
        <div className="step-label">Step {step + 1} of {STEPS.length} — {STEPS[step]}</div>

        {/* Step 0: Personal */}
        {step === 0 && (
          <div className="onboarding-step">
            <h2>Tell us about yourself</h2>
            <p className="step-desc">This helps us personalise your financial dashboard</p>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={personal.full_name} onChange={e => setPersonal({ ...personal, full_name: e.target.value })} placeholder="Your full name" />
              </div>
              <div className="form-field">
                <label className="form-label">Age</label>
                <input type="number" className="form-input" value={personal.age} onChange={e => setPersonal({ ...personal, age: e.target.value })} placeholder="25" min="1" max="120" />
              </div>
              <div className="form-field">
                <label className="form-label">Occupation</label>
                <input className="form-input" value={personal.occupation} onChange={e => setPersonal({ ...personal, occupation: e.target.value })} placeholder="Software Engineer" />
              </div>
              <div className="form-field">
                <label className="form-label">Employment Type</label>
                <select className="form-select" value={personal.employment_type} onChange={e => setPersonal({ ...personal, employment_type: e.target.value })}>
                  <option value="">Select type</option>
                  {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">City / Location</label>
                <input className="form-input" value={personal.city} onChange={e => setPersonal({ ...personal, city: e.target.value })} placeholder="Mumbai" />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Income */}
        {step === 1 && (
          <div className="onboarding-step">
            <h2>Your primary income</h2>
            <p className="step-desc">You can add more income sources later from the Income page</p>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Income Type</label>
                <select className="form-select" value={income.type} onChange={e => setIncome({ ...income, type: e.target.value })}>
                  {INCOME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Income Name</label>
                <input className="form-input" value={income.name} onChange={e => setIncome({ ...income, name: e.target.value })} placeholder="Primary Salary" />
              </div>
              <div className="form-field">
                <label className="form-label">Amount (₹)</label>
                <input type="number" className="form-input" value={income.amount} onChange={e => setIncome({ ...income, amount: e.target.value })} placeholder="50000" min="0" />
              </div>
              <div className="form-field">
                <label className="form-label">Frequency</label>
                <select className="form-select" value={income.frequency} onChange={e => setIncome({ ...income, frequency: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            <p className="step-desc" style={{ marginTop: '0.5rem' }}>You can skip this step if you prefer to add income later.</p>
          </div>
        )}

        {/* Step 2: Emergency Fund */}
        {step === 2 && (
          <div className="onboarding-step">
            <h2>Emergency fund settings</h2>
            <p className="step-desc">We'll use this to calculate your emergency fund target</p>
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Monthly Essential Expenses (₹)</label>
                <input type="number" className="form-input" value={prefs.monthly_essential_expenses} onChange={e => setPrefs({ ...prefs, monthly_essential_expenses: e.target.value })} placeholder="30000" min="0" />
                <small className="form-hint">Include rent + groceries + utilities + essential bills</small>
              </div>
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Emergency Fund Target</label>
                <select className="form-select" value={prefs.emergency_fund_months} onChange={e => setPrefs({ ...prefs, emergency_fund_months: e.target.value })}>
                  <option value="3">3 months</option>
                  <option value="6">6 months (recommended)</option>
                  <option value="9">9 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
              {emergencyTarget > 0 && (
                <div className="info-box" style={{ gridColumn: '1/-1' }}>
                  💡 Recommended emergency fund: <strong>₹{emergencyTarget.toLocaleString('en-IN')}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="onboarding-step onboarding-complete">
            <div className="complete-icon">✅</div>
            <h2>You're all set!</h2>
            <p>Your FinanceFlow account is ready. Start by adding your assets, liabilities, and daily expenses to get an accurate picture of your finances.</p>
            <ul className="setup-checklist">
              <li>✅ Account created</li>
              <li>✅ Profile configured</li>
              <li>✅ Income setup {income.amount ? 'done' : 'skipped'}</li>
              <li>⏳ Add your assets (bank accounts, property, gold…)</li>
              <li>⏳ Add your liabilities (loans, EMIs…)</li>
              <li>⏳ Track your daily expenses</li>
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div className="onboarding-nav">
          {step > 0 && (
            <button className="btn btn--outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < STEPS.length - 2 && (
            <button
              className="btn btn--primary"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !personal.full_name.trim()}
            >
              Next <ChevronRight size={16} />
            </button>
          )}
          {step === STEPS.length - 2 && (
            <button className="btn btn--primary" onClick={() => setStep(s => s + 1)}>
              Continue <ChevronRight size={16} />
            </button>
          )}
          {step === STEPS.length - 1 && (
            <button className="btn btn--primary" onClick={handleFinish} disabled={loading}>
              {loading ? 'Setting up...' : 'Go to Dashboard 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
