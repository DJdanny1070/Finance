/**
 * Financial calculation utilities
 */

export const calculateNetWorth = (totalAssets, totalLiabilities) => {
  return Number(totalAssets) - Number(totalLiabilities)
}

export const calculateSavings = (income, expenses) => {
  return Math.max(0, Number(income) - Number(expenses))
}

export const calculateSavingsRate = (income, expenses) => {
  if (!income || income <= 0) return 0
  const savings = Number(income) - Number(expenses)
  return Math.max(0, (savings / Number(income)) * 100)
}

export const calculateHealthScore = ({
  monthlyIncome,
  monthlyExpenses,
  totalAssets,
  totalLiabilities,
  monthlyEMI,
  emergencyFund,
  monthlyEssentialExpenses,
  emergencyFundMonths,
  budgets,         // { category: budgetAmount }
  categorySpending, // { category: spentAmount }
  goals,           // [{ target_amount, current_amount }]
  netWorthSnapshots, // sorted by date asc
}) => {
  const scores = {}

  // 1. Savings Rate Score (25 points)
  const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses)
  if (savingsRate >= 30) scores.savings_rate = 25
  else if (savingsRate >= 20) scores.savings_rate = 20
  else if (savingsRate >= 10) scores.savings_rate = 12
  else if (savingsRate >= 5) scores.savings_rate = 6
  else scores.savings_rate = 0

  // 2. Debt-to-Income Score (20 points)
  const emi = Number(monthlyEMI) || 0
  const dtiRatio = monthlyIncome > 0 ? emi / monthlyIncome : 1
  if (dtiRatio <= 0) scores.debt = 20
  else if (dtiRatio <= 0.15) scores.debt = 18
  else if (dtiRatio <= 0.30) scores.debt = 12
  else if (dtiRatio <= 0.50) scores.debt = 6
  else scores.debt = 0

  // 3. Emergency Fund Score (20 points)
  const targetEF = Number(monthlyEssentialExpenses) * Number(emergencyFundMonths || 6)
  const currentEF = Number(emergencyFund) || 0
  if (targetEF <= 0) scores.emergency_fund = 20
  else {
    const efRatio = currentEF / targetEF
    scores.emergency_fund = Math.min(20, Math.round(efRatio * 20))
  }

  // 4. Net Worth Trend Score (15 points)
  if (!netWorthSnapshots || netWorthSnapshots.length < 2) {
    scores.net_worth_trend = 8 // neutral
  } else {
    const first = netWorthSnapshots[0].net_worth
    const last = netWorthSnapshots[netWorthSnapshots.length - 1].net_worth
    if (last > first * 1.05) scores.net_worth_trend = 15
    else if (last >= first) scores.net_worth_trend = 10
    else if (last >= first * 0.95) scores.net_worth_trend = 5
    else scores.net_worth_trend = 0
  }

  // 5. Budget Adherence Score (10 points)
  const budgetCategories = Object.keys(budgets || {})
  if (budgetCategories.length === 0) {
    scores.budget_adherence = 5 // neutral
  } else {
    const within = budgetCategories.filter(cat => {
      const spent = Number((categorySpending || {})[cat] || 0)
      const budget = Number(budgets[cat])
      return spent <= budget
    })
    scores.budget_adherence = Math.round((within.length / budgetCategories.length) * 10)
  }

  // 6. Goal Progress Score (10 points)
  const activeGoals = (goals || []).filter(g => !g.is_completed)
  if (activeGoals.length === 0) {
    scores.goal_progress = 5 // neutral
  } else {
    const avgProgress = activeGoals.reduce((sum, g) => {
      return sum + Math.min(1, Number(g.current_amount) / Number(g.target_amount))
    }, 0) / activeGoals.length
    scores.goal_progress = Math.round(avgProgress * 10)
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  return { total: Math.min(100, Math.round(total)), ...scores }
}

export const generateRecommendations = ({
  monthlyIncome,
  monthlyExpenses,
  totalAssets,
  totalLiabilities,
  monthlyEMI,
  emergencyFund,
  monthlyEssentialExpenses,
  emergencyFundMonths,
  categorySpending,
  budgets,
  goals,
  netWorthSnapshots,
  savingsRate,
}) => {
  const recs = []

  // Savings rate
  if (monthlyIncome > 0) {
    if (savingsRate < 10) {
      recs.push({
        type: 'warning',
        title: 'Low Savings Rate',
        message: `Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income. Consider reviewing your discretionary spending to increase savings.`,
        priority: 'high',
      })
    } else if (savingsRate < 20) {
      recs.push({
        type: 'info',
        title: 'Improve Savings Rate',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Gradually increasing it toward 20% could significantly improve your long-term financial position.`,
        priority: 'medium',
      })
    }
  }

  // Emergency fund
  const targetEF = Number(monthlyEssentialExpenses) * Number(emergencyFundMonths || 6)
  if (targetEF > 0 && Number(emergencyFund) < targetEF * 0.5) {
    recs.push({
      type: 'warning',
      title: 'Build Your Emergency Fund',
      message: `Your emergency fund is below 50% of the recommended ${emergencyFundMonths || 6}-month target of ₹${targetEF.toLocaleString('en-IN')}. Consider allocating a portion of your monthly savings toward it.`,
      priority: 'high',
    })
  }

  // Debt-to-income
  const dtiRatio = monthlyIncome > 0 ? (Number(monthlyEMI) / monthlyIncome) * 100 : 0
  if (dtiRatio > 40) {
    recs.push({
      type: 'warning',
      title: 'High Debt Payments',
      message: `Your EMI payments are ${dtiRatio.toFixed(1)}% of your monthly income, which is above the recommended 35%. Consider prioritizing high-interest debt repayment.`,
      priority: 'high',
    })
  }

  // Spending categories vs budget
  if (budgets && categorySpending) {
    Object.entries(budgets).forEach(([cat, budget]) => {
      const spent = Number(categorySpending[cat] || 0)
      if (spent > budget) {
        const over = spent - Number(budget)
        recs.push({
          type: 'alert',
          title: `Budget Exceeded: ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
          message: `You exceeded your ${cat} budget by ₹${over.toLocaleString('en-IN')}. Consider reducing spending in this category next month.`,
          priority: 'medium',
        })
      }
    })
  }

  // Net worth trend
  if (netWorthSnapshots && netWorthSnapshots.length >= 2) {
    const first = netWorthSnapshots[0].net_worth
    const last = netWorthSnapshots[netWorthSnapshots.length - 1].net_worth
    if (last > first * 1.03) {
      recs.push({
        type: 'success',
        title: 'Net Worth Growing',
        message: 'Your net worth has been growing consistently. Keep maintaining your current savings and investment pattern.',
        priority: 'low',
      })
    } else if (last < first) {
      recs.push({
        type: 'warning',
        title: 'Net Worth Declining',
        message: 'Your net worth has decreased recently. Review your expenses and consider reducing liabilities to reverse this trend.',
        priority: 'high',
      })
    }
  }

  // Total liabilities high vs assets
  if (totalAssets > 0 && totalLiabilities > totalAssets * 0.5) {
    recs.push({
      type: 'info',
      title: 'High Liability Ratio',
      message: `Your liabilities are ${((totalLiabilities / totalAssets) * 100).toFixed(1)}% of your total assets. Focus on reducing debt to improve your financial position.`,
      priority: 'medium',
    })
  }

  // Goal reminders
  if (goals && goals.length > 0) {
    const nearDeadline = goals.filter(g => {
      if (!g.target_date || g.is_completed) return false
      const daysLeft = Math.ceil((new Date(g.target_date) - new Date()) / (1000 * 60 * 60 * 24))
      return daysLeft > 0 && daysLeft <= 90 && (g.current_amount / g.target_amount) < 0.8
    })
    nearDeadline.forEach(g => {
      const remaining = g.target_amount - g.current_amount
      recs.push({
        type: 'info',
        title: `Goal Approaching: ${g.name}`,
        message: `Your goal "${g.name}" is due soon and you need ₹${remaining.toLocaleString('en-IN')} more to reach it. Consider increasing your monthly contribution.`,
        priority: 'medium',
      })
    })
  }

  return recs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })
}

export const projectNetWorth = (currentNetWorth, monthlySavings, months = 60, annualGrowthRate = 0.08) => {
  const points = []
  let nw = Number(currentNetWorth)
  const monthlyRate = annualGrowthRate / 12
  for (let i = 0; i <= months; i++) {
    points.push({ month: i, netWorth: Math.round(nw) })
    nw = nw * (1 + monthlyRate) + Number(monthlySavings)
  }
  return points
}
