import { supabase } from './supabase'

export const liabilityService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(userId, liabilityData) {
    const { data, error } = await supabase
      .from('liabilities')
      .insert([{ user_id: userId, ...liabilityData }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, liabilityData) {
    const { data, error } = await supabase
      .from('liabilities')
      .update({ ...liabilityData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('liabilities').delete().eq('id', id)
    if (error) throw error
  },

  async getTotal(userId) {
    const { data, error } = await supabase
      .from('liabilities')
      .select('remaining_amount')
      .eq('user_id', userId)
    if (error) throw error
    return (data || []).reduce((sum, l) => sum + Number(l.remaining_amount), 0)
  },
}