import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { budgetService } from "../services/budgetService"
import { expenseService } from "../services/expenseService"
import { formatCurrency } from "../utils/formatCurrency"
import { getCurrentMonth, getCurrentYear } from "../utils/dateHelpers"
import { EXPENSE_CATEGORIES } from "../utils/constants"
import Modal from "../components/ui/Modal"
import EmptyState from "../components/ui/EmptyState"
import ProgressBar from "../components/ui/ProgressBar"
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

export default function BudgetsPage() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [spending, setSpending] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ category: "food", amount: "" })
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [buds, cats] = await Promise.all([
        budgetService.getMonthlyBudgets(user.id, month, year),
        expenseService.getCategoryTotals(user.id, month, year),
      ])
      setBudgets(buds)
      setSpending(cats)
    } catch { toast.error("Failed to load budgets") } finally { setLoading(false) }
  }, [user, month, year])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm({ category: "food", amount: "" }); setModalOpen(true) }
  const openEdit = (b) => { setEditing(b); setForm({ category: b.category, amount: b.amount }); setModalOpen(true) }

  const handleSave = async (ev) => {
    ev.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Enter a valid budget amount"); return }
    setSaving(true)
    try {
      await budgetService.upsert(user.id, form.category, parseFloat(form.amount), month, year)
      await load()
      setModalOpen(false)
      toast.success(editing ? "Budget updated" : "Budget created")
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this budget?")) return
    try { await budgetService.delete(id); setBudgets(prev => prev.filter(b => b.id !== id)); toast.success("Deleted") }
    catch { toast.error("Failed") }
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }) }))
  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0)
  const totalSpent = budgets.reduce((s, b) => s + Number(spending[b.category] || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Budget Planner</h1><p className="page-subtitle">Set spending limits for each category</p></div>
        <button className="btn btn--primary" onClick={openAdd}><Plus size={16} />Add Budget</button>
      </div>

      <div className="filters-bar">
        <select className="form-select" style={{ width: "auto" }} value={month} onChange={e => setMonth(Number(e.target.value))}>{months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
        <select className="form-select" style={{ width: "auto" }} value={year} onChange={e => setYear(Number(e.target.value))}>{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
      </div>

      {budgets.length > 0 && (
        <div className="summary-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", marginBottom: "1.5rem" }}>
          <div className="card"><div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>Total Budget</div><div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{formatCurrency(totalBudget)}</div></div>
          <div className="card"><div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>Total Spent</div><div style={{ fontSize: "1.4rem", fontWeight: 800, color: totalSpent > totalBudget ? "var(--danger)" : "var(--text)" }}>{formatCurrency(totalSpent)}</div></div>
          <div className="card"><div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>Remaining</div><div style={{ fontSize: "1.4rem", fontWeight: 800, color: totalBudget - totalSpent < 0 ? "var(--danger)" : "var(--success)" }}>{formatCurrency(Math.abs(totalBudget - totalSpent))}{totalBudget - totalSpent < 0 ? " over" : " left"}</div></div>
        </div>
      )}

      {loading ? (
        <div className="app-loading" style={{ minHeight: "40vh" }}><div className="spinner" /></div>
      ) : budgets.length === 0 ? (
        <EmptyState icon="📊" title="No budgets set" description="Create monthly spending limits for food, transport, entertainment, and other categories to take control of your expenses." action={<button className="btn btn--primary" onClick={openAdd}><Plus size={16} />Create First Budget</button>} />
      ) : (
        <div className="items-grid">
          {budgets.map(b => {
            const spent = Number(spending[b.category] || 0)
            const budget = Number(b.amount)
            const remaining = budget - spent
            const cat = EXPENSE_CATEGORIES.find(c => c.value === b.category)
            return (
              <div key={b.id} className="budget-card">
                <div className="budget-card-header">
                  <div><span style={{ fontSize: "1.2rem" }}>{cat?.icon}</span>{" "}<span className="budget-category">{cat?.label || b.category}</span></div>
                  <div className="item-card-actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => openEdit(b)}><Edit2 size={14} /></button>
                    <button className="btn btn--danger btn--sm" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <ProgressBar value={spent} max={budget} />
                <div className="budget-amounts">
                  <span>Spent: {formatCurrency(spent)}</span>
                  <span>Budget: {formatCurrency(budget)}</span>
                </div>
                {remaining < 0 ? (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--danger)", fontWeight: 600, display: "flex", gap: 4, alignItems: "center" }}>
                    <AlertCircle size={14} /> Over by {formatCurrency(Math.abs(remaining))}
                  </div>
                ) : spent / budget >= 0.8 ? (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--warning)", fontWeight: 600 }}>⚠️ {formatCurrency(remaining)} remaining</div>
                ) : (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--success)" }}>{formatCurrency(remaining)} remaining</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Budget" : "Create Budget"} size="sm">
        <form onSubmit={handleSave}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-field"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Monthly Budget (₹)</label><input type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="5000" min="1" required /></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn--outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</button></div>
        </form>
      </Modal>
    </div>
  )
}