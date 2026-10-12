import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowUpDown, TrendingUp, TrendingDown,
  Landmark, CreditCard, Target, PieChart, LineChart,
  Lightbulb, User, X, DollarSign, Wallet
} from 'lucide-react'
import { authService } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowUpDown, label: 'Transactions' },
  { to: '/income', icon: TrendingUp, label: 'Income' },
  { to: '/expenses', icon: TrendingDown, label: 'Expenses' },
  { to: '/assets', icon: Landmark, label: 'Assets' },
  { to: '/liabilities', icon: CreditCard, label: 'Liabilities' },
  { to: '/budgets', icon: Wallet, label: 'Budgets' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/analytics', icon: PieChart, label: 'Analytics' },
  { to: '/networth', icon: LineChart, label: 'Net Worth' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authService.signOut()
      navigate('/login')
    } catch {
      toast.error('Logout failed')
    }
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <DollarSign size={24} />
            <span>FinanceFlow</span>
          </div>
          <button className="sidebar-close" onClick={onClose}><X size={20} /></button>
        </div>

        {profile && (
          <div className="sidebar-user">
            <div className="avatar">{(profile.full_name || 'U')[0].toUpperCase()}</div>
            <div>
              <div className="sidebar-user-name">{profile.full_name}</div>
              <div className="sidebar-user-role">{profile.occupation || 'User'}</div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </aside>
    </>
  )
}
