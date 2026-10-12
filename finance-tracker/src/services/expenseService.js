import { supabase } from './supabase'

export const expenseService = {
  async getTransactions(userId, filters = {}) {
    let query = supabase
      .from('expense_transactions')
      .select('*')
      .eq('user_id', userId)

    if (filters.startDate) query = query.gte('date', filters.startDate)
    if (filters.endDate) query = query.lte('date', filters.endDate)
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.paymentMethod) query = query.eq('payment_method', filters.paymentMethod)
    if (filters.payment_method) query = query.eq('payment_method', filters.payment_method)
    if (filters.search) query = query.ilike('description', `%${filters.search}%`)

    const { data, error } = await query.order('date', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getMonthlyTransactions(userId, month, year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    return this.getTransactions(userId, { startDate, endDate })
  },

  async createTransaction(userId, txData) {
    const { data, error } = await supabase
      .from('expense_transactions')
      .insert([{ user_id: userId, ...txData }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateTransaction(id, txData) {
    const { data, error } = await supabase
      .from('expense_transactions')
      .update({ ...txData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteTransaction(id) {
    const { error } = await supabase.from('expense_transactions').delete().eq('id', id)
    if (error) throw error
  },

  async getMonthlyTotal(userId, month, year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('expense_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error
    return (data || []).reduce((sum, t) => sum + Number(t.amount), 0)
  },

  async getCategoryTotals(userId, month, year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('expense_transactions')
      .select('category, amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error
    const totals = {}
    ;(data || []).forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + Number(t.amount)
    })
    return totals
  },
}