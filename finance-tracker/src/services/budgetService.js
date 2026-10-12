import { supabase } from './supabase'

export const budgetService = {
  async getMonthlyBudgets(userId, month, year) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
    if (error) throw error
    return data || []
  },

  async upsert(userId, category, amount, month, year) {
    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        { user_id: userId, category, amount, month, year, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,category,month,year' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) throw error
  },
}