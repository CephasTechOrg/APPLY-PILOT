import api from './api'
import { ProfileData } from '@/store/profileStore'

interface ProfileResponse extends ProfileData {
  id?: number
  user_id?: number
  created_at?: string
  updated_at?: string
}

const normalizeProfile = (data: ProfileResponse): ProfileData => ({
  id: data.id,
  user_id: data.user_id,
  created_at: data.created_at,
  updated_at: data.updated_at,
  avatar_url: data.avatar_url ?? '',
  headline: data.headline ?? '',
  phone: data.phone ?? '',
  location: data.location ?? '',
  time_zone: data.time_zone ?? '',
  current_title: data.current_title ?? '',
  current_company: data.current_company ?? '',
  experience_level: data.experience_level ?? '',
  preferred_role: data.preferred_role ?? '',
  portfolio_url: data.portfolio_url ?? '',
  linkedin_url: data.linkedin_url ?? '',
  github_url: data.github_url ?? '',
  skills: data.skills ?? '',
  bio: data.bio ?? '',
  open_to_work: data.open_to_work ?? true,
  education_level: data.education_level ?? '',
  school: data.school ?? '',
  graduation_year: data.graduation_year ? String(data.graduation_year) : '',
  certifications: data.certifications ?? '',
  work_authorization: data.work_authorization ?? '',
  visa_sponsorship_required: data.visa_sponsorship_required ?? false,
  years_experience: data.years_experience ? String(data.years_experience) : '',
  industry: data.industry ?? '',
  languages: data.languages ?? '',
  relocation_open: data.relocation_open ?? false,
  remote_preference: data.remote_preference ?? '',
  salary_expectation: data.salary_expectation ?? '',
  notice_period: data.notice_period ?? '',
})

class ProfileService {
  async getProfile(): Promise<ProfileData> {
    try {
      const response = await api.get<ProfileResponse>('/profile/me')
      return normalizeProfile(response.data)
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to load profile'
      throw new Error(message)
    }
  }

  async updateProfile(payload: Partial<ProfileData>): Promise<ProfileData> {
    try {
      const response = await api.put<ProfileResponse>('/profile/me', payload)
      return normalizeProfile(response.data)
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to save profile'
      throw new Error(message)
    }
  }

  async uploadAvatar(file: File): Promise<ProfileData> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post<ProfileResponse>('/profile/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return normalizeProfile(response.data)
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to upload avatar'
      throw new Error(message)
    }
  }
}

export const profileService = new ProfileService()
