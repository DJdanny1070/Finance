import { supabase } from './supabase'

export const goalService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(userId, goalData) {
    const { data, error } = await supabase
      .from('financial_goals')
      .insert([{ user_id: userId, ...goalData }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, goalData) {
    const { data, error } = await supabase
      .from('financial_goals')
      .update({ ...goalData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('financial_goals').delete().eq('id', id)
    if (error) throw error
  },
}