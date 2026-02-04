'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import StatCard from '@/components/dashboard/StatCard'
import { applicationService, Application } from '@/services/applicationService'
import { formatDistanceToNow } from 'date-fns'
import AuthGate from '@/components/auth/AuthGate'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import ResumePicker from '@/components/shared/ResumePicker'

const statusLabel: Record<string, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

const statusClasses: Record<string, string> = {
  saved: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const statusIcons: Record<string, string> = {
  saved: 'bookmark',
  applied: 'send',
  interview: 'calendar_month',
  offer: 'verified',
  rejected: 'close',
}

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

const createApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  job_title: z.string().min(1, 'Job title is required'),
  status: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected']).default('saved'),
  location: z.string().optional(),
  job_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  job_description: z.string().optional(),
  salary_range: z.string().optional(),
  notes: z.string().optional(),
  recruiter_name: z.string().optional(),
  recruiter_email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  recruiter_phone: z.string().optional(),
  applied_at: z.string().optional(),
  interview_date: z.string().optional(),
  follow_up_date: z.string().optional(),
  resume_id: z.number().nullable().optional(),
})

type CreateApplicationForm = z.infer<typeof createApplicationSchema>

const ApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateApplicationForm>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      status: 'saved',
    },
  })

  useEffect(() => {
    fetchApplications()
  }, [selectedStatus])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await applicationService.getApplications(selectedStatus || undefined)
      setApplications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusCounts = () => {
    return {
      total: applications.length,
      interview: applications.filter(app => app.status === 'interview').length,
      offer: applications.filter(app => app.status === 'offer').length,
    }
  }

  const counts = getStatusCounts()

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      app.company?.toLowerCase().includes(q) ||
      app.job_title?.toLowerCase().includes(q) ||
      app.location?.toLowerCase().includes(q)
    )
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  const openCreateModal = () => {
    setFormError(null)
    reset({ status: 'saved' })
    setIsCreateOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateOpen(false)
  }

  const onCreateSubmit = async (data: CreateApplicationForm) => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      // Ensure dates are in ISO format if provided
      const payload = {
        company: data.company.trim(),
        job_title: data.job_title.trim(),
        status: data.status,
        location: data.location?.trim() || undefined,
        job_url: data.job_url?.trim() || undefined,
        job_description: data.job_description?.trim() || undefined,
        salary_range: data.salary_range?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        recruiter_name: data.recruiter_name?.trim() || undefined,
        recruiter_email: data.recruiter_email?.trim() || undefined,
        recruiter_phone: data.recruiter_phone?.trim() || undefined,
        // Convert date strings to ISO datetime format (backend expects datetime)
        applied_at: data.applied_at ? `${data.applied_at}T00:00:00` : undefined,
        interview_date: data.interview_date ? `${data.interview_date}T00:00:00` : undefined,
        follow_up_date: data.follow_up_date ? `${data.follow_up_date}T00:00:00` : undefined,
      }
      await applicationService.createApplication(payload)
      closeCreateModal()
      await fetchApplications()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (applicationId: number, status: string) => {
    setStatusUpdatingId(applicationId)
    setError(null)
    try {
      const updated = await applicationService.updateApplication(applicationId, { status })
      setApplications((prev) => prev.map((app) => (app.id === applicationId ? updated : app)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const openDeleteModal = (application: Application) => {
    setDeleteError(null)
    setDeleteTarget(application)
  }

  const closeDeleteModal = () => {
    setDeleteTarget(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await applicationService.deleteApplication(deleteTarget.id)
      setApplications((prev) => prev.filter((app) => app.id !== deleteTarget.id))
      closeDeleteModal()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete application')
    } finally {
      setIsDeleting(false)
    }
  }
  return (
    <AppShell
      title="Applications"
      subtitle="Track every role in your pipeline"
      primaryActionLabel="New Application"
      onPrimaryAction={openCreateModal}
      primaryActionDisabled={isLoading}
    >
      <AuthGate>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Applications"
            value={counts.total}
            icon="work"
            iconColor="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Active Interviews"
            value={counts.interview}
            icon="video_camera_front"
            iconColor="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
          />
          <StatCard
            title="Offers"
            value={counts.offer}
            icon="verified"
            iconColor="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          />
        </section>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold">{error}</span>
            <button
              className="text-sm font-semibold hover:underline"
              onClick={fetchApplications}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-text-main dark:text-white">All Applications</h3>
              <p className="text-sm text-text-secondary">Latest roles and their status updates.</p>
              <p className="text-xs text-text-secondary mt-1">
                Showing {filteredApplications.length} of {applications.length}
              </p>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="md:hidden">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold w-full"
                >
                  {statusFilters.map((filter) => (
                    <option key={filter.value || 'all'} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden md:flex items-center gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value || 'all'}
                    type="button"
                    onClick={() => setSelectedStatus(filter.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      selectedStatus === filter.value
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white dark:bg-gray-900 text-text-secondary border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined text-[18px] text-text-secondary absolute left-3 top-2.5">
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search company, role, location"
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-text-main dark:text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={applications.length === 0}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Export
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-sm text-text-secondary">
              <span className="material-symbols-outlined animate-spin text-2xl mb-2">refresh</span>
              <p>Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3">work_off</span>
              <p className="text-sm text-text-secondary">No applications found. Create your first one!</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3">search_off</span>
              <p className="text-sm text-text-secondary">No matches for "{searchQuery}"</p>
              <button
                className="mt-3 text-xs font-semibold text-primary hover:underline"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApplications.map((app) => {
                const companyInitials = app.company
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
                
                return (
                  <Link key={app.id} href={`/Applications/${app.id}`} className="group">
                    <div className="h-full bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer flex flex-col">
                      {/* Header with company initials and status */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">
                            {companyInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-main dark:text-white truncate">{app.company}</p>
                            <p className="text-xs text-text-secondary truncate">{app.job_title}</p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                          open_in_new
                        </span>
                      </div>

                      {/* Location */}
                      {app.location && (
                        <div className="flex items-center gap-2 mb-3 text-xs text-text-secondary">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          <span className="truncate">{app.location}</span>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="h-px bg-gray-100 dark:bg-gray-800 my-3"></div>

                      {/* Key info - dates and recruiter */}
                      <div className="space-y-2 text-xs mb-4 flex-1">
                        {app.applied_at && (
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Applied</span>
                            <span className="font-medium text-text-main dark:text-white">{formatDate(app.applied_at)}</span>
                          </div>
                        )}
                        {app.interview_date && (
                          <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1.5 rounded-lg">
                            <span className="text-text-secondary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                              Interview
                            </span>
                            <span className="font-medium text-purple-700 dark:text-purple-300">{formatDate(app.interview_date)}</span>
                          </div>
                        )}
                        {app.recruiter_name && (
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Recruiter</span>
                            <span className="font-medium text-text-main dark:text-white truncate">{app.recruiter_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Status badge and salary */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${statusClasses[app.status]}`}>
                          <span className="material-symbols-outlined text-[14px]">{statusIcons[app.status]}</span>
                          {statusLabel[app.status]}
                        </div>
                        {app.salary_range && (
                          <span className="text-xs font-semibold text-text-secondary bg-gray-50 dark:bg-gray-900 px-2.5 py-1.5 rounded-lg">
                            {app.salary_range}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                        <span>View details</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-bold text-text-main dark:text-white">New Application</h3>
                  <p className="text-sm text-text-secondary">Add a role to your pipeline.</p>
                </div>
                <button
                  className="text-text-secondary hover:text-text-main"
                  onClick={closeCreateModal}
                  type="button"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form className="px-6 py-5 space-y-6 overflow-y-auto" onSubmit={handleSubmit(onCreateSubmit)}>
                {/* Required Section */}
                <div>
                  <h4 className="text-sm font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">info</span>
                    Required Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Company *</label>
                      <input
                        {...register('company')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="text"
                        placeholder="Stripe"
                      />
                      {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Job Title *</label>
                      <input
                        {...register('job_title')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="text"
                        placeholder="Frontend Engineer"
                      />
                      {errors.job_title && <p className="text-xs text-red-500 mt-1">{errors.job_title.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Status</label>
                      <select
                        {...register('status')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Location</label>
                      <input
                        {...register('location')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="text"
                        placeholder="Remote"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Details Section */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h4 className="text-sm font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">description</span>
                    Job Details
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Job URL</label>
                      <input
                        {...register('job_url')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="url"
                        placeholder="https://company.com/jobs/123"
                      />
                      {errors.job_url && <p className="text-xs text-red-500 mt-1">{errors.job_url.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Salary Range</label>
                      <input
                        {...register('salary_range')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="text"
                        placeholder="$120k - $150k"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Job Description</label>
                      <textarea
                        {...register('job_description')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition min-h-[100px]"
                        placeholder="Paste the job description here..."
                      />
                    </div>
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h4 className="text-sm font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                    Timeline
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Applied Date</label>
                      <input
                        {...register('applied_at')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="date"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Interview Date</label>
                      <input
                        {...register('interview_date')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="date"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Follow-up Date</label>
                      <input
                        {...register('follow_up_date')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="date"
                      />
                    </div>
                  </div>
                </div>

                {/* Recruiter Section */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h4 className="text-sm font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">person</span>
                    Recruiter Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Recruiter Name</label>
                      <input
                        {...register('recruiter_name')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="text"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Recruiter Email</label>
                      <input
                        {...register('recruiter_email')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="email"
                        placeholder="recruiter@company.com"
                      />
                      {errors.recruiter_email && <p className="text-xs text-red-500 mt-1">{errors.recruiter_email.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Recruiter Phone</label>
                      <input
                        {...register('recruiter_phone')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Resume Section */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <label className="text-sm font-bold text-text-main dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-base">description</span>
                    Select Resume
                  </label>
                  <Controller
                    name="resume_id"
                    control={control}
                    render={({ field }) => (
                      <ResumePicker
                        value={field.value ?? undefined}
                        onChange={(resumeId) => field.onChange(resumeId)}
                        label=""
                      />
                    )}
                  />
                </div>

                {/* Notes Section */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <label className="text-sm font-bold text-text-main dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">notes</span>
                    Additional Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition min-h-[100px]"
                    placeholder="Add any notes about this role..."
                  />
                </div>

                {formError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-3">
                    <p className="text-xs text-red-700 dark:text-red-300">{formError}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Create Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <div className="px-6 py-5">
                <h3 className="text-lg font-bold text-text-main dark:text-white">Delete application?</h3>
                <p className="text-sm text-text-secondary mt-2">
                  This action cannot be undone. The application and its timeline will be permanently removed.
                </p>
                {deleteError && <p className="text-xs text-red-500 mt-3">{deleteError}</p>}
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AuthGate>
    </AppShell>
  )
}

export default ApplicationsPage
