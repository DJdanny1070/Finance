import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { liabilityService } from "../services/liabilityService"
import { formatCurrency } from "../utils/formatCurrency"
import { LIABILITY_TYPES } from "../utils/constants"
import Modal from "../components/ui/Modal"
import EmptyState from "../components/ui/EmptyState"
import { Plus, Edit2, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

const INIT = { name: "", type: "personal_loan", original_amount: "", remaining_amount: "", interest_rate: "", monthly_emi: "", start_date: "", end_date: "", notes: "" }

export default function LiabilitiesPage() {
  const { user } = useAuth()
  const [liabilities, setLiabilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INIT)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try { setLiabilities(await liabilityService.getAll(user.id)) }
    catch { toast.error("Failed to load liabilities") } finally { setLoading(false) }
  }, [user])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(INIT); setModalOpen(true) }
  const openEdit = (l) => {
    setEditing(l)
    setForm({ name: l.name, type: l.type, original_amount: l.original_amount, remaining_amount: l.remaining_amount, interest_rate: l.interest_rate || "", monthly_emi: l.monthly_emi || "", start_date: l.start_date || "", end_date: l.end_date || "", notes: l.notes || "" })
    setModalOpen(true)
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    if (!form.name || !form.original_amount || !form.remaining_amount) { toast.error("Fill required fields"); return }
    setSaving(true)
    try {
      const payload = { ...form, original_amount: parseFloat(form.original_amount), remaining_amount: parseFloat(form.remaining_amount), interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null, monthly_emi: form.monthly_emi ? parseFloat(form.monthly_emi) : null }
      if (editing) {
        const updated = await liabilityService.update(editing.id, payload)
        setLiabilities(prev => prev.map(l => l.id === editing.id ? updated : l))
        toast.success("Liability updated")
      } else {
        const created = await liabilityService.create(user.id, payload)
        setLiabilities(prev => [created, ...prev])
        toast.success("Liability added")
      }
      setModalOpen(false)
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this liability?")) return
    try { await liabilityService.delete(id); setLiabilities(prev => prev.filter(l => l.id !== id)); toast.success("Deleted") }
    catch { toast.error("Failed to delete") }
  }

  const totalLiabilities = liabilities.reduce((s, l) => s + Number(l.remaining_amount), 0)
  const totalEMI = liabilities.reduce((s, l) => s + Number(l.monthly_emi || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Liabilities</h1><p className="page-subtitle">Loans and debts you owe</p></div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Outstanding</div><div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--danger)" }}>{formatCurrency(totalLiabilities)}</div></div>
          <button className="btn btn--primary" onClick={openAdd}><Plus size={16} />Add Liability</button>
        </div>
      </div>

      {totalEMI > 0 && (
        <div className="card" style={{ marginBottom: "1rem", background: "var(--primary-light)" }}>
          <span style={{ fontWeight: 700 }}>Total Monthly EMI: </span><span style={{ fontWeight: 800, color: "var(--primary-dark)" }}>{formatCurrency(totalEMI)}/month</span>
        </div>
      )}

      {loading ? (
        <div className="app-loading" style={{ minHeight: "40vh" }}><div className="spinner" /></div>
      ) : liabilities.length === 0 ? (
        <EmptyState icon="🏦" title="No liabilities recorded" description="Add your home loans, vehicle loans, credit card debt, and other liabilities to get an accurate net worth calculation." action={<button className="btn btn--primary" onClick={openAdd}><Plus size={16} />Add Liability</button>} />
      ) : (
        <div className="items-grid">
          {liabilities.map(l => {
            const paidPct = l.original_amount > 0 ? ((Number(l.original_amount) - Number(l.remaining_amount)) / Number(l.original_amount)) * 100 : 0
            return (
              <div key={l.id} className="item-card">
                <div className="item-card-header">
                  <span style={{ fontSize: "1.5rem" }}>💳</span>
                  <div className="item-card-actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => openEdit(l)}><Edit2 size={14} /></button>
                    <button className="btn btn--danger btn--sm" onClick={() => handleDelete(l.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="item-card-name">{l.name}</div>
                <div className="item-card-type">{LIABILITY_TYPES.find(t => t.value === l.type)?.label || l.type}</div>
                <div className="item-card-value item-card-value--negative">-{formatCurrency(l.remaining_amount)}</div>
                <div className="item-card-meta">Original: {formatCurrency(l.original_amount)}</div>
                {l.interest_rate && <div className="item-card-meta">Interest: {l.interest_rate}% p.a.</div>}
                {l.monthly_emi && <div className="item-card-meta" style={{ fontWeight: 600 }}>EMI: {formatCurrency(l.monthly_emi)}/month</div>}
                {l.end_date && <div className="item-card-meta">End: {new Date(l.end_date).toLocaleDateString("en-IN")}</div>}
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>Paid off: {paidPct.toFixed(0)}%</div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${paidPct}%`, background: "var(--success)" }} /></div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Liability" : "Add Liability"} size="md">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Home Loan — HDFC" required /></div>
            <div className="form-field"><label className="form-label">Type *</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{LIABILITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Original Amount (₹) *</label><input type="number" className="form-input" value={form.original_amount} onChange={e => setForm({ ...form, original_amount: e.target.value })} placeholder="500000" min="0" required /></div>
            <div className="form-field"><label className="form-label">Remaining Amount (₹) *</label><input type="number" className="form-input" value={form.remaining_amount} onChange={e => setForm({ ...form, remaining_amount: e.target.value })} placeholder="350000" min="0" required /></div>
            <div className="form-field"><label className="form-label">Interest Rate (%)</label><input type="number" className="form-input" value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: e.target.value })} placeholder="8.5" step="0.01" /></div>
            <div className="form-field"><label className="form-label">Monthly EMI (₹)</label><input type="number" className="form-input" value={form.monthly_emi} onChange={e => setForm({ ...form, monthly_emi: e.target.value })} placeholder="15000" min="0" /></div>
            <div className="form-field"><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div className="form-field"><label className="form-label">End Date</label><input type="date" className="form-input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            <div className="form-field" style={{ gridColumn: "1/-1" }}><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn--outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Liability"}</button></div>
        </form>
      </Modal>
    </div>
  )
}