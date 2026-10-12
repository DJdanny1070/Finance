import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'
import { profileService } from '../services/profileService'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    // Get initial session
    authService.getSession().then(session => {
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) loadProfile(user.id)
  }, [user])

  const loadProfile = async (userId) => {
    setProfileLoading(true)
    try {
      const p = await profileService.getProfile(userId)
      setProfile(p)
    } catch (err) {
      console.error('Profile load error:', err)
    } finally {
      setProfileLoading(false)
    }
  }

  const refreshProfile = () => user && loadProfile(user.id)

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    refreshProfile,
    isAuthenticated: !!user,
    onboardingComplete: profile?.onboarding_completed === true,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
