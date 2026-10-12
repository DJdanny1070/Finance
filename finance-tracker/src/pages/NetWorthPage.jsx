import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { netWorthService } from '../services/netWorthService'
import { assetService } from '../services/assetService'
import { liabilityService } from '../services/liabilityService'
import { incomeService } from '../services/incomeService'
import { expenseService } from '../services/expenseService'
import { formatCurrency, formatCompact } from '../utils/formatCurrency'
import { getCurrentMonth, getCurrentYear } from '../utils/dateHelpers'
import { projectNetWorth } from '../utils/calculations'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ASSET_CATEGORIES } from '../utils/constants'

export default function NetWorthPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  const [assets, setAssets] = useState([])
  const [liabilities, setLiabilities] = useState([])
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [range, setRange] = useState(180)
  const [sim, setSim] = useState({ monthlySavings: '', growthRate: '8' })
  const [simData, setSimData] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const m = getCurrentMonth(), y = getCurrentYear()
      const [hist, assetList, liabList, inc, exp] = await Promise.all([
        netWorthService.getAllHistory(user.id),
        assetService.getAll(user.id),
        liabilityService.getAll(user.id),
        incomeService.getMonthlyTotal(user.id, m, y),
        expenseService.getMonthlyTotal(user.id, m, y),
      ])
      setHistory(hist)
      setAssets(assetList)
      setLiabilities(liabList)
      setMonthlyIncome(inc)
      setMonthlyExpenses(exp)
      await netWorthService.takeSnapshot(user.id).catch(() => {})
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [user])

  useEffect(() => { load() }, [load])

  const totalAssets = assets.reduce((s, a) => s + Number(a.current_value), 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + Number(l.remaining_amount), 0)
  const netWorth = totalAssets - totalLiabilities

  const filteredHistory = range === 0 ? history : history.filter(h => {
    const d = new Date(h.snapshot_date)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range)
    return d >= cutoff
  })

  const handleSimulate = () => {
    const savings = parseFloat(sim.monthlySavings) || Math.max(0, monthlyIncome - monthlyExpenses)
    const rate = parseFloat(sim.growthRate) / 100 || 0.08
    const current = projectNetWorth(netWorth, 0, 60, rate)
    const improved = projectNetWorth(netWorth, savings, 60, rate)
    setSimData({ current, improved })
  }

  const assetByCat = {}
  assets.forEach(a => { assetByCat[a.category] = (assetByCat[a.category] || 0) + Number(a.current_value) })

  if (loading) return <div className="app-loading" style={{ minHeight: '60vh' }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Net Worth</h1><p className="page-subtitle">Total assets minus total liabilities</p></div>
        <button className="btn btn--outline" onClick={load}>↻ Refresh</button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', marginBottom: '1.5rem' }}>
        <div className="card" style={{ borderTop: '3px solid var(--primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Net Worth</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: netWorth >= 0 ? 'var(--primary)' : 'var(--danger)' }}>{formatCurrency(netWorth)}</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--success)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Assets</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(totalAssets)}</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Liabilities</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(totalLiabilities)}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Monthly Cash Flow</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: monthlyIncome - monthlyExpenses >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {formatCurrency(monthlyIncome - monthlyExpenses)}
          </div>
        </div>
      </div>

      {/* Historical Chart */}
      <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <div className="chart-title" style={{ marginBottom: 0 }}>Net Worth History</div>
          <div className="flex gap-1">
            {[{ v: 30, l: '1M' }, { v: 90, l: '3M' }, { v: 180, l: '6M' }, { v: 365, l: '1Y' }, { v: 0, l: 'All' }].map(r => (
              <button key={r.v} className={`btn btn--sm ${range === r.v ? 'btn--primary' : 'btn--outline'}`} onClick={() => setRange(r.v)}>{r.l}</button>
            ))}
          </div>
        </div>
        {filteredHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={filteredHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="snapshot_date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
              <Tooltip formatter={v => [formatCurrency(v)]} />
              <Line type="monotone" dataKey="net_worth" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Net Worth" />
              <Line type="monotone" dataKey="total_assets" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Assets" />
              <Line type="monotone" dataKey="total_liabilities" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Liabilities" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            Add assets and liabilities to track your net worth over time. Data builds daily as you use the app.
          </div>
        )}
      </div>

      {/* Asset Allocation */}
      {assets.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>Asset Allocation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(assetByCat).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
              const pct = totalAssets > 0 ? (val / totalAssets) * 100 : 0
              const c = ASSET_CATEGORIES.find(a => a.value === cat)
              return (
                <div key={cat}>
                  <div className="flex-between" style={{ marginBottom: 4, fontSize: '0.85rem' }}>
                    <span>{c?.icon} {c?.label || cat}</span>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(val)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Simulator */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: '0.5rem' }}>📈 Net Worth Growth Simulator</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          See how consistent monthly savings could grow your net worth over 5 years (60 months). <strong>Illustrative only — not financial advice.</strong>
        </p>
        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <div className="form-field">
            <label className="form-label">Monthly Savings (₹)</label>
            <input type="number" className="form-input" value={sim.monthlySavings}
              onChange={e => setSim({ ...sim, monthlySavings: e.target.value })}
              placeholder={`Current: ₹${Math.max(0, monthlyIncome - monthlyExpenses).toFixed(0)}`} />
          </div>
          <div className="form-field">
            <label className="form-label">Expected Annual Return (%)</label>
            <input type="number" className="form-input" value={sim.growthRate}
              onChange={e => setSim({ ...sim, growthRate: e.target.value })}
              placeholder="8" />
          </div>
        </div>
        <button className="btn btn--primary" onClick={handleSimulate}>Run Simulation</button>

        {simData && (
          <div style={{ marginTop: '1.5rem' }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" data={simData.current} label={{ value: 'Months', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => formatCompact(v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [formatCurrency(v), 'Net Worth']} />
                <Legend />
                <Line data={simData.current} type="monotone" dataKey="netWorth" stroke="#94a3b8" strokeWidth={2} name="Current Path" dot={false} />
                <Line data={simData.improved} type="monotone" dataKey="netWorth" stroke="#6366f1" strokeWidth={2.5} name="With Savings" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              ⚠️ Projections assume constant returns and are for illustrative purposes only.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
