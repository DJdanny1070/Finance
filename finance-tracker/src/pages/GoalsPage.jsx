import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { goalService } from "../services/goalService"
import { formatCurrency } from "../utils/formatCurrency"
import { GOAL_TYPES } from "../utils/constants"
import Modal from "../components/ui/Modal"
import EmptyState from "../components/ui/EmptyState"
import ProgressBar from "../components/ui/ProgressBar"
import { Plus, Edit2, Trash2, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"

const INIT = { name: "", type: "emergency_fund", target_amount: "", current_amount: "0", target_date: "", priority: "medium", notes: "" }

export default function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INIT)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try { setGoals(await goalService.getAll(user.id)) }
    catch { toast.error("Failed to load goals") } finally { setLoading(false) }
  }, [user])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(INIT); setModalOpen(true) }
  const openEdit = (g) => {
    setEditing(g)
    setForm({ name: g.name, type: g.type, target_amount: g.target_amount, current_amount: g.current_amount, target_date: g.target_date || "", priority: g.priority, notes: g.notes || "" })
    setModalOpen(true)
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    if (!form.name || !form.target_amount) { toast.error("Fill required fields"); return }
    setSaving(true)
    try {
      const ca = parseFloat(form.current_amount) || 0
      const ta = parseFloat(form.target_amount)
      const payload = { ...form, target_amount: ta, current_amount: ca, is_completed: ca >= ta }
      if (editing) {
        const updated = await goalService.update(editing.id, payload)
        setGoals(prev => prev.map(g => g.id === editing.id ? updated : g))
        toast.success("Goal updated")
      } else {
        const created = await goalService.create(user.id, payload)
        setGoals(prev => [created, ...prev])
        toast.success("Goal created!")
      }
      setModalOpen(false)
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this goal?")) return
    try { await goalService.delete(id); setGoals(prev => prev.filter(g => g.id !== id)); toast.success("Goal deleted") }
    catch { toast.error("Failed to delete") }
  }

  const getMonthlyRequired = (g) => {
    if (!g.target_date) return null
    const months = Math.max(1, Math.ceil((new Date(g.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)))
    const remaining = Number(g.target_amount) - Number(g.current_amount)
    return remaining > 0 ? remaining / months : 0
  }

  const active = goals.filter(g => !g.is_completed)
  const completed = goals.filter(g => g.is_completed)

  const GoalCard = ({ g }) => {
    const pct = g.target_amount > 0 ? Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100) : 0
    const monthly = getMonthlyRequired(g)
    const cat = GOAL_TYPES.find(t => t.value === g.type)
    return (
      <div className="goal-card">
        <div className="goal-card-header">
          <div>
            <div className="goal-name">{g.is_completed && <CheckCircle size={16} style={{ color: "var(--success)", marginRight: 4, verticalAlign: "middle" }} />}{g.name}</div>
            <div className="goal-type">{cat?.label || g.type}</div>
          </div>
          <div className="item-card-actions">
            <span className={`badge badge--${g.priority === "high" ? "danger" : g.priority === "medium" ? "warning" : "default"}`}>{g.priority}</span>
            <button className="btn btn--ghost btn--sm" onClick={() => openEdit(g)}><Edit2 size={14} /></button>
            <button className="btn btn--danger btn--sm" onClick={() => handleDelete(g.id)}><Trash2 size={14} /></button>
          </div>
        </div>
        <ProgressBar value={Number(g.current_amount)} max={Number(g.target_amount)} label={`${pct.toFixed(0)}% complete`} />
        <div className="goal-amounts">
          <div><div className="goal-amount-label">Saved</div><div className="goal-amount-value text-success">{formatCurrency(g.current_amount)}</div></div>
          <div><div className="goal-amount-label">Target</div><div className="goal-amount-value">{formatCurrency(g.target_amount)}</div></div>
          <div><div className="goal-amount-label">Remaining</div><div className="goal-amount-value text-danger">{formatCurrency(Math.max(0, Number(g.target_amount) - Number(g.current_amount)))}</div></div>
          {g.target_date && <div><div className="goal-amount-label">Target Date</div><div className="goal-amount-value">{new Date(g.target_date).toLocaleDateString("en-IN")}</div></div>}
        </div>
        {monthly !== null && !g.is_completed && (
          <div className="goal-monthly">💡 Save {formatCurrency(monthly)}/month to reach this goal on time</div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Financial Goals</h1><p className="page-subtitle">Track your savings targets</p></div>
        <button className="btn btn--primary" onClick={openAdd}><Plus size={16} />Add Goal</button>
      </div>

      {loading ? (
        <div className="app-loading" style={{ minHeight: "40vh" }}><div className="spinner" /></div>
      ) : goals.length === 0 ? (
        <EmptyState icon="🎯" title="No goals set" description="Create financial goals like buying a car, building an emergency fund, saving for a vacation or your child's education." action={<button className="btn btn--primary" onClick={openAdd}><Plus size={16} />Create First Goal</button>} />
      ) : (
        <div>
          {active.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div className="section-header"><h2 className="section-title">Active Goals ({active.length})</h2></div>
              <div className="items-grid">{active.map(g => <GoalCard key={g.id} g={g} />)}</div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <div className="section-header"><h2 className="section-title">Completed Goals 🎉</h2></div>
              <div className="items-grid">{completed.map(g => <GoalCard key={g.id} g={g} />)}</div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Goal" : "Add Financial Goal"} size="md">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Goal Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emergency Fund" required /></div>
            <div className="form-field"><label className="form-label">Goal Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{GOAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Target Amount (₹) *</label><input type="number" className="form-input" value={form.target_amount} onChange={e => setForm({ ...form, target_amount: e.target.value })} placeholder="300000" min="1" required /></div>
            <div className="form-field"><label className="form-label">Currently Saved (₹)</label><input type="number" className="form-input" value={form.current_amount} onChange={e => setForm({ ...form, current_amount: e.target.value })} placeholder="0" min="0" /></div>
            <div className="form-field"><label className="form-label">Target Date</label><input type="date" className="form-input" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} /></div>
            <div className="form-field"><label className="form-label">Priority</label><select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
            <div className="form-field" style={{ gridColumn: "1/-1" }}><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes about this goal" /></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn--outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create Goal"}</button></div>
        </form>
      </Modal>
    </div>
  )
}