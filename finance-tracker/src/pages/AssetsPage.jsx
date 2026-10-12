import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { assetService } from "../services/assetService"
import { formatCurrency } from "../utils/formatCurrency"
import { ASSET_CATEGORIES } from "../utils/constants"
import Modal from "../components/ui/Modal"
import EmptyState from "../components/ui/EmptyState"
import { Plus, Edit2, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

const INIT = { name: "", category: "bank_account", purchase_value: "", current_value: "", purchase_date: "", expected_growth_rate: "", notes: "" }

export default function AssetsPage() {
  const { user } = useAuth()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INIT)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try { setAssets(await assetService.getAll(user.id)) }
    catch { toast.error("Failed to load assets") } finally { setLoading(false) }
  }, [user])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(INIT); setModalOpen(true) }
  const openEdit = (a) => {
    setEditing(a)
    setForm({ name: a.name, category: a.category, purchase_value: a.purchase_value || "", current_value: a.current_value, purchase_date: a.purchase_date || "", expected_growth_rate: a.expected_growth_rate || "", notes: a.notes || "" })
    setModalOpen(true)
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    if (!form.name || !form.current_value) { toast.error("Name and current value are required"); return }
    setSaving(true)
    try {
      const payload = { ...form, current_value: parseFloat(form.current_value), purchase_value: form.purchase_value ? parseFloat(form.purchase_value) : null, expected_growth_rate: form.expected_growth_rate ? parseFloat(form.expected_growth_rate) : null }
      if (editing) {
        const updated = await assetService.update(editing.id, payload)
        setAssets(prev => prev.map(a => a.id === editing.id ? updated : a))
        toast.success("Asset updated")
      } else {
        const created = await assetService.create(user.id, payload)
        setAssets(prev => [created, ...prev])
        toast.success("Asset added")
      }
      setModalOpen(false)
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this asset?")) return
    try { await assetService.delete(id); setAssets(prev => prev.filter(a => a.id !== id)); toast.success("Asset deleted") }
    catch { toast.error("Failed to delete") }
  }

  const totalAssets = assets.reduce((s, a) => s + Number(a.current_value), 0)

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Assets</h1><p className="page-subtitle">Everything you own</p></div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Assets</div><div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--success)" }}>{formatCurrency(totalAssets)}</div></div>
          <button className="btn btn--primary" onClick={openAdd}><Plus size={16} />Add Asset</button>
        </div>
      </div>

      {loading ? (
        <div className="app-loading" style={{ minHeight: "40vh" }}><div className="spinner" /></div>
      ) : assets.length === 0 ? (
        <EmptyState icon="🏦" title="No assets added" description="Add your bank accounts, property, gold, investments, vehicles, and other assets to calculate your total net worth." action={<button className="btn btn--primary" onClick={openAdd}><Plus size={16} />Add First Asset</button>} />
      ) : (
        <div className="items-grid">
          {assets.map(a => {
            const cat = ASSET_CATEGORIES.find(c => c.value === a.category)
            const gain = a.purchase_value ? Number(a.current_value) - Number(a.purchase_value) : null
            const gainPct = gain && a.purchase_value ? (gain / Number(a.purchase_value)) * 100 : null
            return (
              <div key={a.id} className="item-card">
                <div className="item-card-header">
                  <span className="item-card-icon">{cat?.icon || "📦"}</span>
                  <div className="item-card-actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => openEdit(a)}><Edit2 size={14} /></button>
                    <button className="btn btn--danger btn--sm" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="item-card-name">{a.name}</div>
                <div className="item-card-type">{cat?.label || a.category}</div>
                <div className="item-card-value">{formatCurrency(a.current_value)}</div>
                {gain !== null && (
                  <div className={`item-card-gain ${gain >= 0 ? "positive" : "negative"}`}>
                    {gain >= 0 ? "▲" : "▼"} {formatCurrency(Math.abs(gain))} ({gainPct?.toFixed(1)}%)
                  </div>
                )}
                {a.purchase_date && <div className="item-card-meta">Bought: {new Date(a.purchase_date).toLocaleDateString("en-IN")}</div>}
                {a.expected_growth_rate && <div className="item-card-meta">Expected growth: {a.expected_growth_rate}%/yr</div>}
                {a.notes && <div className="item-card-meta">{a.notes}</div>}
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Asset" : "Add Asset"} size="md">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Asset Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. SBI Savings Account" required /></div>
            <div className="form-field"><label className="form-label">Category *</label><select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{ASSET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Current Value (₹) *</label><input type="number" className="form-input" value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} placeholder="100000" min="0" required /></div>
            <div className="form-field"><label className="form-label">Purchase Value (₹)</label><input type="number" className="form-input" value={form.purchase_value} onChange={e => setForm({ ...form, purchase_value: e.target.value })} placeholder="80000" min="0" /></div>
            <div className="form-field"><label className="form-label">Purchase Date</label><input type="date" className="form-input" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} /></div>
            <div className="form-field"><label className="form-label">Expected Growth Rate (%/yr)</label><input type="number" className="form-input" value={form.expected_growth_rate} onChange={e => setForm({ ...form, expected_growth_rate: e.target.value })} placeholder="8" step="0.1" /></div>
            <div className="form-field" style={{ gridColumn: "1/-1" }}><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn--outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Asset"}</button></div>
        </form>
      </Modal>
    </div>
  )
}