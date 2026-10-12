export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password) => {
  const errors = []
  if (password.length < 8) errors.push('At least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
  if (!/[0-9]/.test(password)) errors.push('One number')
  return errors
}

export const validateAmount = (amount) => {
  const num = parseFloat(amount)
  if (isNaN(num) || num <= 0) return 'Amount must be a positive number'
  return null
}

export const validateRequired = (value) => {
  if (!value || String(value).trim() === '') return 'This field is required'
  return null
}
