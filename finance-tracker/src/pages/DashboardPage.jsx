import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatCompact, formatPercent } from '../utils/formatCurrency'
import { getCurrentMonth, getCurrentYear } from '../utils/dateHelpers'
import { calculateNetWorth, calculateSavingsRate, calculateHealthScore, generateRecommendations } from '../utils/calculations'
import { incomeService } from '../services/incomeService'
import { expenseService } from '../services/expenseService'
import { assetService } from '../services/assetService'
import { liabilityService } from '../services/liabilityService'
import { netWorthService } from '../services/netWorthService'
import { goalService } from '../services/goalService'
import { budgetService } from '../services/budgetService'
import { analyticsService } from '../services/analyticsService'
import { SummaryCard } from '../components/ui/Card'
import { TrendingUp, TrendingDown, Landmark, CreditCard, Wallet, PiggyBank, Activity, Lightbulb } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { EXPENSE_CATEGORIES } from '../utils/constants'
import { Link } from 'react-router-dom'
import ProgressBar from '../components/ui/ProgressBar'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    totalAssets: 0, totalLiabilities: 0, netWorth: 0,
    monthlyIncome: 0, monthlyExpenses: 0, monthlySavings: 0, savingsRate: 0,
    healthScore: null, netWorthHistory: [], monthlyComparison: [],
    categoryBreakdown: [], recentExpenses: [], recentIncome: [],
    budgets: [], goals: [], recommendations: [],
  })

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const m = getCurrentMonth(), y = getCurrentYear()
      const [assets, liabilities, monthlyIncome, monthlyExpenses, nwHistory, comparison, catBreakdown, goals, budgetsList, recentExp, recentInc] = await Promise.all([
        assetService.getAll(user.id),
        liabilityService.getAll(user.id),
        incomeService.getMonthlyTotal(user.id, m, y),
        expenseService.getMonthlyTotal(user.id, m, y),
        netWorthService.getHistory(user.id, 180),
        analyticsService.getMonthlyComparison(user.id, 6),
        analyticsService.getExpenseCategoryBreakdown(user.id, m, y),
        goalService.getAll(user.id),
        budgetService.getMonthlyBudgets(user.id, m, y),
        expenseService.getTransactions(user.id, {}),
        incomeService.getTransactions(user.id, {}),
      ])

      const totalAssets = assets.reduce((s, a) => s + Number(a.current_value), 0)
      const totalLiabilities = liabilities.reduce((s, l) => s + Number(l.remaining_amount), 0)
      const netWorth = calculateNetWorth(totalAssets, totalLiabilities)
      const monthlySavings = monthlyIncome - monthlyExpenses
      const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses)
      const totalMonthlyEMI = liabilities.reduce((s, l) => s + Number(l.monthly_emi || 0), 0)

      const categorySpending = {}
      catBreakdown.forEach(c => { categorySpending[c.category] = c.amount })
      const budgetMap = {}
      budgetsList.forEach(b => { budgetMap[b.category] = Number(b.amount) })

      const bankEF = assets.filter(a => a.category === 'bank_account').reduce((s, a) => s + Number(a.current_value), 0)

      const hs = calculateHealthScore({
        monthlyIncome, monthlyExpenses, totalAssets, totalLiabilities,
        monthlyEMI: totalMonthlyEMI,
        emergencyFund: bankEF,
        monthlyEssentialExpenses: profile?.monthly_essential_expenses || 0,
        emergencyFundMonths: profile?.emergency_fund_months || 6,
        budgets: budgetMap, categorySpending, goals, netWorthSnapshots: nwHistory,
      })

      const recs = generateRecommendations({
        monthlyIncome, monthlyExpenses, totalAssets, totalLiabilities,
        monthlyEMI: totalMonthlyEMI, savingsRate, emergencyFund: bankEF,
        monthlyEssentialExpenses: profile?.monthly_essential_expenses || 0,
        emergencyFundMonths: profile?.emergency_fund_months || 6,
        categorySpending, budgets: budgetMap, goals, netWorthSnapshots: nwHistory,
      })

      await netWorthService.takeSnapshot(user.id).catch(() => {})

      setData({
        totalAssets, totalLiabilities, netWorth,
        monthlyIncome, monthlyExpenses, monthlySavings, savingsRate,
        healthScore: hs, netWorthHistory: nwHistory, monthlyComparison: comparison,
        categoryBreakdown: catBreakdown.slice(0, 8),
        recentExpenses: recentExp.slice(0, 5),
        recentIncome: recentInc.slice(0, 5),
        budgets: budgetsList.map(b => ({ ...b, spent: categorySpending[b.category] || 0 })).slice(0, 5),
        goals: goals.slice(0, 4),
        recommendations: recs.slice(0, 3),
      })
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  useEffect(() => { load() }, [load])

  const getScoreLabel = (score) => {
    if (score >= 80) return { label: 'Excellent' }
    if (score >= 60) return { label: 'Good' }
    if (score >= 40) return { label: 'Fair' }
    return { label: 'Needs Improvement' }
  }

  const getCatLabel = (val) => EXPENSE_CATEGORIES.find(c => c.value === val)?.label || val
  const getCatColor = (val) => EXPENSE_CATEGORIES.find(c => c.value === val)?.color || '#6366f1'

  if (loading) return <div className="app-loading" style={{ minHeight: '60vh' }}><div className="spinner" /></div>

  const hs = data.healthScore
  const scoreInfo = hs ? getScoreLabel(hs.total) : null

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your complete financial overview</p>
        </div>
        <button className="btn btn--outline" onClick={load}>↻ Refresh</button>
      </div>

      {/* Health Score */}
      {hs && (
        <div className="health-score-card">
          <div className="health-score-circle">
            <span className="health-score-number">{hs.total}</span>
            <span className="health-score-max">/100</span>
          </div>
          <div className="health-score-text">
            <h3>Financial Health: {scoreInfo.label}</h3>
            <p>
              {hs.total >= 80 ? 'Excellent! Keep maintaining your current savings and investment habits.' :
               hs.total >= 60 ? 'Good financial health with some room for improvement.' :
               hs.total >= 40 ? 'Fair. Focus on increasing savings and reducing debt.' :
               'Your finances need attention. Review the recommendations below.'}
            </p>
            <div className="health-score-breakdown">
              <span className="health-score-item">Savings {hs.savings_rate}/25</span>
              <span className="health-score-item">Debt {hs.debt}/20</span>
              <span className="health-score-item">Emergency Fund {hs.emergency_fund}/20</span>
              <span className="health-score-item">NW Trend {hs.net_worth_trend}/15</span>
              <span className="health-score-item">Budgets {hs.budget_adherence}/10</span>
              <span className="health-score-item">Goals {hs.goal_progress}/10</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-grid">
        <SummaryCard title="Net Worth" value={formatCompact(data.netWorth)} icon={<Activity size={22} />} color={data.netWorth >= 0 ? 'blue' : 'red'} />
        <SummaryCard title="Total Assets" value={formatCompact(data.totalAssets)} icon={<Landmark size={22} />} color="green" />
        <SummaryCard title="Total Liabilities" value={formatCompact(data.totalLiabilities)} icon={<CreditCard size={22} />} color="red" />
        <SummaryCard title="Monthly Income" value={formatCompact(data.monthlyIncome)} icon={<TrendingUp size={22} />} color="teal" />
        <SummaryCard title="Monthly Expenses" value={formatCompact(data.monthlyExpenses)} icon={<TrendingDown size={22} />} color="yellow" />
        <SummaryCard title="Monthly Savings" value={formatCompact(data.monthlySavings)} subtitle={`Savings rate: ${formatPercent(data.savingsRate)}`} icon={<PiggyBank size={22} />} color="purple" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Net Worth History */}
        <div className="chart-card">
          <div className="chart-title">Net Worth Growth <span className="chart-subtitle">Last 6 months</span></div>
          {data.netWorthHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.netWorthHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="snapshot_date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
                <Tooltip formatter={v => [formatCurrency(v), 'Net Worth']} />
                <Line type="monotone" dataKey="net_worth" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Add assets &amp; liabilities to see your net worth trend</div>
          )}
        </div>

        {/* Income vs Expenses */}
        <div className="chart-card">
          <div className="chart-title">Income vs Expenses <span className="chart-subtitle">Last 6 months</span></div>
          {data.monthlyComparison.some(d => d.income > 0 || d.expenses > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Record income and expenses to see this chart</div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="chart-card">
          <div className="chart-title">Expense Breakdown <span className="chart-subtitle">This month</span></div>
          {data.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.categoryBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                  {data.categoryBreakdown.map((e) => (
                    <Cell key={e.category} fill={getCatColor(e.category)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [formatCurrency(v), getCatLabel(n)]} />
                <Legend formatter={n => getCatLabel(n)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No expenses recorded this month</div>
          )}
        </div>

        {/* Budget Overview */}
        <div className="chart-card">
          <div className="chart-title">Budget Progress <span className="chart-subtitle">This month</span></div>
          {data.budgets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.budgets.map(b => (
                <div key={b.id}>
                  <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span className="font-semibold">{EXPENSE_CATEGORIES.find(c => c.value === b.category)?.label || b.category}</span>
                    <span className={b.spent > b.amount ? 'text-danger' : 'text-muted'}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                    </span>
                  </div>
                  <ProgressBar value={b.spent} max={Number(b.amount)} showPercent={false} />
                </div>
              ))}
              <Link to="/budgets" className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start' }}>View all budgets →</Link>
            </div>
          ) : (
            <div className="chart-empty">No budgets set. <Link to="/budgets" className="auth-link">Create one</Link></div>
          )}
        </div>
      </div>

      {/* Goals & Recommendations */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Financial Goals</div>
          {data.goals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.goals.map(g => (
                <div key={g.id}>
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{g.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatCompact(g.current_amount)} / {formatCompact(g.target_amount)}</span>
                  </div>
                  <ProgressBar value={Number(g.current_amount)} max={Number(g.target_amount)} showPercent />
                </div>
              ))}
              <Link to="/goals" className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start' }}>View all goals →</Link>
            </div>
          ) : (
            <div className="chart-empty">No goals yet. <Link to="/goals" className="auth-link">Add a goal</Link></div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-title"><Lightbulb size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />Recommendations</div>
          {data.recommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.recommendations.map((r, i) => (
                <div key={i} className={`rec-card rec-card--${r.type}`}>
                  <div className="rec-icon">{r.type === 'warning' ? '⚠️' : r.type === 'success' ? '✅' : r.type === 'alert' ? '🚨' : '💡'}</div>
                  <div>
                    <div className="rec-title">{r.title}</div>
                    <div className="rec-msg">{r.message}</div>
                  </div>
                </div>
              ))}
              <Link to="/recommendations" className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start' }}>View all →</Link>
            </div>
          ) : (
            <div className="chart-empty">Add financial data to get personalised recommendations</div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Transactions</span>
          <Link to="/transactions" className="btn btn--ghost btn--sm">View all</Link>
        </div>
        {data.recentExpenses.length === 0 && data.recentIncome.length === 0 ? (
          <div className="chart-empty">
            No transactions yet. <Link to="/expenses" className="auth-link">Add your first expense</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {[
                  ...data.recentExpenses.map(e => ({ ...e, txType: 'expense' })),
                  ...data.recentIncome.map(i => ({ ...i, txType: 'income' })),
                ]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 8)
                  .map(tx => (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                      <td className="truncate" style={{ maxWidth: 200 }}>{tx.description || tx.source_name || '-'}</td>
                      <td>{tx.txType === 'expense' ? (EXPENSE_CATEGORIES.find(c => c.value === tx.category)?.label || tx.category) : (tx.source_type || '-')}</td>
                      <td><span className={`badge badge--${tx.txType === 'income' ? 'success' : 'danger'}`}>{tx.txType}</span></td>
                      <td className={tx.txType === 'income' ? 'amount-positive' : 'amount-negative'}>
                        {tx.txType === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
