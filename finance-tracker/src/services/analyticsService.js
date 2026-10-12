import { supabase } from './supabase'
import { incomeService } from './incomeService'
import { expenseService } from './expenseService'

export const analyticsService = {
  async getMonthlyComparison(userId, months = 6) {
    const result = []
    const now = new Date()
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const [income, expenses] = await Promise.all([
        incomeService.getMonthlyTotal(userId, m, y),
        expenseService.getMonthlyTotal(userId, m, y),
      ])
      result.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year: y,
        income,
        expenses,
        savings: income - expenses,
      })
    }
    return result
  },

  async getExpenseCategoryBreakdown(userId, month, year) {
    const totals = await expenseService.getCategoryTotals(userId, month, year)
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  },

  async getSavingsTrend(userId, months = 6) {
    const data = await this.getMonthlyComparison(userId, months)
    return data.map(d => ({ month: d.month, savings: d.savings }))
  },
}