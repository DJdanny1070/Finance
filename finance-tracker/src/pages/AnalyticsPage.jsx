import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { analyticsService } from '../services/analyticsService'
import { expenseService } from '../services/expenseService'
import { formatCurrency } from '../utils/formatCurrency'
import { getCurrentMonth, getCurrentYear } from '../utils/dateHelpers'
import { EXPENSE_CATEGORIES } from '../utils/constants'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [comparison, setComparison] = useState([])
  const [catBreakdown, setCatBreakdown] = useState([])
  const [savingsTrend, setSavingsTrend] = useState([])
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const [period, setPeriod] = useState(6)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [comp, cats, trend] = await Promise.all([
        analyticsService.getMonthlyComparison(user.id, period),
        analyticsService.getExpenseCategoryBreakdown(user.id, month, year),
        analyticsService.getSavingsTrend(user.id, period),
      ])
      setComparison(comp)
      setCatBreakdown(cats)
      setSavingsTrend(trend)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [user, period, month, year])

  useEffect(() => { load() }, [load])

  const totalExpenses = catBreakdown.reduce((s, c) => s + c.amount, 0)
  const getCatLabel = (val) => EXPENSE_CATEGORIES.find(c => c.value === val)?.label || val
  const getCatColor = (val) => EXPENSE_CATEGORIES.find(c => c.value === val)?.color || '#6366f1'
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }) }))

  if (loading) return <div className="app-loading" style={{ minHeight: '60vh' }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Understand your spending patterns</p></div>
        <div className="flex gap-1">
          <select className="form-select" style={{ width: 'auto' }} value={period} onChange={e => setPeriod(Number(e.target.value))}>
            <option value={3}>3 Months</option><option value={6}>6 Months</option><option value={12}>12 Months</option>
          </select>
        </div>
      </div>

      <div className="charts-grid">
        {/* Income vs Expenses */}
        <div className="chart-card">
          <div className="chart-title">Income vs Expenses</div>
          {comparison.some(d => d.income > 0 || d.expenses > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                <Bar dataKey="savings" fill="#6366f1" name="Savings" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">No data for this period</div>}
        </div>

        {/* Savings Trend */}
        <div className="chart-card">
          <div className="chart-title">Savings Trend</div>
          {savingsTrend.some(d => d.savings !== 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={savingsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Line type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">No savings data for this period</div>}
        </div>

        {/* Expense by Category */}
        <div className="chart-card">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div className="chart-title" style={{ marginBottom: 0 }}>Expense Breakdown</div>
            <div className="flex gap-1">
              <select className="form-select" style={{ width: 'auto', fontSize: '0.8rem' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select className="form-select" style={{ width: 'auto', fontSize: '0.8rem' }} value={year} onChange={e => setYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {catBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={catBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={40}>
                  {catBreakdown.map((e) => <Cell key={e.category} fill={getCatColor(e.category)} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [formatCurrency(v), getCatLabel(n)]} />
                <Legend formatter={n => getCatLabel(n)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">No expenses this month</div>}
        </div>

        {/* Category Details Table */}
        <div className="chart-card">
          <div className="chart-title">Category Details</div>
          {catBreakdown.length > 0 ? (
            <div>
              {catBreakdown.map(c => {
                const pct = totalExpenses > 0 ? (c.amount / totalExpenses) * 100 : 0
                const cat = EXPENSE_CATEGORIES.find(e => e.value === c.category)
                return (
                  <div key={c.category} style={{ marginBottom: '0.75rem' }}>
                    <div className="flex-between" style={{ marginBottom: 4, fontSize: '0.85rem' }}>
                      <span>{cat?.icon} {cat?.label || c.category}</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency(c.amount)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: getCatColor(c.category) }} />
                    </div>
                  </div>
                )
              })}
              <div className="divider" />
              <div className="flex-between" style={{ fontWeight: 700 }}><span>Total</span><span>{formatCurrency(totalExpenses)}</span></div>
            </div>
          ) : <div className="chart-empty">No expenses this month</div>}
        </div>
      </div>

      {/* Period Summary Stats */}
      {comparison.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Period Summary — Last {period} Months</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
            {[
              { label: 'Total Income', value: comparison.reduce((s, d) => s + d.income, 0), color: 'var(--success)' },
              { label: 'Total Expenses', value: comparison.reduce((s, d) => s + d.expenses, 0), color: 'var(--danger)' },
              { label: 'Net Savings', value: comparison.reduce((s, d) => s + d.savings, 0), color: 'var(--primary)' },
              { label: 'Avg Monthly Income', value: comparison.reduce((s, d) => s + d.income, 0) / comparison.length, color: 'var(--success)' },
              { label: 'Avg Monthly Expenses', value: comparison.reduce((s, d) => s + d.expenses, 0) / comparison.length, color: 'var(--danger)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{formatCurrency(s.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
