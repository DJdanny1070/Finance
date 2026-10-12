import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { expenseService } from "../services/expenseService"
import { formatCurrency } from "../utils/formatCurrency"
import { getCurrentMonth, getCurrentYear } from "../utils/dateHelpers"
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../utils/constants"
import Modal from "../components/ui/Modal"
import EmptyState from "../components/ui/EmptyState"
import { Plus, Search, Edit2, Trash2, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

const today = () => new Date().toISOString().split("T")[0]
const INIT = { amount: "", date: today(), category: "food", payment_method: "upi", description: "", is_recurring: false, frequency: "monthly", notes: "" }

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INIT)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState({ search: "", category: "", payment_method: "" })
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth())
  const [yearFilter, setYearFilter] = useState(getCurrentYear())

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const startDate = `${yearFilter}-${String(monthFilter).padStart(2, "0")}-01`
      const endDate = new Date(yearFilter, monthFilter, 0).toISOString().split("T")[0]
      const data = await expenseService.getTransactions(user.id, { startDate, endDate, ...filters })
      setExpenses(data)
    } catch { toast.error("Failed to load expenses") } finally { setLoading(false) }
  }, [user, filters, monthFilter, yearFilter])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm({ ...INIT, date: today() }); setModalOpen(true) }
  const openEdit = (e) => {
    setEditing(e)
    setForm({ amount: e.amount, date: e.date, category: e.category, payment_method: e.payment_method, description: e.description || "", is_recurring: e.is_recurring, frequency: e.frequency || "monthly", notes: e.notes || "" })
    setModalOpen(true)
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    if (!form.amount || !form.date || !form.category) { toast.error("Fill required fields"); return }
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (editing) {
        const updated = await expenseService.updateTransaction(editing.id, payload)
        setExpenses(prev => prev.map(e => e.id === editing.id ? updated : e))
        toast.success("Expense updated")
      } else {
        const created = await expenseService.createTransaction(user.id, payload)
        setExpenses(prev => [created, ...prev])
        toast.success("Expense added")
      }
      setModalOpen(false)
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return
    try {
      await expenseService.deleteTransaction(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast.success("Expense deleted")
    } catch { toast.error("Failed to delete") }
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const byCat = {}
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount) })
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }) }))

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Expenses</h1><p className="page-subtitle">Track every rupee you spend</p></div>
        <button className="btn btn--primary" onClick={openAdd}><Plus size={16} />Add Expense</button>
      </div>

      {expenses.length > 0 && (
        <div className="summary-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))" }}>
          <div className="card"><div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>Total Expenses</div><div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--danger)" }}>{formatCurrency(total)}</div></div>
          <div className="card"><div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>Transactions</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{expenses.length}</div></div>
          <div className="card"><div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>Daily Average</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{formatCurrency(total / new Date(yearFilter, monthFilter, 0).getDate())}</div></div>
          {topCat && <div className="card"><div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>Top Category</div><div style={{ fontWeight: 700 }}>{EXPENSE_CATEGORIES.find(c => c.value === topCat[0])?.label}</div><div style={{ fontSize: "0.85rem", color: "var(--danger)" }}>{formatCurrency(topCat[1])}</div></div>}
        </div>
      )}

      <div className="filters-bar">
        <div className="search-input-wrap"><Search size={16} className="search-icon" /><input className="form-input search-input" placeholder="Search expenses..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} /></div>
        <select className="form-select" style={{ width: "auto" }} value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))}>{months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
        <select className="form-select" style={{ width: "auto" }} value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))}>{[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select className="form-select" style={{ width: "auto" }} value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}><option value="">All Categories</option>{EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
        <select className="form-select" style={{ width: "auto" }} value={filters.payment_method} onChange={e => setFilters({ ...filters, payment_method: e.target.value })}><option value="">All Payment Methods</option>{PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
      </div>

      {loading ? (
        <div className="app-loading" style={{ minHeight: "40vh" }}><div className="spinner" /></div>
      ) : expenses.length === 0 ? (
        <EmptyState icon="💸" title="No expenses recorded" description="Start tracking your daily expenses — groceries, bills, transport, food, and more." action={<button className="btn btn--primary" onClick={openAdd}><Plus size={16} />Add First Expense</button>} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Payment</th><th>Recurring</th><th>Amount</th><th>Actions</th></tr></thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(e.date).toLocaleDateString("en-IN")}</td>
                  <td>{EXPENSE_CATEGORIES.find(c => c.value === e.category)?.icon} {EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label || e.category}</td>
                  <td className="truncate" style={{ maxWidth: 200 }}>{e.description || "-"}</td>
                  <td>{PAYMENT_METHODS.find(p => p.value === e.payment_method)?.label || e.payment_method}</td>
                  <td>{e.is_recurring ? <span className="badge badge--info"><RefreshCw size={10} /> {e.frequency}</span> : "-"}</td>
                  <td className="amount-negative">-{formatCurrency(e.amount)}</td>
                  <td><div className="actions"><button className="btn btn--ghost btn--sm" onClick={() => openEdit(e)}><Edit2 size={14} /></button><button className="btn btn--danger btn--sm" onClick={() => handleDelete(e.id)}><Trash2 size={14} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Expense" : "Add Expense"} size="md">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Amount (₹) *</label><input type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="500" min="0" step="0.01" required /></div>
            <div className="form-field"><label className="form-label">Date *</label><input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
            <div className="form-field"><label className="form-label">Category *</label><select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>{EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Payment Method</label><select className="form-select" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>{PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
            <div className="form-field" style={{ gridColumn: "1/-1" }}><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Grocery shopping at DMart" /></div>
            <div className="form-field" style={{ gridColumn: "1/-1" }}><label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}><input type="checkbox" checked={form.is_recurring} onChange={e => setForm({ ...form, is_recurring: e.target.checked })} /> Recurring Expense</label></div>
            {form.is_recurring && <div className="form-field"><label className="form-label">Frequency</label><select className="form-select" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div>}
            <div className="form-field" style={{ gridColumn: "1/-1" }}><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn--outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Expense"}</button></div>
        </form>
      </Modal>
    </div>
  )
}