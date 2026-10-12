import { supabase } from './supabase'

export const notificationService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data || []
  },

  async markAsRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) throw error
  },

  async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
    if (error) throw error
  },

  async create(userId, type, title, message) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, type, title, message }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) throw error
  },

  getUnreadCount(notifications) {
    return (notifications || []).filter(n => !n.is_read).length
  },
}