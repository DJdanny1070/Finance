import { supabase } from './supabase'

export const incomeService = {
  // Income Sources
  async getSources(userId) {
    const { data, error } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async createSource(userId, sourceData) {
    const { data, error } = await supabase
      .from('income_sources')
      .insert([{ user_id: userId, ...sourceData }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateSource(id, sourceData) {
    const { data, error } = await supabase
      .from('income_sources')
      .update({ ...sourceData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteSource(id) {
    const { error } = await supabase.from('income_sources').delete().eq('id', id)
    if (error) throw error
  },

  // Income Transactions
  async getTransactions(userId, filters = {}) {
    let query = supabase
      .from('income_transactions')
      .select('*')
      .eq('user_id', userId)

    if (filters.startDate) query = query.gte('date', filters.startDate)
    if (filters.endDate) query = query.lte('date', filters.endDate)
    if (filters.sourceType) query = query.eq('source_type', filters.sourceType)

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
      .from('income_transactions')
      .insert([{ user_id: userId, ...txData }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateTransaction(id, txData) {
    const { data, error } = await supabase
      .from('income_transactions')
      .update({ ...txData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteTransaction(id) {
    const { error } = await supabase.from('income_transactions').delete().eq('id', id)
    if (error) throw error
  },

  async getMonthlyTotal(userId, month, year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('income_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error
    return (data || []).reduce((sum, t) => sum + Number(t.amount), 0)
  },
}