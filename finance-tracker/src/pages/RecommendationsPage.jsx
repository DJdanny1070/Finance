import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { assetService } from '../services/assetService'
import { liabilityService } from '../services/liabilityService'
import { incomeService } from '../services/incomeService'
import { expenseService } from '../services/expenseService'
import { budgetService } from '../services/budgetService'
import { goalService } from '../services/goalService'
import { netWorthService } from '../services/netWorthService'
import { getCurrentMonth, getCurrentYear } from '../utils/dateHelpers'
import { generateRecommendations, calculateHealthScore, calculateSavingsRate } from '../utils/calculations'

export default function RecommendationsPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState([])
  const [healthScore, setHealthScore] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const m = getCurrentMonth(), y = getCurrentYear()
      const [assets, liabilities, monthlyIncome, monthlyExpenses, budgets, goals, nwHistory, catTotals] = await Promise.all([
        assetService.getAll(user.id),
        liabilityService.getAll(user.id),
        incomeService.getMonthlyTotal(user.id, m, y),
        expenseService.getMonthlyTotal(user.id, m, y),
        budgetService.getMonthlyBudgets(user.id, m, y),
        goalService.getAll(user.id),
        netWorthService.getAllHistory(user.id),
        expenseService.getCategoryTotals(user.id, m, y),
      ])
      const totalAssets = assets.reduce((s, a) => s + Number(a.current_value), 0)
      const totalLiabilities = liabilities.reduce((s, l) => s + Number(l.remaining_amount), 0)
      const totalEMI = liabilities.reduce((s, l) => s + Number(l.monthly_emi || 0), 0)
      const bankAccounts = assets.filter(a => a.category === 'bank_account').reduce((s, a) => s + Number(a.current_value), 0)
      const budgetMap = {}
      budgets.forEach(b => { budgetMap[b.category] = Number(b.amount) })
      const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses)

      const hs = calculateHealthScore({
        monthlyIncome, monthlyExpenses, totalAssets, totalLiabilities,
        monthlyEMI: totalEMI, emergencyFund: bankAccounts,
        monthlyEssentialExpenses: profile?.monthly_essential_expenses || 0,
        emergencyFundMonths: profile?.emergency_fund_months || 6,
        budgets: budgetMap, categorySpending: catTotals, goals, netWorthSnapshots: nwHistory,
      })

      const recs = generateRecommendations({
        monthlyIncome, monthlyExpenses, totalAssets, totalLiabilities,
        monthlyEMI: totalEMI, savingsRate, emergencyFund: bankAccounts,
        monthlyEssentialExpenses: profile?.monthly_essential_expenses || 0,
        emergencyFundMonths: profile?.emergency_fund_months || 6,
        categorySpending: catTotals, budgets: budgetMap, goals, netWorthSnapshots: nwHistory,
      })

      setHealthScore(hs)
      setRecommendations(recs)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [user, profile])

  useEffect(() => { load() }, [load])

  const getIcon = (type) => ({ warning: '⚠️', success: '✅', info: '💡', alert: '🚨' }[type] || '💡')

  if (loading) return <div className="app-loading" style={{ minHeight: '60vh' }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Recommendations</h1><p className="page-subtitle">Personalised financial advice based on your data</p></div>
        <button className="btn btn--outline" onClick={load}>↻ Refresh</button>
      </div>

      {healthScore && (
        <div className="health-score-card" style={{ marginBottom: '1.5rem' }}>
          <div className="health-score-circle">
            <span className="health-score-number">{healthScore.total}</span>
            <span className="health-score-max">/100</span>
          </div>
          <div className="health-score-text">
            <h3>Financial Health Score</h3>
            <p>Based on your savings rate, debt levels, emergency fund, budget adherence, and goal progress</p>
            <div className="health-score-breakdown">
              <span className="health-score-item">Savings Rate {healthScore.savings_rate}/25</span>
              <span className="health-score-item">Debt {healthScore.debt}/20</span>
              <span className="health-score-item">Emergency Fund {healthScore.emergency_fund}/20</span>
              <span className="health-score-item">NW Trend {healthScore.net_worth_trend}/15</span>
              <span className="health-score-item">Budgets {healthScore.budget_adherence}/10</span>
              <span className="health-score-item">Goals {healthScore.goal_progress}/10</span>
            </div>
          </div>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3>You're in great financial shape!</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Add more financial data to receive personalised recommendations.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {recommendations.map((r, i) => (
            <div key={i} className={`rec-card rec-card--${r.type}`}>
              <div className="rec-icon">{getIcon(r.type)}</div>
              <div>
                <div className="rec-title">{r.title}</div>
                <div className="rec-msg">{r.message}</div>
                <span className={`badge badge--${r.priority === 'high' ? 'danger' : r.priority === 'medium' ? 'warning' : 'default'}`} style={{ marginTop: '0.5rem' }}>
                  {r.priority} priority
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score Explanation */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: '1rem' }}>How is your score calculated?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
          {[
            { label: 'Savings Rate (25 pts)', detail: '% of income you save each month. Target: 20%+' },
            { label: 'Debt-to-Income Ratio (20 pts)', detail: 'EMI payments vs monthly income. Target: below 30%' },
            { label: 'Emergency Fund (20 pts)', detail: `Liquid savings vs your ${profile?.emergency_fund_months || 6}-month target` },
            { label: 'Net Worth Trend (15 pts)', detail: 'Whether your net worth is growing month over month' },
            { label: 'Budget Adherence (10 pts)', detail: 'Percentage of budget categories you stayed within' },
            { label: 'Goal Progress (10 pts)', detail: 'Average completion percentage of your active financial goals' },
          ].map(row => (
            <div key={row.label} className="stat-row">
              <span className="stat-label" style={{ fontWeight: 600 }}>{row.label}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right', maxWidth: '60%' }}>{row.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
