import { supabase } from './supabase'

export const assetService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(userId, assetData) {
    const { data, error } = await supabase
      .from('assets')
      .insert([{ user_id: userId, ...assetData }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, assetData) {
    const { data, error } = await supabase
      .from('assets')
      .update({ ...assetData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('assets').delete().eq('id', id)
    if (error) throw error
  },

  async getTotal(userId) {
    const { data, error } = await supabase
      .from('assets')
      .select('current_value')
      .eq('user_id', userId)
    if (error) throw error
    return (data || []).reduce((sum, a) => sum + Number(a.current_value), 0)
  },
}