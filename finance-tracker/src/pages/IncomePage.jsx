import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { incomeService } from '../services/incomeService'
import { formatCurrency } from '../utils/formatCurrency'
import { today, getCurrentMonth, getCurrentYear } from '../utils/dateHelpers'
import { INCOME_TYPES } from '../utils/constants'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const INIT = { amount: '', date: today(), source_name: 'Salary', source_type: 'salary', description: '', is_recurring: false, frequency: 'monthly' }

export default function IncomePage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INIT)
  const [saving, setSaving] = useState(false)
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth())
  const [yearFilter, setYearFilter] = useState(getCurrentYear())

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await incomeService.getMonthlyTransactions(user.id, monthFilter, yearFilter)
      setTransactions(data)
    } catch { toast.error('Failed to load income') } finally { setLoading(false) }
  }, [user, monthFilter, yearFilter])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(INIT); setModalOpen(true) }
  const openEdit = (t) => { setEditing(t); setForm({ amount: t.amount, date: t.date, source_name: t.source_name, source_type: t.source_type, description: t.description || '', is_recurring: t.is_recurring, frequency: t.frequency || 'monthly' }); setModalOpen(true) }

  const handleSave = async (ev) => {
    ev.preventDefault()
    if (!form.amount || !form.date) { toast.error('Fill required fields'); return }
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (editing) {
        const updated = await incomeService.updateTransaction(editing.id, payload)
        setTransactions(prev => prev.map(t => t.id === editing.id ? updated : t))
        toast.success('Income updated')
      } else {
        const created = await incomeService.createTransaction(user.id, payload)
        setTransactions(prev => [created, ...prev])
        toast.success('Income recorded')
      }
      setModalOpen(false)
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income record?')) return
    try {
      await incomeService.deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0)
  const months = Array.from({length:12},(_,i)=>({value:i+1,label:new Date(2000,i,1).toLocaleString('default',{month:'long'})}))

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Income</h1><p className="page-subtitle">Track all your income sources</p></div>
        <button className="btn btn--primary" onClick={openAdd}><Plus size={16}/>Add Income</button>
      </div>

      {transactions.length > 0 && (
        <div className="summary-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))'}}>
          <div className="card"><div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:4}}>Total Income</div><div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--success)'}}>{formatCurrency(total)}</div></div>
          <div className="card"><div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:4}}>Transactions</div><div style={{fontSize:'1.5rem',fontWeight:800}}>{transactions.length}</div></div>
        </div>
      )}

      <div className="filters-bar">
        <select className="form-select" style={{width:'auto'}} value={monthFilter} onChange={e=>setMonthFilter(Number(e.target.value))}>{months.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select>
        <select className="form-select" style={{width:'auto'}} value={yearFilter} onChange={e=>setYearFilter(Number(e.target.value))}>{[2023,2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</select>
      </div>

      {loading ? (
        <div className="app-loading" style={{minHeight:'40vh'}}><div className="spinner"/></div>
      ) : transactions.length === 0 ? (
        <EmptyState icon="💰" title="No income recorded" description="Add your salary, freelancing income, dividends, and other income sources." action={<button className="btn btn--primary" onClick={openAdd}><Plus size={16}/>Add Income</button>}/>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Source</th><th>Type</th><th>Description</th><th>Recurring</th><th>Amount</th><th>Actions</th></tr></thead>
            <tbody>
              {transactions.map(t=>(
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                  <td className="font-semibold">{t.source_name}</td>
                  <td><span className="badge badge--info">{INCOME_TYPES.find(i=>i.value===t.source_type)?.label||t.source_type}</span></td>
                  <td className="truncate" style={{maxWidth:200}}>{t.description||'-'}</td>
                  <td>{t.is_recurring?<span className="badge badge--primary">{t.frequency}</span>:'-'}</td>
                  <td className="amount-positive">+{formatCurrency(t.amount)}</td>
                  <td><div className="actions"><button className="btn btn--ghost btn--sm" onClick={()=>openEdit(t)}><Edit2 size={14}/></button><button className="btn btn--danger btn--sm" onClick={()=>handleDelete(t.id)}><Trash2 size={14}/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editing?'Edit Income':'Add Income'} size="md">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Amount (₹) *</label><input type="number" className="form-input" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="50000" min="0" required/></div>
            <div className="form-field"><label className="form-label">Date *</label><input type="date" className="form-input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></div>
            <div className="form-field"><label className="form-label">Source Type</label><select className="form-select" value={form.source_type} onChange={e=>setForm({...form,source_type:e.target.value})}>{INCOME_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Source Name</label><input className="form-input" value={form.source_name} onChange={e=>setForm({...form,source_name:e.target.value})} placeholder="e.g. Company Salary"/></div>
            <div className="form-field" style={{gridColumn:'1/-1'}}><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Optional description"/></div>
            <div className="form-field" style={{gridColumn:'1/-1'}}><label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:'0.875rem',fontWeight:600}}><input type="checkbox" checked={form.is_recurring} onChange={e=>setForm({...form,is_recurring:e.target.checked})}/> Recurring Income</label></div>
            {form.is_recurring && <div className="form-field"><label className="form-label">Frequency</label><select className="form-select" value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div>}
          </div>
          <div className="form-actions"><button type="button" className="btn btn--outline" onClick={()=>setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn--primary" disabled={saving}>{saving?'Saving...':editing?'Update':'Add Income'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
