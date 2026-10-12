import { supabase } from './supabase'
import { assetService } from './assetService'
import { liabilityService } from './liabilityService'

export const netWorthService = {
  async takeSnapshot(userId) {
    const totalAssets = await assetService.getTotal(userId)
    const totalLiabilities = await liabilityService.getTotal(userId)
    const netWorth = totalAssets - totalLiabilities

    const today = new Date().toISOString().split('T')[0]
    // Check if snapshot already exists for today
    const { data: existing } = await supabase
      .from('net_worth_snapshots')
      .select('id')
      .eq('user_id', userId)
      .eq('snapshot_date', today)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from('net_worth_snapshots')
        .update({ total_assets: totalAssets, total_liabilities: totalLiabilities, net_worth: netWorth })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('net_worth_snapshots')
        .insert([{ user_id: userId, total_assets: totalAssets, total_liabilities: totalLiabilities, net_worth: netWorth, snapshot_date: today }])
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  async getHistory(userId, days = 365) {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    const { data, error } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('snapshot_date', fromDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })
    if (error) throw error
    return data || []
  },

  async getAllHistory(userId) {
    const { data, error } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: true })
    if (error) throw error
    return data || []
  },
}