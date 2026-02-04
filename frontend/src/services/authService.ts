import api from './api'
import { useAuthStore, User } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'

interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  password: string
  date_of_birth: string
}

interface LoginPayload {
  email: string
  password: string
}

interface VerifyEmailPayload {
  email: string
  code: string
}

interface PasswordResetRequestPayload {
  email: string
}

interface PasswordResetConfirmPayload {
  email: string
  code: string
  new_password: string
}

interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
  message?: string
}

class AuthService {
  async register(data: RegisterPayload): Promise<User> {
    try {
      const response = await api.post<User>('/auth/register', {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
      })

      // Store email in session for verification page
      sessionStorage.setItem('pending_email', data.email)

      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Registration failed'
      throw new Error(message)
    }
  }

  async login(data: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        email: data.email,
        password: data.password,
      })

      const { access_token, refresh_token, user } = response.data

      // Store tokens and user in store and localStorage
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(user))

      useAuthStore.setState({
        accessToken: access_token,
        refreshToken: refresh_token,
        user,
        error: null,
      })

      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed'
      useAuthStore.setState({ error: message })
      throw new Error(message)
    }
  }

  async verifyEmail(data: VerifyEmailPayload): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/verify-email', {
        email: data.email,
        code: data.code,
      })

      const { access_token, refresh_token, user } = response.data

      // Store tokens and user
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(user))

      useAuthStore.setState({
        accessToken: access_token,
        refreshToken: refresh_token,
        user,
        error: null,
      })

      sessionStorage.removeItem('pending_email')

      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Email verification failed'
      useAuthStore.setState({ error: message })
      throw new Error(message)
    }
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/auth/resend-verification', {
        email,
      })
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to resend verification email'
      throw new Error(message)
    }
  }

  logout(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('profile-storage')
    sessionStorage.removeItem('pending_email')
    sessionStorage.removeItem('pending_user')
    sessionStorage.removeItem('pending_reset_email')

    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    })

    useProfileStore.setState({
      profile: {
        avatar_url: '',
        headline: '',
        phone: '',
        location: '',
        time_zone: '',
        current_title: '',
        current_company: '',
        experience_level: '',
        preferred_role: '',
        portfolio_url: '',
        linkedin_url: '',
        github_url: '',
        skills: '',
        bio: '',
        open_to_work: true,
        education_level: '',
        school: '',
        graduation_year: '',
        certifications: '',
        work_authorization: '',
        visa_sponsorship_required: false,
        years_experience: '',
        industry: '',
        languages: '',
        relocation_open: false,
        remote_preference: '',
        salary_expectation: '',
        notice_period: '',
      },
      loaded: false,
    })
  }

  async requestPasswordReset(data: PasswordResetRequestPayload): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/auth/request-password-reset', {
        email: data.email,
      })
      sessionStorage.setItem('pending_reset_email', data.email)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to send password reset email'
      throw new Error(message)
    }
  }

  async resetPassword(data: PasswordResetConfirmPayload): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/auth/reset-password', {
        email: data.email,
        code: data.code,
        new_password: data.new_password,
      })
      sessionStorage.removeItem('pending_reset_email')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Password reset failed'
      throw new Error(message)
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    const user = this.getCurrentUser()
    return !!token && !!user && user.email_verified
  }
}

export const authService = new AuthService()
