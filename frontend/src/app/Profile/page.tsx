'use client'

import React, { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import AuthGate from '@/components/auth/AuthGate'
import ImageViewer from '@/components/ui/ImageViewer'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore, ProfileData } from '@/store/profileStore'
import { profileService } from '@/services/profileService'

const ProfilePage = () => {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const profile = useProfileStore((state) => state.profile)
  const setProfile = useProfileStore((state) => state.setProfile)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const resetProfile = useProfileStore((state) => state.resetProfile)

  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)

  const completion = useMemo(() => {
    const fields: (keyof ProfileData)[] = [
      'headline',
      'location',
      'current_title',
      'current_company',
      'experience_level',
      'preferred_role',
      'portfolio_url',
      'linkedin_url',
      'skills',
      'bio',
      'education_level',
      'school',
      'graduation_year',
      'certifications',
      'work_authorization',
      'years_experience',
      'industry',
      'languages',
      'remote_preference',
      'salary_expectation',
    ]
    const completed = fields.filter((field) => {
      const value = profile[field]
      return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
    }).length

    return Math.round((completed / fields.length) * 100)
  }, [profile])

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.target
    const name = target.name as keyof ProfileData
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value
    updateProfile({ [name]: value } as Partial<ProfileData>)
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please upload an image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be smaller than 2MB.')
      return
    }

    setIsUploading(true)
    setAvatarError(null)
    profileService
      .uploadAvatar(file)
      .then((updated) => {
        setProfile(updated)
      })
      .catch((error: any) => {
        setAvatarError(error instanceof Error ? error.message : 'Failed to upload image.')
      })
      .finally(() => {
        setIsUploading(false)
      })
  }

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    const payload: Partial<ProfileData> = {
      headline: profile.headline,
      phone: profile.phone,
      location: profile.location,
      time_zone: profile.time_zone,
      current_title: profile.current_title,
      current_company: profile.current_company,
      experience_level: profile.experience_level,
      preferred_role: profile.preferred_role,
      portfolio_url: profile.portfolio_url,
      linkedin_url: profile.linkedin_url,
      github_url: profile.github_url,
      skills: profile.skills,
      bio: profile.bio,
      open_to_work: profile.open_to_work,
      education_level: profile.education_level,
      school: profile.school,
      graduation_year: profile.graduation_year,
      certifications: profile.certifications,
      work_authorization: profile.work_authorization,
      visa_sponsorship_required: profile.visa_sponsorship_required,
      years_experience: profile.years_experience,
      industry: profile.industry,
      languages: profile.languages,
      relocation_open: profile.relocation_open,
      remote_preference: profile.remote_preference,
      salary_expectation: profile.salary_expectation,
      notice_period: profile.notice_period,
    }

    const normalizedPayload: Partial<ProfileData> = {
      ...payload,
      graduation_year: profile.graduation_year ? String(profile.graduation_year).trim() : '',
      years_experience: profile.years_experience ? String(profile.years_experience).trim() : '',
    }

    const toNumberOrNull = (value: string | number | undefined | null): number | null => {
      if (value === undefined || value === null) return null
      const trimmed = String(value).trim()
      if (!trimmed) return null
      const parsed = Number(trimmed)
      return Number.isFinite(parsed) ? parsed : null
    }

    const apiPayload = {
      ...normalizedPayload,
      graduation_year: toNumberOrNull(normalizedPayload.graduation_year) ?? undefined,
      years_experience: toNumberOrNull(normalizedPayload.years_experience) ?? undefined,
    }

    setIsSaving(true)
    setSaveError(null)
    profileService
      .updateProfile(apiPayload)
      .then((updated) => {
        setProfile(updated)
        setSaveMessage('Profile saved successfully.')
        window.setTimeout(() => setSaveMessage(null), 2500)
      })
      .catch((error: any) => {
        setSaveError(error instanceof Error ? error.message : 'Failed to save profile.')
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  const handleRemoveAvatar = () => {
    setIsSaving(true)
    setSaveError(null)
    profileService
      .updateProfile({ avatar_url: '' })
      .then((updated) => {
        setProfile(updated)
      })
      .catch((error: any) => {
        setSaveError(error instanceof Error ? error.message : 'Failed to remove avatar.')
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  const handleReset = () => {
    setIsLoading(true)
    setSaveError(null)
    profileService
      .getProfile()
      .then((data) => {
        setProfile(data)
      })
      .catch((error: any) => {
        setSaveError(error instanceof Error ? error.message : 'Failed to reload profile.')
        resetProfile()
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    let active = true
    if (!accessToken || !user?.email_verified) return

    setIsLoading(true)
    profileService
      .getProfile()
      .then((data) => {
        if (active) {
          setProfile(data)
        }
      })
      .catch((error: any) => {
        if (active) {
          setSaveError(error instanceof Error ? error.message : 'Failed to load profile.')
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [accessToken, user, setProfile])

  return (
    <AppShell title="Profile" subtitle="Manage your personal and professional details" showSearch={false} showActions={false}>
      <AuthGate>
        <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
          <aside className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div
                onClick={() => profile.avatar_url && setIsImageViewerOpen(true)}
                className="size-16 rounded-2xl bg-gray-200 bg-cover bg-center border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                style={profile.avatar_url ? { backgroundImage: `url("${encodeURI(profile.avatar_url)}")` } : undefined}
              >
                {!profile.avatar_url && (
                  <span className="material-symbols-outlined text-2xl text-gray-500">person</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white">
                  {user?.full_name ?? 'Profile'}
                </h3>
                <p className="text-sm text-text-secondary">{user?.email ?? 'email@applypilot.com'}</p>
                <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-2">
                  {user?.email_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-text-main dark:text-white">Profile photo</p>
                <p className="text-xs text-text-secondary">PNG or JPG up to 2MB.</p>
              </div>
              <input
                className="w-full text-xs text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUploading}
              />
              {isUploading && <p className="text-xs text-text-secondary">Uploading photo...</p>}
              {avatarError && <p className="text-xs text-red-500">{avatarError}</p>}
              <button
                type="button"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={handleRemoveAvatar}
              >
                Remove photo
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-main dark:text-white">Profile completeness</p>
                <p className="text-sm font-bold text-primary">{completion}%</p>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${completion}%` }}></div>
              </div>
              <p className="text-xs text-text-secondary">Complete more fields to improve personalization.</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-text-main dark:text-white">Account details</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary">First name</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs"
                    value={user?.first_name ?? ''}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary">Last name</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs"
                    value={user?.last_name ?? ''}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary">Date of birth</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs"
                    type="date"
                    value={user?.date_of_birth ?? ''}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </aside>

          <form className="flex flex-col gap-6" onSubmit={handleSave}>
            <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white">Professional summary</h3>
                <p className="text-sm text-text-secondary">Tell recruiters what you do best.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Headline</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="headline"
                    placeholder="Full-stack engineer focused on fintech"
                    value={profile.headline}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Current role</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="current_title"
                    placeholder="Senior Software Engineer"
                    value={profile.current_title}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Company</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="current_company"
                    placeholder="ApplyPilot"
                    value={profile.current_company}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Experience level</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="experience_level"
                    value={profile.experience_level}
                    onChange={handleFieldChange}
                  >
                    <option value="">Select level</option>
                    <option value="Entry">Entry</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-text-main dark:text-white">Professional bio</label>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm min-h-[120px]"
                    name="bio"
                    placeholder="Share a short summary of your background and impact."
                    value={profile.bio}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>
            </section>

            <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white">Contact & links</h3>
                <p className="text-sm text-text-secondary">Standard recruiter-friendly profile details.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Phone</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="phone"
                    placeholder="+1 (555) 123-4567"
                    value={profile.phone}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Location</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="location"
                    placeholder="Accra, Ghana"
                    value={profile.location}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Time zone</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="time_zone"
                    value={profile.time_zone}
                    onChange={handleFieldChange}
                  >
                    <option value="">Select time zone</option>
                    <option value="GMT">GMT</option>
                    <option value="EST">EST</option>
                    <option value="CST">CST</option>
                    <option value="MST">MST</option>
                    <option value="PST">PST</option>
                    <option value="WAT">WAT</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Portfolio</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="portfolio_url"
                    placeholder="https://yourportfolio.com"
                    value={profile.portfolio_url}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">LinkedIn</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="linkedin_url"
                    placeholder="https://linkedin.com/in/yourname"
                    value={profile.linkedin_url}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">GitHub</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="github_url"
                    placeholder="https://github.com/yourname"
                    value={profile.github_url}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>
            </section>

            <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white">Education & credentials</h3>
                <p className="text-sm text-text-secondary">Help employers understand your background.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Education level</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="education_level"
                    value={profile.education_level}
                    onChange={handleFieldChange}
                  >
                    <option value="">Select level</option>
                    <option value="High School">High School</option>
                    <option value="Associate">Associate</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                    <option value="Bootcamp">Bootcamp</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">School</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="school"
                    placeholder="University or institution"
                    value={profile.school}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Graduation year</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="graduation_year"
                    type="number"
                    placeholder="2024"
                    value={profile.graduation_year}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Languages</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="languages"
                    placeholder="English, French"
                    value={profile.languages}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-text-main dark:text-white">Certifications</label>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm min-h-[100px]"
                    name="certifications"
                    placeholder="AWS Solutions Architect, PMP, etc."
                    value={profile.certifications}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>
            </section>

            <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white">Eligibility & work style</h3>
                <p className="text-sm text-text-secondary">Common details recruiters request.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Work authorization</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="work_authorization"
                    value={profile.work_authorization}
                    onChange={handleFieldChange}
                  >
                    <option value="">Select authorization</option>
                    <option value="Citizen">Citizen</option>
                    <option value="Permanent Resident">Permanent Resident</option>
                    <option value="Visa Holder">Visa Holder</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Visa sponsorship required</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    value={profile.visa_sponsorship_required ? 'yes' : 'no'}
                    onChange={(event) =>
                      updateProfile({ visa_sponsorship_required: event.target.value === 'yes' })
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Remote preference</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="remote_preference"
                    value={profile.remote_preference}
                    onChange={handleFieldChange}
                  >
                    <option value="">Select preference</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Open to relocation</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    value={profile.relocation_open ? 'yes' : 'no'}
                    onChange={(event) =>
                      updateProfile({ relocation_open: event.target.value === 'yes' })
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Industry focus</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="industry"
                    placeholder="Fintech, Healthtech, etc."
                    value={profile.industry}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Years of experience</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="years_experience"
                    type="number"
                    placeholder="5"
                    value={profile.years_experience}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>
            </section>

            <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white">Preferences</h3>
                <p className="text-sm text-text-secondary">Helps ApplyPilot tailor recommendations.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Preferred role</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="preferred_role"
                    placeholder="Product Manager"
                    value={profile.preferred_role}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Open to work</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="open_to_work"
                    value={profile.open_to_work ? 'yes' : 'no'}
                    onChange={(event) =>
                      updateProfile({ open_to_work: event.target.value === 'yes' })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-text-main dark:text-white">Skills</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="skills"
                    placeholder="React, FastAPI, PostgreSQL"
                    value={profile.skills}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>
            </section>

            <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white">Compensation & availability</h3>
                <p className="text-sm text-text-secondary">Optional but common in hiring workflows.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Salary expectation</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="salary_expectation"
                    placeholder="$90k - $110k"
                    value={profile.salary_expectation}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-white">Notice period</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
                    name="notice_period"
                    value={profile.notice_period}
                    onChange={handleFieldChange}
                  >
                    <option value="">Select notice period</option>
                    <option value="Immediate">Immediate</option>
                    <option value="2 weeks">2 weeks</option>
                    <option value="1 month">1 month</option>
                    <option value="3 months">3 months</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="submit"
                className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save profile'}
              </button>
              <button
                type="button"
                className="px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-main hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={handleReset}
              >
                Reset fields
              </button>
              {saveMessage && <p className="text-sm text-primary font-semibold">{saveMessage}</p>}
              {saveError && <p className="text-sm text-red-500 font-semibold">{saveError}</p>}
            </div>
            {isLoading && (
              <p className="text-xs text-text-secondary">Loading profile data...</p>
            )}
          </form>
        </section>
        <ImageViewer
          isOpen={isImageViewerOpen}
          imageUrl={profile.avatar_url || ''}
          alt={`${user?.full_name ?? 'Profile'} avatar`}
          onClose={() => setIsImageViewerOpen(false)}
        />
      </AuthGate>
    </AppShell>
  )
}

export default ProfilePage
