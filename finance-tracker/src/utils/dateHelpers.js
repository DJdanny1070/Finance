import { format, startOfMonth, endOfMonth, subMonths, isValid } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (!isValid(d)) return ''
  return format(d, 'dd MMM yyyy')
}

export const formatDateInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (!isValid(d)) return ''
  return format(d, 'yyyy-MM-dd')
}

export const getCurrentMonth = () => new Date().getMonth() + 1
export const getCurrentYear = () => new Date().getFullYear()

export const getMonthRange = (month, year) => ({
  start: format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd'),
  end: format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd'),
})

export const getLastNMonths = (n) => {
  const months = []
  for (let i = n - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i)
    months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: format(d, 'MMM yyyy') })
  }
  return months
}

export const getMonthLabel = (month, year) => {
  return format(new Date(year, month - 1), 'MMM yyyy')
}

export const today = () => format(new Date(), 'yyyy-MM-dd')
