import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { expenseService } from '../services/expenseService'
import { incomeService } from '../services/incomeService'
import { formatCurrency } from '../utils/formatCurrency'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../utils/constants'
import { Search } from 'lucide-react'

export default function TransactionsPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 25

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [exp, inc] = await Promise.all([
        expenseService.getTransactions(user.id, {}),
        incomeService.getTransactions(user.id, {}),
      ])
      setExpenses(exp)
      setIncome(inc)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [user])

  useEffect(() => { load() }, [load])

  const combined = [
    ...expenses.map(e => ({ ...e, txType: 'expense' })),
    ...income.map(i => ({ ...i, txType: 'income' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const filtered = combined.filter(tx => {
    if (typeFilter !== 'all' && tx.txType !== typeFilter) return false
    if (catFilter && tx.txType === 'expense' && tx.category !== catFilter) return false
    if (search) {
      const s = search.toLowerCase()
      const match = (tx.description || '').toLowerCase().includes(s)
        || (tx.source_name || '').toLowerCase().includes(s)
        || (tx.category || '').toLowerCase().includes(s)
        || formatCurrency(tx.amount).includes(s)
      if (!match) return false
    }
    return true
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0)
  const totalExpenses2 = expenses.reduce((s, e) => s + Number(e.amount), 0)

  if (loading) return <div className="app-loading" style={{ minHeight: '60vh' }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">All Transactions</h1><p className="page-subtitle">{filtered.length} transactions found</p></div>
      </div>

      {/* Quick Stats */}
      <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))' }}>
        <div className="card"><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Income</div><div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(totalIncome)}</div></div>
        <div className="card"><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Expenses</div><div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(totalExpenses2)}</div></div>
        <div className="card"><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Cash Flow</div><div style={{ fontSize: '1.3rem', fontWeight: 800, color: totalIncome - totalExpenses2 >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(totalIncome - totalExpenses2)}</div></div>
        <div className="card"><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Records</div><div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{combined.length}</div></div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input className="form-input search-input" placeholder="Search by description, category, amount..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}>
          <option value="all">All Types</option>
          <option value="income">Income Only</option>
          <option value="expense">Expenses Only</option>
        </select>
        {(typeFilter === 'all' || typeFilter === 'expense') && (
          <select className="form-select" style={{ width: 'auto' }} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
          </select>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Category / Source</th><th>Description</th><th>Payment Method</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions match your filters</td></tr>
            ) : paginated.map(tx => (
              <tr key={`${tx.txType}-${tx.id}`}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                <td><span className={`badge badge--${tx.txType === 'income' ? 'success' : 'danger'}`}>{tx.txType}</span></td>
                <td>{tx.txType === 'expense' ? (EXPENSE_CATEGORIES.find(c => c.value === tx.category)?.icon + ' ' + (EXPENSE_CATEGORIES.find(c => c.value === tx.category)?.label || tx.category)) : (tx.source_name || '-')}</td>
                <td className="truncate" style={{ maxWidth: 200 }}>{tx.description || '-'}</td>
                <td>{tx.txType === 'expense' ? (PAYMENT_METHODS.find(p => p.value === tx.payment_method)?.label || tx.payment_method || '-') : '-'}</td>
                <td className={tx.txType === 'income' ? 'amount-positive' : 'amount-negative'}>
                  {tx.txType === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex" style={{ gap: '0.5rem', marginTop: '1rem', justifyContent: 'center', alignItems: 'center' }}>
          <button className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
          <button className="btn btn--outline btn--sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
